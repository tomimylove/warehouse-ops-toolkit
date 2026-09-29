import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
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
    await this.requireOwnerOrPermission(id, 'tasks:edit');
    return this.tasks.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.requireOwnerOrPermission(id, 'tasks:delete');
    return this.tasks.remove(id);
  }

  private async requireOwnerOrPermission(taskId: string, permission: string) {
    const [task, user] = await Promise.all([this.tasks.get(taskId), this.currentUser.get()]);
    if (task.authorId === user.id) return;
    if (!user.permissions.includes(permission)) {
      throw new ForbiddenException(`Missing permission: ${permission}`);
    }
  }
}
