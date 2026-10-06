import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

// Shared by board reorder and column reorder — the whole sibling set's new
// order in one request, rather than a per-item `order` PATCH per drag end.
export class ReorderDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  orderedIds!: string[];
}
