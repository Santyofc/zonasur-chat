import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { SupabaseService } from "../../config/supabase.service";

/**
 * JWT Guard for HTTP routes.
 * Extracts Bearer token from Authorization header, verifies with Supabase Auth,
 * and attaches the user payload to request.user.
 */
@Injectable()
export class JwtGuard implements CanActivate {
  private readonly logger = new Logger(JwtGuard.name);

  constructor(private readonly supabase: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user: { id: string; email?: string };
    }>();

    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException(
        "Missing or invalid Authorization header",
      );
    }

    const token = authHeader.slice(7);
    const user = await this.supabase.verifyToken(token);

    if (!user) {
      throw new UnauthorizedException("Invalid or expired token");
    }

    request.user = user;
    return true;
  }
}
