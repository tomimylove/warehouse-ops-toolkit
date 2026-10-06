import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UpdateTaskCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  text!: string;
}
