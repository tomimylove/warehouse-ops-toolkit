import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { BoardsService } from './boards.service';
import { CreateColumnDto } from './dto/create-column.dto';

// Separate from BoardsController since that one's scoped under
// projects/:projectId/boards, which this column isn't nested under.
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
