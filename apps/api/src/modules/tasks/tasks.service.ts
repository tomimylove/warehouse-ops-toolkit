import { Injectable, NotFoundException } from '@nestjs/common';
import type { Task, TaskRecurrence } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';

const include = {
  assignee: { select: { id: true, name: true } },
} as const;

const RECUR_DAYS: Record<TaskRecurrence, number> = { NONE: 0, DAILY: 1, WEEKLY: 7, MONTHLY: 30 };

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  // Board tasks (Board view — grouped by column). Notes (boardId null,
  // scoped to their author) go through listNotes() instead, not this.
  async listForBoard(boardId: string) {
    const tasks = await this.prisma.task.findMany({
      where: { boardId },
      orderBy: [{ order: 'asc' }],
      // Subtasks live with boardId: null (schema comment on Task.parentId),
      // so this list can't eager-load the full rows the way get() does —
      // just enough (completed) to show the card's progress bar/chevron.
      // The actual subtask rows are fetched lazily (GET /tasks/:id) on
      // expand, so this stays a flat list, not N+1 queries.
      include: { ...include, subtasks: { select: { completed: true } } },
    });
    return tasks.map(({ subtasks, ...task }) => ({
      ...task,
      subtaskStats: subtasks.length > 0 ? { total: subtasks.length, done: subtasks.filter((s) => s.completed).length } : null,
    }));
  }

  // Personal notes — top-level (no parent), no board, one author's own
  // only. Same Task table as everything else (specs/ARCHITECTURE.md,
  // раздел 12); this is just the query that makes it behave like the old
  // localStorage list did. parentId: null matters — otherwise a subtask
  // added to a board task (which has no boardId of its own, see create())
  // would incorrectly show up here as if it were a personal note.
  listNotes(authorId: string) {
    return this.prisma.task.findMany({
      where: { boardId: null, parentId: null, authorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      include: { ...include, subtasks: { orderBy: { createdAt: 'asc' }, include } },
    });
    if (!task) throw new NotFoundException(`Task ${id} not found`);
    return task;
  }

  async create(dto: CreateTaskDto, authorId: string) {
    if (dto.boardId) {
      const board = await this.prisma.board.findUnique({ where: { id: dto.boardId } });
      if (!board) throw new NotFoundException(`Board ${dto.boardId} not found`);
    }

    const siblingCount = dto.boardId
      ? await this.prisma.task.count({ where: { boardId: dto.boardId, columnId: dto.columnId ?? null } })
      : 0;

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        boardId: dto.boardId,
        columnId: dto.columnId,
        parentId: dto.parentId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        priority: dto.priority,
        recurrence: dto.recurrence,
        assigneeId: dto.assigneeId,
        order: siblingCount,
        authorId,
      },
      include,
    });

    // Subtasks and personal Notes don't get their own activity feed entry
    // — the feed is a board-task thing (same reasoning TaskDrawer's Chat
    // tab is only meaningful on a real card), so this stays quiet for
    // those rather than logging noise nobody will read.
    if (dto.boardId) await this.log(task.id, authorId, 'Created the task');

    return task;
  }

  async update(id: string, dto: UpdateTaskDto, actorId: string) {
    const before = await this.get(id);

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
      include,
    });

    if (before.boardId) await this.logChanges(task.id, actorId, before, dto);

    // Recurrence fires on landing in a "Done"-named column (the board's
    // default — boards.service.ts) — matching by name since there's no
    // isDone flag or column-editing UI yet for that to diverge from.
    if (dto.columnId && dto.columnId !== before.columnId && task.recurrence !== 'NONE') {
      const column = await this.prisma.column.findUnique({ where: { id: dto.columnId } });
      if (column?.name === 'Done') await this.recur(task);
    }

    return task;
  }

  remove(id: string) {
    // parentId is onDelete: SetNull — subtasks are detached, not deleted,
    // by the DB itself, no manual cleanup needed here.
    return this.prisma.task.delete({ where: { id } });
  }

  listComments(taskId: string) {
    return this.prisma.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  async createComment(taskId: string, authorId: string, dto: CreateTaskCommentDto) {
    return this.prisma.taskComment.create({
      data: { taskId, authorId, text: dto.text },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  listActivity(taskId: string) {
    return this.prisma.taskActivityLog.findMany({
      where: { taskId },
      orderBy: { createdAt: 'desc' },
      include: { actor: { select: { id: true, name: true } } },
    });
  }

  private log(taskId: string, actorId: string, message: string) {
    return this.prisma.taskActivityLog.create({ data: { taskId, actorId, message } });
  }

  // One freeform message per changed field, composed here rather than
  // stored as structured diffs — same call AnnouncementsService's
  // changeSummary makes, and this list is small enough that a diffing
  // layer would be more code than it saves.
  private async logChanges(taskId: string, actorId: string, before: Task, dto: UpdateTaskDto) {
    const messages: string[] = [];
    if (dto.columnId !== undefined && dto.columnId !== before.columnId) {
      const column = await this.prisma.column.findUnique({ where: { id: dto.columnId } });
      messages.push(`Moved to ${column?.name ?? 'another column'}`);
    }
    if (dto.priority !== undefined && dto.priority !== before.priority) {
      messages.push(`Priority set to ${dto.priority}`);
    }
    if (dto.assigneeId !== undefined && dto.assigneeId !== before.assigneeId) {
      if (dto.assigneeId === null) {
        messages.push('Unassigned');
      } else {
        const assignee = await this.prisma.user.findUnique({ where: { id: dto.assigneeId } });
        messages.push(`Assigned to ${assignee?.name ?? 'someone'}`);
      }
    }
    if (dto.dueDate !== undefined) messages.push('Due date changed');
    if (dto.completed !== undefined && dto.completed !== before.completed) {
      messages.push(dto.completed ? 'Marked as done' : 'Reopened');
    }
    for (const message of messages) await this.log(taskId, actorId, message);
  }

  private async recur(task: Task) {
    if (!task.boardId) return;
    const firstColumn = await this.prisma.column.findFirst({ where: { boardId: task.boardId }, orderBy: { order: 'asc' } });
    const base = task.dueDate ?? new Date();
    const nextDue = new Date(base);
    nextDue.setDate(nextDue.getDate() + RECUR_DAYS[task.recurrence]);

    const siblingCount = await this.prisma.task.count({ where: { boardId: task.boardId, columnId: firstColumn?.id ?? null } });

    await this.prisma.task.create({
      data: {
        title: task.title,
        description: task.description,
        boardId: task.boardId,
        columnId: firstColumn?.id,
        order: siblingCount,
        authorId: task.authorId,
        priority: task.priority,
        recurrence: task.recurrence,
        assigneeId: task.assigneeId,
        dueDate: nextDue,
      },
    });
  }
}
