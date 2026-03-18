import { Injectable, NotFoundException } from "@nestjs/common";
import { SupabaseService } from "../../config/supabase.service";

@Injectable()
export class UserIdentityService {
  constructor(private readonly supabase: SupabaseService) {}

  async resolvePublicUserId(authUserId: string): Promise<string | null> {
    const { data, error } = await this.supabase.admin
      .from("users")
      .select("id")
      .eq("auth_id", authUserId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.id;
  }

  async resolvePublicUserIdOrThrow(authUserId: string): Promise<string> {
    const publicUserId = await this.resolvePublicUserId(authUserId);
    if (!publicUserId) {
      throw new NotFoundException("User profile not found");
    }
    return publicUserId;
  }
}
