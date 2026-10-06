import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // Powers the project gallery's mini-dashboard (task/done counts per
  // card) — "Done" is a name match against the board's default column set
  // (boards.service.ts), not a stored isDone flag, since there's no
  // column-editing UI yet for that to actually diverge from.
  async list() {
    const projects = await this.prisma.project.findMany({
      orderBy: { createdAt: 'asc' },
      include: { boards: { orderBy: { order: 'asc' }, include: { columns: { orderBy: { order: 'asc' } } } } },
    });

    const stats = await Promise.all(
      projects.map(async (project) => {
        const where = { board: { projectId: project.id }, parentId: null };
        const [taskCount, doneCount] = await Promise.all([
          this.prisma.task.count({ where }),
          this.prisma.task.count({ where: { ...where, column: { name: 'Done' } } }),
        ]);
        return { taskCount, doneCount };
      }),
    );

    return projects.map((project, i) => ({ ...project, ...stats[i] }));
  }

  async get(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { boards: { orderBy: { order: 'asc' }, include: { columns: { orderBy: { order: 'asc' } } } } },
    });
    if (!project) throw new NotFoundException(`Project ${id} not found`);
    return project;
  }

  create(dto: CreateProjectDto) {
    return this.prisma.project.create({ data: { name: dto.name } });
  }
}
