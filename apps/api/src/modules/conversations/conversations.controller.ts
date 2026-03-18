import { Controller, Get, Post, Body, Param, UseGuards } from "@nestjs/common";
import { ConversationsService } from "./conversations.service";
import { MessagesService } from "../messages/messages.service";
import { JwtGuard } from "../../common/guards/jwt.guard";
import {
  CurrentUser,
  AuthUser,
} from "../../common/decorators/current-user.decorator";
import { CreateDirectConversationDto } from "./dto/create-direct-conversation.dto";

@Controller("conversations")
@UseGuards(JwtGuard)
export class ConversationsController {
  constructor(
    private readonly conversations: ConversationsService,
    private readonly messages: MessagesService,
  ) {}

  /** GET /api/conversations */
  @Get()
  async getAll(@CurrentUser() user: AuthUser) {
    return this.conversations.findAllForUser(user.id);
  }

  /** POST /api/conversations/direct */
  @Post("direct")
  async createDirect(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateDirectConversationDto,
  ) {
    return this.conversations.findOrCreateDirect(user.id, dto);
  }

  /** GET /api/conversations/:id/messages */
  @Get(":id/messages")
  async getMessages(
    @CurrentUser() user: AuthUser,
    @Param("id") conversationId: string,
  ) {
    // Verify membership before returning messages
    await this.conversations.findOne(conversationId, user.id);
    return this.messages.findByConversation(conversationId);
  }
}
