import { IsString, IsNotEmpty, IsUUID, IsEnum, IsOptional, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsUUID(4)
  conversation_id!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content!: string;

  @IsOptional()
  @IsEnum(['text', 'image', 'video', 'audio', 'file'])
  type?: string = 'text';

  @IsOptional()
  @IsUUID(4)
  reply_to_id?: string;

  @IsOptional()
  @IsString()
  temp_id?: string;
}
