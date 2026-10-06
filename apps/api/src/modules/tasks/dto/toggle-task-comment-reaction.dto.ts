import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ToggleTaskCommentReactionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  emoji!: string;
}
