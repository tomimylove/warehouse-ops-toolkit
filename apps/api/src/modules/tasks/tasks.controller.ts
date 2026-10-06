import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserService } from '../auth/current-user.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';
import { UpdateTaskCommentDto } from './dto/update-task-comment.dto';
import { ToggleTaskCommentReactionDto } from './dto/toggle-task-comment-reaction.dto';

@Controller('tasks')
@UseGuards(PermissionsGuard)
export class TasksController {
  constructor(
    private readonly tasks: TasksService,
    private readonly currentUser: CurrentUserService,
  ) {}

  // Board tasks: GET /tasks?boardId=... — Notes have their own route
  // below rather than overloading this with an "and mine" query flag.
  @Get()
  @RequirePermission('tasks:view')
  list(@Query('boardId') boardId?: string) {
    if (!boardId) throw new BadRequestException('boardId is required');
    return this.tasks.listForBoard(boardId);
  }

  @Get('mine')
  @RequirePermission('tasks:view')
  async mine() {
    const user = await this.currentUser.get();
    return this.tasks.listNotes(user.id);
  }

  @Get(':id')
  @RequirePermission('tasks:view')
  get(@Param('id') id: string) {
    return this.tasks.get(id);
  }

  @Post()
  @RequirePermission('tasks:create')
  async create(@Body() dto: CreateTaskDto) {
    const user = await this.currentUser.get();
    return this.tasks.create(dto, user.id);
  }

  // Editing/deleting your own task (most commonly a personal note) never
  // needs tasks:edit/tasks:delete — those gate touching other people's
  // work, not your own.
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    const user = await this.requireOwnerOrPermission(id, 'tasks:edit');
    return this.tasks.update(id, dto, user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.requireOwnerOrPermission(id, 'tasks:delete');
    return this.tasks.remove(id);
  }

  @Get(':id/comments')
  @RequirePermission('tasks:view')
  listComments(@Param('id') id: string) {
    return this.tasks.listComments(id);
  }

  @Post(':id/comments')
  @RequirePermission('tasks:view')
  async createComment(@Param('id') id: string, @Body() dto: CreateTaskCommentDto) {
    const user = await this.currentUser.get();
    return this.tasks.createComment(id, user.id, dto);
  }

  @Patch(':id/comments/:commentId')
  @RequirePermission('tasks:view')
  async updateComment(@Param('commentId') commentId: string, @Body() dto: UpdateTaskCommentDto) {
    const user = await this.currentUser.get();
    return this.tasks.updateComment(commentId, user.id, dto.text);
  }

  @Delete(':id/comments/:commentId')
  @HttpCode(204)
  @RequirePermission('tasks:view')
  async removeComment(@Param('commentId') commentId: string) {
    const user = await this.currentUser.get();
    await this.tasks.removeComment(commentId, user.id, user.permissions.includes('tasks:delete'));
  }

  @Post(':id/comments/:commentId/reactions')
  @RequirePermission('tasks:view')
  async toggleCommentReaction(@Param('commentId') commentId: string, @Body() dto: ToggleTaskCommentReactionDto) {
    const user = await this.currentUser.get();
    return this.tasks.toggleCommentReaction(commentId, user.id, dto.emoji);
  }

  @Get(':id/activity')
  @RequirePermission('tasks:view')
  listActivity(@Param('id') id: string) {
    return this.tasks.listActivity(id);
  }

  private async requireOwnerOrPermission(taskId: string, permission: string) {
    const [task, user] = await Promise.all([this.tasks.get(taskId), this.currentUser.get()]);
    if (task.authorId === user.id) return user;
    if (!user.permissions.includes(permission)) {
      throw new ForbiddenException(`Missing permission: ${permission}`);
    }
    return user;
  }
}
