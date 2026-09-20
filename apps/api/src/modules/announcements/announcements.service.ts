import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  // Pinned first, newest first within each group — the FSA behavior
  // (specs/features/01-announcements.md): pin state overrides recency.
  list() {
    return this.prisma.announcement.findMany({
      orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async get(id: string) {
    const announcement = await this.prisma.announcement.findUnique({ where: { id } });
    if (!announcement) {
      throw new NotFoundException(`Announcement ${id} not found`);
    }
    return announcement;
  }

  create(dto: CreateAnnouncementDto, authorId: string) {
    return this.prisma.announcement.create({
      data: { ...dto, authorId },
    });
  }

  async update(id: string, dto: UpdateAnnouncementDto) {
    await this.get(id);
    return this.prisma.announcement.update({ where: { id }, data: dto });
  }

  remove(id: string) {
    return this.prisma.announcement.delete({ where: { id } });
  }
}
