import { Module } from "@nestjs/common";
import { MessagesController } from "./messages.controller";
import { MessagesService } from "./messages.service";
import { JwtGuard } from "../../common/guards/jwt.guard";

@Module({
  controllers: [MessagesController],
  providers: [MessagesService, JwtGuard],
  exports: [MessagesService],
})
export class MessagesModule {}
