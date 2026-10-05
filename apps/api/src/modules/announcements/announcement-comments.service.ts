import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUser } from '../auth/current-user.service';

@Injectable()
export class AnnouncementCommentsService {
  constructor(private readonly prisma: PrismaService) {}

  list(announcementId: string) {
    return this.prisma.announcementComment.findMany({
      where: { announcementId },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  create(announcementId: string, authorId: string, text: string) {
    return this.prisma.announcementComment.create({
      data: { announcementId, authorId, text },
      include: { author: { select: { id: true, name: true } } },
    });
  }

  // Deletable by its own author, or anyone with announcements:delete
  // (specs/DATA_SCHEMA.md, "Comment": "удаление — только автор комментария
  // или admin").
  async remove(commentId: string, user: CurrentUser) {
    const comment = await this.prisma.announcementComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException(`Comment ${commentId} not found`);
    if (comment.authorId !== user.id && !user.permissions.includes('announcements:delete')) {
      throw new ForbiddenException('Only the comment author or an admin can delete this comment');
    }
    await this.prisma.announcementComment.delete({ where: { id: commentId } });
  }

  // reactions is a { emoji: userId[] } map — toggling removes the user from
  // that emoji's list (and drops the key once empty) or adds them to it.
  async toggleReaction(commentId: string, userId: string, emoji: string) {
    const comment = await this.prisma.announcementComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException(`Comment ${commentId} not found`);
    const reactions = { ...(comment.reactions as Record<string, string[]>) };
    const users = reactions[emoji] ?? [];
    const nextUsers = users.includes(userId) ? users.filter((id) => id !== userId) : [...users, userId];
    if (nextUsers.length > 0) {
      reactions[emoji] = nextUsers;
    } else {
      delete reactions[emoji];
    }
    return this.prisma.announcementComment.update({
      where: { id: commentId },
      data: { reactions },
      include: { author: { select: { id: true, name: true } } },
    });
  }
}
