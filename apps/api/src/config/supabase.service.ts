import { Injectable, OnModuleInit, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Server-side Supabase admin client.
 * Uses the SERVICE ROLE key — never expose to client.
 * All queries bypass RLS — apply business-logic access control in NestJS services.
 */
@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private client!: SupabaseClient;

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    const url =
      this.config.get<string>("SUPABASE_URL") ??
      this.config.getOrThrow<string>("NEXT_PUBLIC_SUPABASE_URL");
    const serviceRoleKey = this.config.getOrThrow<string>(
      "SUPABASE_SERVICE_ROLE_KEY",
    );

    this.client = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    this.logger.log("Supabase admin client initialized");
  }

  /** Returns the admin Supabase client */
  get admin(): SupabaseClient {
    return this.client;
  }

  /**
   * Verify a Supabase JWT and return the user.
   * Uses getUser() to call Supabase Auth API — reliable across all auth methods.
   */
  async verifyToken(
    token: string,
  ): Promise<{ id: string; email?: string } | null> {
    const { data, error } = await this.client.auth.getUser(token);
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email };
  }
}
