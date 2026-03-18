import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

export interface AuthUser {
  id: string;
  email?: string;
}

/**
 * @CurrentUser() decorator — extracts the authenticated user from the request.
 * Must be used in controllers protected by JwtGuard.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthUser }>();
    if (!request.user) {
      throw new UnauthorizedException('No user in request context');
    }
    return request.user;
  },
);
