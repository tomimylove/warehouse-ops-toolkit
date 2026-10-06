import { IsOptional, IsString, MaxLength, Matches } from 'class-validator';

export class UpdateColumnDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  // Hex color or null to clear it — class-validator's @IsOptional lets
  // undefined through untouched but also lets null bypass the @Matches
  // check below it, which is what "clear the color" needs.
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  color?: string | null;
}
