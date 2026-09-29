import { IsDateString, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  // Omitted entirely -> a personal Note (specs/ARCHITECTURE.md, раздел 12),
  // not an empty string — the service treats "no boardId" as the signal.
  @IsOptional()
  @IsString()
  boardId?: string;

  @IsOptional()
  @IsString()
  columnId?: string;

  @IsOptional()
  @IsString()
  parentId?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
