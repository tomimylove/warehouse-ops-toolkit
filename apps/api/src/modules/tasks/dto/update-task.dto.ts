import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
import { TaskPriority, TaskRecurrence } from '@prisma/client';

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  columnId?: string;

  @IsOptional()
  @IsInt()
  order?: number;

  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @IsOptional()
  @IsEnum(TaskRecurrence)
  recurrence?: TaskRecurrence;

  // Explicit null clears the assignee — class-validator's @IsOptional lets
  // undefined through untouched but would also wave null past @IsString,
  // so it's allowed here deliberately (the service passes it straight to
  // Prisma, which treats null as "unset the relation").
  @IsOptional()
  @IsString()
  assigneeId?: string | null;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
