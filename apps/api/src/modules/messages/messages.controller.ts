import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtGuard } from '../../common/guards/jwt.guard';
import { CurrentUser, AuthUser } from '../../common/decorators/current-user.decorator';

@Controller('messages')
@UseGuards(JwtGuard)
export class MessagesController {
  constructor(private readonly messages: MessagesService) {}

  /** POST /api/messages — rate limited to 30/min */
  @Post()
  @Throttle({ medium: { limit: 30, ttl: 60_000 } })
  async create(@CurrentUser() user: AuthUser, @Body() dto: CreateMessageDto) {
    return this.messages.create(user.id, dto);
  }
}
