import { IsOptional, IsString, MaxLength, IsUrl } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(32)
  username?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  display_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  bio?: string;

  @IsOptional()
  @IsUrl()
  avatar_url?: string;
}
