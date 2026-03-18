import {
  Injectable,
  NotFoundException,
  ConflictException,
} from "@nestjs/common";
import { SupabaseService } from "../../config/supabase.service";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class UsersService {
  constructor(private readonly supabase: SupabaseService) {}

  /** Get full user profile by auth_id */
  async findByAuthId(authId: string) {
    const { data, error } = await this.supabase.admin
      .from("users")
      .select("*")
      .eq("auth_id", authId)
      .single();

    if (error || !data) {
      throw new NotFoundException("User profile not found");
    }
    return data;
  }

  /** Get user by public user id */
  async findById(id: string) {
    const { data, error } = await this.supabase.admin
      .from("users")
      .select("id, username, display_name, avatar_url, status, last_seen_at")
      .eq("id", id)
      .single();

    if (error || !data) {
      throw new NotFoundException("User not found");
    }
    return data;
  }

  /** Upsert profile after first login (called by auth sync trigger, but also here as fallback) */
  async upsertProfile(authId: string, email?: string) {
    const username = email?.split("@")[0] ?? `user_${authId.slice(0, 8)}`;
    const displayName = username;

    const { data, error } = await this.supabase.admin
      .from("users")
      .upsert(
        {
          auth_id: authId,
          username,
          display_name: displayName,
          status: "offline",
        },
        { onConflict: "auth_id", ignoreDuplicates: false },
      )
      .select()
      .single();

    if (error) throw new ConflictException(error.message);
    return data;
  }

  /** Update user profile */
  async updateProfile(authId: string, dto: UpdateProfileDto) {
    const { data, error } = await this.supabase.admin
      .from("users")
      .update({ ...dto, updated_at: new Date().toISOString() })
      .eq("auth_id", authId)
      .select()
      .single();

    if (error) throw new ConflictException(error.message);
    return data;
  }

  /** Update last_seen and status */
  async setPresence(authId: string, status: string) {
    await this.supabase.admin
      .from("users")
      .update({ status, last_seen_at: new Date().toISOString() })
      .eq("auth_id", authId);
  }
}
