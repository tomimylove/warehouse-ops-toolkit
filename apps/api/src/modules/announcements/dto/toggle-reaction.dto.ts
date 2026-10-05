import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ToggleReactionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(8)
  emoji!: string;
}
