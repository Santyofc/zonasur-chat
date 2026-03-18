import { Module } from "@nestjs/common";
import { ConversationsController } from "./conversations.controller";
import { ConversationsService } from "./conversations.service";
import { JwtGuard } from "../../common/guards/jwt.guard";
import { MessagesModule } from "../messages/messages.module";

@Module({
  imports: [MessagesModule],
  controllers: [ConversationsController],
  providers: [ConversationsService, JwtGuard],
  exports: [ConversationsService],
})
export class ConversationsModule {}
