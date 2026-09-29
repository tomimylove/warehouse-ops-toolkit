import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';

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
}
