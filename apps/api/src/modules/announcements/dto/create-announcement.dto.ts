import { IsArray, IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateAnnouncementDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title!: string;

  @IsString()
  @IsNotEmpty()
  body!: string;

  @IsOptional()
  @IsBoolean()
  pinned?: boolean;

  // "Limit to specific teams" unchecked (the common case) — omit this
  // entirely, or pass true; teamIds then stays empty and nothing is
  // restricted. False only when teamIds is non-empty.
  @IsOptional()
  @IsBoolean()
  visibleToAll?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  teamIds?: string[];
}
