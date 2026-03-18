import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './supabase.service';

/**
 * Global module that provides a single SupabaseService instance
 * (admin/service-role client) to all feature modules.
 */
@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class SupabaseModule {}
