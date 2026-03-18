import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { SupabaseService } from '../../config/supabase.service';
import { CreateDirectConversationDto } from './dto/create-direct-conversation.dto';

@Injectable()
export class ConversationsService {
  constructor(private readonly supabase: SupabaseService) {}

  /** Get all conversations for a user (ordered by last message) */
  async findAllForUser(userId: string) {
    const { data, error } = await this.supabase.admin.rpc(
      'get_user_conversations',
      { p_user_id: userId },
    );
    if (error) throw new BadRequestException(error.message);
    return data ?? [];
  }

  /** Get or create a 1:1 direct conversation */
  async findOrCreateDirect(
    authUserId: string,
    dto: CreateDirectConversationDto,
  ) {
    // Resolve public user id from auth_id
    const { data: me } = await this.supabase.admin
      .from('users')
      .select('id')
      .eq('auth_id', authUserId)
      .single();
    if (!me) throw new NotFoundException('Your user profile was not found');

    const { data, error } = await this.supabase.admin.rpc(
      'get_or_create_direct_conversation',
      {
        p_user_a: me.id,
        p_user_b: dto.target_user_id,
      },
    );
    if (error) throw new BadRequestException(error.message);
    return data;
  }

  /** Get a conversation by id (verifies membership) */
  async findOne(conversationId: string, authUserId: string) {
    const { data: me } = await this.supabase.admin
      .from('users')
      .select('id')
      .eq('auth_id', authUserId)
      .single();
    if (!me) throw new NotFoundException('User not found');

    const { data, error } = await this.supabase.admin
      .from('conversations')
      .select(
        `*, conversation_members!inner(user_id, role, joined_at, last_read_at)`,
      )
      .eq('id', conversationId)
      .eq('conversation_members.user_id', me.id)
      .single();

    if (error || !data) throw new NotFoundException('Conversation not found');
    return data;
  }

  async verifyMembership(conversationId: string, authUserId: string): Promise<boolean> {
    const { data: me } = await this.supabase.admin
      .from('users')
      .select('id')
      .eq('auth_id', authUserId)
      .single();
    if (!me) return false;

    const { data } = await this.supabase.admin
      .from('conversation_members')
      .select('id')
      .eq('conversation_id', conversationId)
      .eq('user_id', me.id)
      .single();

    return !!data;
  }
}
