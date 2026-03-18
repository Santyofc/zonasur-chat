import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SupabaseService } from '../../config/supabase.service';
import { MessagesService } from '../messages/messages.service';
import { PresenceService } from '../presence/presence.service';
import type {
  SendMessagePayload,
  ReadMessagePayload,
  TypingPayload,
  PresencePingPayload,
} from '@zs/types';

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
    origin: process.env.ALLOWED_ORIGINS?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/',
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;
  private readonly logger = new Logger(ChatGateway.name);

  /** userId → socketId mapping for quick lookup */
  private readonly socketUsers = new Map<string, string>(); // socketId → userId

  constructor(
    private readonly supabase: SupabaseService,
    private readonly messages: MessagesService,
    private readonly presence: PresenceService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket gateway initialized');
  }

  // ─── Connection lifecycle ────────────────────────────────────

  async handleConnection(socket: Socket) {
    const token =
      (socket.handshake.auth as Record<string, string>)?.token ??
      socket.handshake.headers?.authorization?.replace('Bearer ', '');

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

    // Attach userId to socket data for later use
    socket.data.userId = user.id;
    socket.data.userAuthId = user.id;

    this.socketUsers.set(socket.id, user.id);
    this.presence.join(user.id, socket.id);

    // Broadcast presence update
    this.server.emit('presence:update', {
      user_id: user.id,
      status: 'online',
      last_seen_at: new Date().toISOString(),
    });

    this.logger.log(`Socket ${socket.id} connected (user: ${user.id})`);
  }

  async handleDisconnect(socket: Socket) {
    const userId = this.socketUsers.get(socket.id);
    if (!userId) return;

    this.socketUsers.delete(socket.id);
    const trulyOffline = this.presence.leave(userId, socket.id);

    if (trulyOffline) {
      // Update last_seen in DB
      await this.supabase.admin
        .from('users')
        .update({ status: 'offline', last_seen_at: new Date().toISOString() })
        .eq('auth_id', userId);

      this.server.emit('presence:update', {
        user_id: userId,
        status: 'offline',
        last_seen_at: new Date().toISOString(),
      });
    }

    this.logger.log(`Socket ${socket.id} disconnected (user: ${userId})`);
  }

  // ─── Room management ─────────────────────────────────────────

  @SubscribeMessage('conversation:join')
  async handleJoinConversation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversation_id: string },
  ) {
    await socket.join(`conv:${data.conversation_id}`);
    socket.emit('conversation:joined', { conversation_id: data.conversation_id });
  }

  @SubscribeMessage('conversation:leave')
  handleLeaveConversation(
    @ConnectedSocket() socket: Socket,
    @MessageBody() data: { conversation_id: string },
  ) {
    void socket.leave(`conv:${data.conversation_id}`);
  }

  // ─── Messaging ────────────────────────────────────────────────

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: SendMessagePayload,
  ) {
    const authId = socket.data.userAuthId as string;
    if (!authId) return;

    try {
      const message = await this.messages.create(authId, {
        conversation_id: payload.conversation_id,
        content: payload.content,
        type: payload.type,
        reply_to_id: payload.reply_to_id,
      });

      // Broadcast to all conversation members
      this.server.to(`conv:${payload.conversation_id}`).emit('message:new', {
        message,
        temp_id: payload.temp_id,
      });

      // Confirm delivery to sender
      socket.emit('message:delivered', {
        message_id: message.id,
        conversation_id: payload.conversation_id,
        user_id: authId,
      });
    } catch (err) {
      socket.emit('error', { message: (err as Error).message });
    }
  }

  @SubscribeMessage('message:read')
  async handleMessageRead(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: ReadMessagePayload,
  ) {
    const authId = socket.data.userAuthId as string;
    if (!authId) return;

    await this.messages.markRead(payload.message_id, authId);

    // Notify conversation members
    this.server.to(`conv:${payload.conversation_id}`).emit('message:read', {
      message_id: payload.message_id,
      conversation_id: payload.conversation_id,
      user_id: authId,
    });
  }

  // ─── Typing indicators ────────────────────────────────────────

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: TypingPayload,
  ) {
    const userId = this.socketUsers.get(socket.id);
    if (!userId) return;

    socket.to(`conv:${payload.conversation_id}`).emit('typing:update', {
      conversation_id: payload.conversation_id,
      user_id: userId,
      is_typing: true,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: TypingPayload,
  ) {
    const userId = this.socketUsers.get(socket.id);
    if (!userId) return;

    socket.to(`conv:${payload.conversation_id}`).emit('typing:update', {
      conversation_id: payload.conversation_id,
      user_id: userId,
      is_typing: false,
    });
  }

  // ─── Presence ─────────────────────────────────────────────────

  @SubscribeMessage('presence:ping')
  handlePresencePing(
    @ConnectedSocket() socket: Socket,
    @MessageBody() _payload: PresencePingPayload,
  ) {
    socket.emit('presence:pong', { ts: Date.now() });
  }
}
