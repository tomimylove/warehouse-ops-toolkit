import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { ReorderDto } from './dto/reorder.dto';

@Controller('projects/:projectId/boards')
@UseGuards(PermissionsGuard)
export class BoardsController {
  constructor(private readonly boards: BoardsService) {}

  @Get()
  @RequirePermission('tasks:view')
  list(@Param('projectId') projectId: string) {
    return this.boards.listForProject(projectId);
  }

  @Post()
  @RequirePermission('tasks:create')
  create(@Param('projectId') projectId: string, @Body() dto: CreateBoardDto) {
    return this.boards.createForProject(projectId, dto);
  }

  // Whole tab order in one request (drag end) — see ReorderDto. Comes
  // before the :id route below so Nest doesn't match "reorder" as an id.
  @Patch('reorder')
  @RequirePermission('tasks:edit')
  reorder(@Param('projectId') projectId: string, @Body() dto: ReorderDto) {
    return this.boards.reorderBoards(projectId, dto.orderedIds);
  }

  @Patch(':id')
  @RequirePermission('tasks:edit')
  update(@Param('id') id: string, @Body() dto: UpdateBoardDto) {
    return this.boards.updateBoard(id, dto);
  }
}
