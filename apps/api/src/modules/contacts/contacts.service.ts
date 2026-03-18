import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { SupabaseService } from "../../config/supabase.service";
import { ContactRequestDto } from "./dto/contact-request.dto";
import { UserIdentityService } from "../../common/services/user-identity.service";

@Injectable()
export class ContactsService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly userIdentity: UserIdentityService,
  ) {}

  private async resolveUserId(authId: string): Promise<string> {
    const userId = await this.userIdentity.resolvePublicUserId(authId);
    if (!userId) throw new NotFoundException("User not found");
    return userId;
  }

  async findAll(authUserId: string) {
    const userId = await this.resolveUserId(authUserId);
    const { data, error } = await this.supabase.admin
      .from("contacts")
      .select(
        "*, contact:users!contacts_contact_user_id_fkey(id, username, display_name, avatar_url, status, last_seen_at)",
      )
      .eq("user_id", userId)
      .neq("status", "blocked");
    if (error) throw new NotFoundException(error.message);
    return data ?? [];
  }

  async sendRequest(authUserId: string, dto: ContactRequestDto) {
    const userId = await this.resolveUserId(authUserId);

    if (userId === dto.target_user_id) {
      throw new ConflictException("Cannot add yourself as a contact");
    }

    // Check for existing contact
    const { data: existing } = await this.supabase.admin
      .from("contacts")
      .select("id, status")
      .eq("user_id", userId)
      .eq("contact_user_id", dto.target_user_id)
      .single();

    if (existing) {
      if (existing.status === "accepted")
        throw new ConflictException("Already a contact");
      if (existing.status === "pending")
        throw new ConflictException("Request already sent");
    }

    const { data, error } = await this.supabase.admin
      .from("contacts")
      .insert({
        user_id: userId,
        contact_user_id: dto.target_user_id,
        status: "pending",
      })
      .select()
      .single();
    if (error) throw new ConflictException(error.message);
    return data;
  }

  async acceptRequest(authUserId: string, contactId: string) {
    const userId = await this.resolveUserId(authUserId);

    // Find the pending request directed TO this user
    const { data: contact } = await this.supabase.admin
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .eq("contact_user_id", userId)
      .eq("status", "pending")
      .single();

    if (!contact) throw new NotFoundException("Contact request not found");

    // Accept both directions
    await this.supabase.admin
      .from("contacts")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", contactId);

    // Upsert reverse
    await this.supabase.admin.from("contacts").upsert(
      {
        user_id: userId,
        contact_user_id: contact.user_id,
        status: "accepted",
      },
      { onConflict: "user_id,contact_user_id" },
    );

    return { success: true };
  }

  async blockUser(authUserId: string, targetUserId: string) {
    const userId = await this.resolveUserId(authUserId);
    await this.supabase.admin
      .from("blocks")
      .upsert(
        { blocker_id: userId, blocked_id: targetUserId },
        { onConflict: "blocker_id,blocked_id" },
      );
    return { success: true };
  }
}
