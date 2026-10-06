import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  text!: string;

  @IsString()
  @IsOptional()
  replyToId?: string;
}
