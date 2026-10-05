import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TeamsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.team.findMany({ orderBy: { name: 'asc' } });
  }

  create(name: string) {
    return this.prisma.team.create({ data: { name } });
  }

  remove(id: string) {
    return this.prisma.team.delete({ where: { id } });
  }
}
