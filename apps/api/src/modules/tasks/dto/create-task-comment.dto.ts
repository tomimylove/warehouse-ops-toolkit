import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTaskCommentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  text!: string;
}
