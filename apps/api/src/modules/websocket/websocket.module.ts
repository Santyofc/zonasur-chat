import { Module } from "@nestjs/common";
import { ChatGateway } from "./chat.gateway";
import { MessagesModule } from "../messages/messages.module";
import { PresenceModule } from "../presence/presence.module";
import { ConversationsModule } from "../conversations/conversations.module";

@Module({
  imports: [MessagesModule, PresenceModule, ConversationsModule],
  providers: [ChatGateway],
})
export class WebsocketModule {}
