import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('users')
@UseGuards(JwtGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  /** GET /api/users/me */
  @Get('me')
  async getMe(@CurrentUser() user: AuthUser) {
    return this.users.findByAuthId(user.id);
  }

  /** PATCH /api/users/me */
  @Patch('me')
  async updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(user.id, dto);
  }
}
