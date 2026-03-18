import {
  Injectable,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { SupabaseService } from "../../config/supabase.service";
import { CreateMessageDto } from "./dto/create-message.dto";
import { UserIdentityService } from "../../common/services/user-identity.service";

@Injectable()
export class MessagesService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly userIdentity: UserIdentityService,
  ) {}

  /** Create a message (called from both REST and WebSocket) */
  async create(authUserId: string, dto: CreateMessageDto) {
    const senderId =
      await this.userIdentity.resolvePublicUserIdOrThrow(authUserId);

    // Verify membership
    const { data: member } = await this.supabase.admin
      .from("conversation_members")
      .select("id")
      .eq("conversation_id", dto.conversation_id)
      .eq("user_id", senderId)
      .single();
    if (!member)
      throw new ForbiddenException("Not a member of this conversation");

    const { data: message, error } = await this.supabase.admin
      .from("messages")
      .insert({
        conversation_id: dto.conversation_id,
        sender_id: senderId,
        content: dto.content,
        type: dto.type ?? "text",
        reply_to_id: dto.reply_to_id ?? null,
      })
      .select("*, sender:users(id, username, display_name, avatar_url)")
      .single();

    if (error) throw new ForbiddenException(error.message);

    // Update conversation updated_at
    await this.supabase.admin
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", dto.conversation_id);

    return message;
  }

  /** Get paginated messages for a conversation */
  async findByConversation(
    conversationId: string,
    limit = 50,
    before?: string,
  ) {
    let query = this.supabase.admin
      .from("messages")
      .select(
        "*, sender:users(id, username, display_name, avatar_url, status), attachments(*), receipts:message_receipts(*)",
      )
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (before) {
      query = query.lt("created_at", before);
    }

    const { data, error } = await query;
    if (error) throw new NotFoundException(error.message);
    return (data ?? []).reverse();
  }

  /** Mark message as read by a user */
  async markRead(
    messageId: string,
    conversationId: string,
    authUserId: string,
  ) {
    const userId = await this.userIdentity.resolvePublicUserId(authUserId);
    if (!userId) throw new ForbiddenException("User not found");

    const { data: message, error: messageError } = await this.supabase.admin
      .from("messages")
      .select("id, conversation_id")
      .eq("id", messageId)
      .is("deleted_at", null)
      .single();
    if (messageError || !message) {
      throw new NotFoundException("Message not found");
    }
    if (message.conversation_id !== conversationId) {
      throw new ForbiddenException("Message does not belong to conversation");
    }

    const { data: membership } = await this.supabase.admin
      .from("conversation_members")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .single();
    if (!membership) {
      throw new ForbiddenException("Not a member of this conversation");
    }

    const { error } = await this.supabase.admin.from("message_receipts").upsert(
      {
        message_id: messageId,
        user_id: userId,
        status: "read",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "message_id,user_id" },
    );
    if (error) throw new ForbiddenException(error.message);
  }

  /** Find message by ID */
  async findById(messageId: string) {
    const { data } = await this.supabase.admin
      .from("messages")
      .select("*, sender:users(id, username, display_name, avatar_url)")
      .eq("id", messageId)
      .single();
    return data;
  }
}
