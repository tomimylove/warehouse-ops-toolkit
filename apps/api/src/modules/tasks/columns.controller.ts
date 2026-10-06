import { Body, Controller, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { BoardsService } from './boards.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

// create() is nested under the board it belongs to; update() addresses a
// column directly by its own id instead — a second @Controller in the same
// file since Nest ties one route prefix per class.
@Controller('boards/:boardId/columns')
@UseGuards(PermissionsGuard)
export class ColumnsController {
  constructor(private readonly boards: BoardsService) {}

  @Post()
  @RequirePermission('tasks:create')
  create(@Param('boardId') boardId: string, @Body() dto: CreateColumnDto) {
    return this.boards.createColumn(boardId, dto.name);
  }
}

@Controller('columns')
@UseGuards(PermissionsGuard)
export class ColumnController {
  constructor(private readonly boards: BoardsService) {}

  @Patch(':id')
  @RequirePermission('tasks:edit')
  update(@Param('id') id: string, @Body() dto: UpdateColumnDto) {
    return this.boards.updateColumn(id, dto);
  }
}
