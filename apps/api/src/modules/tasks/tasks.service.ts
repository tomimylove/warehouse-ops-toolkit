import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  // Board tasks (Board view — grouped by column). Notes (boardId null,
  // scoped to their author) go through listNotes() instead, not this.
  listForBoard(boardId: string) {
    return this.prisma.task.findMany({
      where: { boardId },
      orderBy: [{ order: 'asc' }],
    });
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
      include: { subtasks: { orderBy: { createdAt: 'asc' } } },
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

    return this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        boardId: dto.boardId,
        columnId: dto.columnId,
        parentId: dto.parentId,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
        order: siblingCount,
        authorId,
      },
    });
  }

  async update(id: string, dto: UpdateTaskDto) {
    await this.get(id);
    return this.prisma.task.update({
      where: { id },
      data: {
        ...dto,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      },
    });
  }

  async remove(id: string) {
    // parentId has no DB-level cascade (see schema.prisma) — detach any
    // subtasks first so the delete doesn't fail on the FK.
    await this.prisma.task.updateMany({ where: { parentId: id }, data: { parentId: null } });
    return this.prisma.task.delete({ where: { id } });
  }
}
