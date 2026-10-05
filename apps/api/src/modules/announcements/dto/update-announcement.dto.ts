import { IsArray, IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateAnnouncementDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @IsBoolean()
  pinned?: boolean;

  @IsOptional()
  @IsBoolean()
  visibleToAll?: boolean;

  // Omitted entirely = don't touch team assignments. Pass [] explicitly to
  // clear them.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  teamIds?: string[];
}
