import { Controller, Post, Body, HttpCode } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { IsString, IsNotEmpty } from "class-validator";

class VerifySessionDto {
  @IsString()
  @IsNotEmpty()
  token!: string;
}

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  /** POST /api/auth/session/verify */
  @Post("session/verify")
  @HttpCode(200)
  async verifySession(@Body() dto: VerifySessionDto) {
    return this.auth.verifySession(dto.token);
  }
}
