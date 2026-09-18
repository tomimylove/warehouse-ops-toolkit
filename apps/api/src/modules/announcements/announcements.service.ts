import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  list() {
    return this.prisma.announcement.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const announcement = await this.prisma.announcement.findUnique({ where: { id } });
    if (!announcement) {
      throw new NotFoundException(`Announcement ${id} not found`);
    }
    return announcement;
  }

  // authorId is hardcoded until the auth/user module exists — the
  // real caller's user id should replace this once AuthModule lands.
  create(dto: CreateAnnouncementDto) {
    return this.prisma.announcement.create({
      data: { ...dto, authorId: 'seed-user' },
    });
  }

  remove(id: string) {
    return this.prisma.announcement.delete({ where: { id } });
  }
}
