import { Global, Module } from "@nestjs/common";
import { SupabaseService } from "./supabase.service";
import { UserIdentityService } from "../common/services/user-identity.service";

/**
 * Global module that provides a single SupabaseService instance
 * (admin/service-role client) to all feature modules.
 */
@Global()
@Module({
  providers: [SupabaseService, UserIdentityService],
  exports: [SupabaseService, UserIdentityService],
})
export class SupabaseModule {}
