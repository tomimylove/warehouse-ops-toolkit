import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';

// Every new board starts with this column set — matches the FSA/YouGile
// board layout closely enough to be immediately usable, and keeps column
// management out of the first Tasks slice (specs/ARCHITECTURE.md, раздел
// 12) rather than building a whole column-editing UI up front.
const DEFAULT_COLUMNS = ['To do', 'In progress', 'Done'];

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForProject(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    return this.prisma.board.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
      include: { columns: { orderBy: { order: 'asc' } } },
    });
  }

  async get(id: string) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: { columns: { orderBy: { order: 'asc' } } },
    });
    if (!board) throw new NotFoundException(`Board ${id} not found`);
    return board;
  }

  async createForProject(projectId: string, dto: CreateBoardDto) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    const siblingCount = await this.prisma.board.count({ where: { projectId } });

    return this.prisma.board.create({
      data: {
        projectId,
        name: dto.name,
        order: siblingCount,
        columns: {
          create: DEFAULT_COLUMNS.map((name, order) => ({ name, order })),
        },
      },
      include: { columns: { orderBy: { order: 'asc' } } },
    });
  }

  async createColumn(boardId: string, name: string) {
    const board = await this.prisma.board.findUnique({ where: { id: boardId } });
    if (!board) throw new NotFoundException(`Board ${boardId} not found`);

    const siblingCount = await this.prisma.column.count({ where: { boardId } });
    return this.prisma.column.create({ data: { boardId, name, order: siblingCount } });
  }

  async updateColumn(id: string, data: { name?: string; color?: string | null }) {
    const column = await this.prisma.column.findUnique({ where: { id } });
    if (!column) throw new NotFoundException(`Column ${id} not found`);
    return this.prisma.column.update({ where: { id }, data });
  }
}
