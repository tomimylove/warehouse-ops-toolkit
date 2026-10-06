import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateColumnDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;
}
