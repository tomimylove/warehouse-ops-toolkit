import { IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, MaxLength } from 'class-validator';
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

  // Replaces the full assignee set (not a merge) — an empty array clears
  // all assignees, same as the old `assigneeId: null` did for the single
  // FK.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assigneeIds?: string[];

  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
