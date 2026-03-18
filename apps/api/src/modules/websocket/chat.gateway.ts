import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from "@nestjs/websockets";
import { Logger } from "@nestjs/common";
import { Server, Socket } from "socket.io";
import { SupabaseService } from "../../config/supabase.service";
import { MessagesService } from "../messages/messages.service";
import { PresenceService } from "../presence/presence.service";
import { ConversationsService } from "../conversations/conversations.service";
import { UserIdentityService } from "../../common/services/user-identity.service";
import { getAllowedOrigins } from "../../common/config/origins";
import type {
  SendMessagePayload,
  ReadMessagePayload,
  TypingPayload,
  PresencePingPayload,
} from "@zs/types";

/**
 * Socket.IO chat gateway.
 *
 * Authentication: client must pass the Supabase JWT in the handshake:
 *   socket = io(API_URL, { auth: { token: supabaseSession.access_token } })
 *
 * Rooms: each conversation uses `conv:<id>` as the room name.
 */
@WebSocketGateway({
  cors: {
    origin: getAllowedOrigins(),
    credentials: true,
  },
  namespace: "/",
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ChatGateway.name);
  private readonly uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  /** socketId -> public user id */
  private readonly socketUsers = new Map<string, string>();

  constructor(
    private readonly supabase: SupabaseService,
    private readonly messages: MessagesService,
    private readonly presence: PresenceService,
    private readonly conversations: ConversationsService,
    private readonly userIdentity: UserIdentityService,
  ) {}

  afterInit(_server: Server) {
    this.logger.log("WebSocket gateway initialized");
  }

  private isUuid(value: unknown): value is string {
    return typeof value === "string" && this.uuidRegex.test(value);
  }

  private isValidMessagePayload(payload: SendMessagePayload): boolean {
    if (!this.isUuid(payload.conversation_id)) {
      return false;
    }
    if (typeof payload.content !== "string") {
      return false;
    }

    const trimmedContent = payload.content.trim();
    if (trimmedContent.length === 0 || trimmedContent.length > 4000) {
      return false;
    }

    if (payload.reply_to_id && !this.isUuid(payload.reply_to_id)) {
      return false;
    }

    const allowedTypes = new Set(["text", "image", "video", "audio", "file"]);
    if (payload.type && !allowedTypes.has(payload.type)) {
      return false;
    }

    return true;
  }

  // ─── Connection lifecycle ────────────────────────────────────

  async handleConnection(socket: Socket) {
    try {
      const authToken = (socket.handshake.auth as { token?: unknown })?.token;
      const headerToken = socket.handshake.headers?.authorization?.replace(
        "Bearer ",
        "",
      );
      const token =
        typeof authToken === "string" && authToken.length > 0
          ? authToken
          : headerToken;

      if (!token) {
        this.logger.warn(`Socket ${socket.id} rejected: no token`);
        socket.disconnect(true);
        return;
      }

      const user = await this.supabase.verifyToken(token);
      if (!user) {
        this.logger.warn(`Socket ${socket.id} rejected: invalid token`);
        socket.disconnect(true);
        return;
      }

      const publicUserId = await this.userIdentity.resolvePublicUserId(user.id);
      if (!publicUserId) {
        this.logger.warn(
          `Socket ${socket.id} rejected: public profile not found for auth ${user.id}`,
        );
        socket.disconnect(true);
        return;
      }

      // Attach both ids to socket data for downstream checks.
      socket.data.userAuthId = user.id;
      socket.data.userId = publicUserId;

      this.socketUsers.set(socket.id, publicUserId);
      this.presence.join(publicUserId, socket.id);

      const now = new Date().toISOString();
      await this.supabase.admin
        .from("users")
        .update({ status: "online", last_seen_at: now })
        .eq("id", publicUserId);

      this.server.emit("presence:update", {
        user_id: publicUserId,
        status: "online",
        last_seen_at: now,
      });

      this.logger.log(`Socket ${socket.id} connected (user: ${publicUserId})`);
    } catch (error) {
      this.logger.error(
        `Socket ${socket.id} connection failed`,
        error instanceof Error ? error.stack : undefined,
      );
      socket.disconnect(true);
    }
  }

  async handleDisconnect(socket: Socket) {
    const userId = this.socketUsers.get(socket.id);
    if (!userId) return;

    this.socketUsers.delete(socket.id);
    const trulyOffline = this.presence.leave(userId, socket.id);

    if (trulyOffline) {
      const now = new Date().toISOString();

      try {
        await this.supabase.admin
          .from("users")
          .update({ status: "offline", last_seen_at: now })
          .eq("id", userId);
      } catch (error) {
        this.logger.warn(
          `Failed to update offline presence for user ${userId}: ${(error as Error).message}`,
        );
      }

      this.server.emit("presence:update", {
        user_id: userId,
        status: "offline",
        last_seen_at: now,
      });
    }

    this.logger.log(`Socket ${socket.id} disconnected (user: ${userId})`);
  }

  // ─── Room management ─────────────────────────────────────────

  @SubscribeMessage("conversation:join")
  async handleJoinConversation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversation_id: string },
  ) {
    const userId = socket.data.userId as string | undefined;
    if (!userId) {
      socket.emit("error", { message: "Unauthorized" });
      return;
    }

    if (!this.isUuid(data?.conversation_id)) {
      socket.emit("error", { message: "Invalid conversation_id" });
      return;
    }

    try {
      const isMember = await this.conversations.verifyMembershipByPublicUserId(
        data.conversation_id,
        userId,
      );

      if (!isMember) {
        this.logger.warn(
          `User ${userId} attempted to join unauthorized room conv:${data.conversation_id}`,
        );
        socket.emit("error", { message: "Unauthorized: Not a member" });
        return;
      }

      await socket.join(`conv:${data.conversation_id}`);
      socket.emit("conversation:joined", {
        conversation_id: data.conversation_id,
      });
    } catch (error) {
      this.logger.warn(
        `Failed room join for user ${userId}: ${(error as Error).message}`,
      );
      socket.emit("error", { message: "Failed to join conversation" });
    }
  }

  @SubscribeMessage("conversation:leave")
  async handleLeaveConversation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversation_id: string },
  ) {
    if (!this.isUuid(data?.conversation_id)) {
      socket.emit("error", { message: "Invalid conversation_id" });
      return;
    }

    try {
      await socket.leave(`conv:${data.conversation_id}`);
    } catch (error) {
      this.logger.warn(
        `Failed room leave for socket ${socket.id}: ${(error as Error).message}`,
      );
    }
  }

  // ─── Messaging ────────────────────────────────────────────────

  @SubscribeMessage("message:send")
  async handleSendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    const authId = socket.data.userAuthId as string | undefined;
    const userId = socket.data.userId as string | undefined;
    if (!authId || !userId) {
      socket.emit("error", { message: "Unauthorized" });
      return;
    }

    if (!this.isValidMessagePayload(payload)) {
      socket.emit("error", { message: "Invalid message payload" });
      return;
    }

    try {
      const isMember = await this.conversations.verifyMembershipByPublicUserId(
        payload.conversation_id,
        userId,
      );
      if (!isMember) {
        socket.emit("error", { message: "Unauthorized: Not a member" });
        return;
      }

      const message = await this.messages.create(authId, {
        conversation_id: payload.conversation_id,
        content: payload.content,
        type: payload.type,
        reply_to_id: payload.reply_to_id,
      });

      // Broadcast to all conversation members
      this.server.to(`conv:${payload.conversation_id}`).emit("message:new", {
        message,
        temp_id: payload.temp_id,
      });

      // Confirm delivery to sender
      socket.emit("message:delivered", {
        message_id: message.id,
        conversation_id: payload.conversation_id,
        user_id: userId,
      });
    } catch (error) {
      this.logger.warn(
        `Send message failed for user ${userId}: ${(error as Error).message}`,
      );
      socket.emit("error", { message: (error as Error).message });
    }
  }

  @SubscribeMessage("message:read")
  async handleMessageRead(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ReadMessagePayload,
  ) {
    const authId = socket.data.userAuthId as string | undefined;
    const userId = socket.data.userId as string | undefined;
    if (!authId || !userId) {
      socket.emit("error", { message: "Unauthorized" });
      return;
    }

    if (
      !this.isUuid(payload?.message_id) ||
      !this.isUuid(payload?.conversation_id)
    ) {
      socket.emit("error", { message: "Invalid read receipt payload" });
      return;
    }

    try {
      // Verify membership
      const isMember = await this.conversations.verifyMembershipByPublicUserId(
        payload.conversation_id,
        userId,
      );
      if (!isMember) {
        socket.emit("error", { message: "Unauthorized: Not a member" });
        return;
      }

      await this.messages.markRead(
        payload.message_id,
        payload.conversation_id,
        authId,
      );

      // Notify conversation members
      this.server.to(`conv:${payload.conversation_id}`).emit("message:read", {
        message_id: payload.message_id,
        conversation_id: payload.conversation_id,
        user_id: userId,
      });
    } catch (error) {
      this.logger.warn(
        `Mark read failed for user ${userId}: ${(error as Error).message}`,
      );
      socket.emit("error", { message: (error as Error).message });
    }
  }

  // ─── Typing indicators ────────────────────────────────────────

  @SubscribeMessage("typing:start")
  async handleTypingStart(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: TypingPayload,
  ) {
    const userId = socket.data.userId as string | undefined;
    if (!userId) {
      socket.emit("error", { message: "Unauthorized" });
      return;
    }

    if (!this.isUuid(payload?.conversation_id)) {
      socket.emit("error", { message: "Invalid conversation_id" });
      return;
    }

    try {
      // Verify membership
      const isMember = await this.conversations.verifyMembershipByPublicUserId(
        payload.conversation_id,
        userId,
      );
      if (!isMember) return;

      socket.to(`conv:${payload.conversation_id}`).emit("typing:update", {
        conversation_id: payload.conversation_id,
        user_id: userId,
        is_typing: true,
      });
    } catch (error) {
      this.logger.warn(
        `Typing start failed for user ${userId}: ${(error as Error).message}`,
      );
    }
  }

  @SubscribeMessage("typing:stop")
  async handleTypingStop(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: TypingPayload,
  ) {
    const userId = socket.data.userId as string | undefined;
    if (!userId) {
      socket.emit("error", { message: "Unauthorized" });
      return;
    }

    if (!this.isUuid(payload?.conversation_id)) {
      socket.emit("error", { message: "Invalid conversation_id" });
      return;
    }

    try {
      // Verify membership
      const isMember = await this.conversations.verifyMembershipByPublicUserId(
        payload.conversation_id,
        userId,
      );
      if (!isMember) return;

      socket.to(`conv:${payload.conversation_id}`).emit("typing:update", {
        conversation_id: payload.conversation_id,
        user_id: userId,
        is_typing: false,
      });
    } catch (error) {
      this.logger.warn(
        `Typing stop failed for user ${userId}: ${(error as Error).message}`,
      );
    }
  }

  // ─── Presence ─────────────────────────────────────────────────

  @SubscribeMessage("presence:ping")
  handlePresencePing(
    @ConnectedSocket() socket: Socket,
    @MessageBody() _payload: PresencePingPayload,
  ) {
    socket.emit("presence:pong", { ts: Date.now() });
  }
}
