import { IsUUID } from "class-validator";

export class ContactRequestDto {
  @IsUUID(4)
  target_user_id!: string;
}
