import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Task, TaskRecurrence } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CreateTaskCommentDto } from './dto/create-task-comment.dto';

const include = {
  assignees: { select: { id: true, name: true } },
} as const;

type TaskWithAssignees = Task & { assignees: { id: string; name: string }[] };

const RECUR_DAYS: Record<TaskRecurrence, number> = { NONE: 0, DAILY: 1, WEEKLY: 7, MONTHLY: 30 };

const commentInclude = {
  author: { select: { id: true, name: true } },
  replyTo: { include: { author: { select: { id: true, name: true } } } },
} as const;

type ReactionsColumn = Record<string, string[]>;
type ResolvedReactions = Record<string, { id: string; name: string }[]>;
interface HasReactions {
  reactions: unknown;
}

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
        assignees: dto.assigneeIds?.length ? { connect: dto.assigneeIds.map((id) => ({ id })) } : undefined,
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
    const { assigneeIds, dueDate, ...rest } = dto;

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        ...rest,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assignees: assigneeIds !== undefined ? { set: assigneeIds.map((uid) => ({ id: uid })) } : undefined,
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

    // A subtask's own completion toggle propagates up to its parent card
    // (the parent itself has no boardId/columnId change to react to here —
    // it's the subtask that changed, not it).
    if (dto.completed !== undefined && dto.completed !== before.completed && before.parentId) {
      await this.cascadeSubtaskCompletion(before.parentId, actorId);
    }

    return task;
  }

  // All subtasks done -> parent marked completed; any one done (while the
  // parent isn't fully done) -> parent moved into its board's "In progress"
  // column, so a card visibly reflects subtask work without the user
  // re-opening the drawer or dragging it themselves.
  private async cascadeSubtaskCompletion(parentId: string, actorId: string) {
    const parent = await this.prisma.task.findUnique({ where: { id: parentId } });
    if (!parent) return;

    const subtasks = await this.prisma.task.findMany({ where: { parentId }, select: { completed: true } });
    if (subtasks.length === 0) return;
    const allDone = subtasks.every((s) => s.completed);
    const anyDone = subtasks.some((s) => s.completed);

    if (allDone !== parent.completed) {
      await this.prisma.task.update({ where: { id: parentId }, data: { completed: allDone } });
      if (parent.boardId) await this.log(parentId, actorId, allDone ? 'All subtasks done — marked as done' : 'Reopened');
    }

    if (anyDone && !allDone && parent.boardId) {
      const inProgress = await this.prisma.column.findFirst({ where: { boardId: parent.boardId, name: 'In progress' } });
      if (inProgress && parent.columnId !== inProgress.id) {
        await this.prisma.task.update({ where: { id: parentId }, data: { columnId: inProgress.id } });
        await this.log(parentId, actorId, 'Moved to In progress');
      }
    }
  }

  remove(id: string) {
    // parentId is onDelete: SetNull — subtasks are detached, not deleted,
    // by the DB itself, no manual cleanup needed here.
    return this.prisma.task.delete({ where: { id } });
  }

  // Same { emoji: userId[] } shape and batched resolution as
  // AnnouncementCommentsService.resolveReactions — kept here rather than
  // factored into a shared service, since Prisma's generated delegate
  // type (announcementComment vs taskComment) differs per model and a
  // generic wrapper would need as much code as this duplication does.
  private async resolveReactions<T extends HasReactions>(
    comments: T[],
  ): Promise<(Omit<T, 'reactions'> & { reactions: ResolvedReactions })[]> {
    const userIds = new Set<string>();
    for (const comment of comments) {
      for (const ids of Object.values(comment.reactions as ReactionsColumn)) {
        ids.forEach((id) => userIds.add(id));
      }
    }
    const users = await this.prisma.user.findMany({ where: { id: { in: [...userIds] } }, select: { id: true, name: true } });
    const byId = new Map(users.map((u) => [u.id, u]));
    return comments.map((comment) => ({
      ...comment,
      reactions: Object.fromEntries(
        Object.entries(comment.reactions as ReactionsColumn).map(([emoji, ids]) => [
          emoji,
          ids.map((id) => byId.get(id)).filter((u): u is { id: string; name: string } => Boolean(u)),
        ]),
      ),
    }));
  }

  private async resolveReaction<T extends HasReactions>(comment: T) {
    const [resolved] = await this.resolveReactions([comment]);
    return resolved;
  }

  async listComments(taskId: string) {
    const comments = await this.prisma.taskComment.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
      include: commentInclude,
    });
    return this.resolveReactions(comments);
  }

  async createComment(taskId: string, authorId: string, dto: CreateTaskCommentDto) {
    const comment = await this.prisma.taskComment.create({
      data: { taskId, authorId, text: dto.text, replyToId: dto.replyToId },
      include: commentInclude,
    });
    return this.resolveReaction(comment);
  }

  // Editing is author-only, same as AnnouncementComment — rewriting
  // someone else's words isn't a moderation action.
  async updateComment(commentId: string, userId: string, text: string) {
    const comment = await this.prisma.taskComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException(`Comment ${commentId} not found`);
    if (comment.authorId !== userId) throw new ForbiddenException('Only the comment author can edit this comment');
    const updated = await this.prisma.taskComment.update({ where: { id: commentId }, data: { text }, include: commentInclude });
    return this.resolveReaction(updated);
  }

  // Deletable by its own author, or anyone with tasks:delete.
  async removeComment(commentId: string, userId: string, canModerate: boolean) {
    const comment = await this.prisma.taskComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException(`Comment ${commentId} not found`);
    if (comment.authorId !== userId && !canModerate) {
      throw new ForbiddenException('Only the comment author or an admin can delete this comment');
    }
    await this.prisma.taskComment.delete({ where: { id: commentId } });
  }

  async toggleCommentReaction(commentId: string, userId: string, emoji: string) {
    const comment = await this.prisma.taskComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException(`Comment ${commentId} not found`);
    const reactions = { ...(comment.reactions as ReactionsColumn) };
    const users = reactions[emoji] ?? [];
    const nextUsers = users.includes(userId) ? users.filter((id) => id !== userId) : [...users, userId];
    if (nextUsers.length > 0) reactions[emoji] = nextUsers;
    else delete reactions[emoji];
    const updated = await this.prisma.taskComment.update({ where: { id: commentId }, data: { reactions }, include: commentInclude });
    return this.resolveReaction(updated);
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
  private async logChanges(taskId: string, actorId: string, before: TaskWithAssignees, dto: UpdateTaskDto) {
    const messages: string[] = [];
    if (dto.columnId !== undefined && dto.columnId !== before.columnId) {
      const column = await this.prisma.column.findUnique({ where: { id: dto.columnId } });
      messages.push(`Moved to ${column?.name ?? 'another column'}`);
    }
    if (dto.priority !== undefined && dto.priority !== before.priority) {
      messages.push(`Priority set to ${dto.priority}`);
    }
    if (dto.assigneeIds !== undefined) {
      const beforeIds = before.assignees.map((a) => a.id).sort();
      const afterIds = [...dto.assigneeIds].sort();
      if (beforeIds.join(',') !== afterIds.join(',')) {
        if (afterIds.length === 0) {
          messages.push('Unassigned');
        } else {
          const assignees = await this.prisma.user.findMany({ where: { id: { in: dto.assigneeIds } } });
          messages.push(`Assigned to ${assignees.map((a) => a.name).join(', ') || 'someone'}`);
        }
      }
    }
    if (dto.dueDate !== undefined) messages.push('Due date changed');
    if (dto.completed !== undefined && dto.completed !== before.completed) {
      messages.push(dto.completed ? 'Marked as done' : 'Reopened');
    }
    for (const message of messages) await this.log(taskId, actorId, message);
  }

  private async recur(task: TaskWithAssignees) {
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
        assignees: task.assignees.length ? { connect: task.assignees.map((a) => ({ id: a.id })) } : undefined,
        dueDate: nextDue,
      },
    });
  }
}
