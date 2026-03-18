import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../../config/supabase.service';

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Verifies a Supabase JWT and returns the auth user.
   * Used by POST /api/auth/session/verify to let the frontend
   * confirm the token is valid from the server side.
   */
  async verifySession(token: string) {
    const user = await this.supabase.verifyToken(token);
    if (!user) throw new UnauthorizedException('Invalid or expired session');
    return { valid: true, user };
  }
}
