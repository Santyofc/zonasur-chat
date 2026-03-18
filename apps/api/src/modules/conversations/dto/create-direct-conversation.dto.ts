import { IsUUID } from "class-validator";

export class CreateDirectConversationDto {
  @IsUUID(4)
  target_user_id!: string;
}
