import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUser } from '../auth/current-user.service';

const include = {
  author: { select: { id: true, name: true } },
  replyTo: { include: { author: { select: { id: true, name: true } } } },
} as const;

type ReactionsColumn = Record<string, string[]>;
type ResolvedReactions = Record<string, { id: string; name: string }[]>;
interface HasReactions {
  reactions: unknown;
}

@Injectable()
export class AnnouncementCommentsService {
  constructor(private readonly prisma: PrismaService) {}

  // `reactions` is stored as { emoji: userId[] } — the chat UI shows who
  // reacted (WhatsApp-style), so every response resolves those ids to
  // {id, name} in one batched query instead of once per comment.
  private async resolveReactions<T extends HasReactions>(
    comments: T[],
  ): Promise<(Omit<T, 'reactions'> & { reactions: ResolvedReactions })[]> {
    const userIds = new Set<string>();
    for (const comment of comments) {
      for (const ids of Object.values(comment.reactions as ReactionsColumn)) {
        ids.forEach((id) => userIds.add(id));
      }
    }
    const users = await this.prisma.user.findMany({
      where: { id: { in: [...userIds] } },
      select: { id: true, name: true },
    });
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

  async list(announcementId: string) {
    const comments = await this.prisma.announcementComment.findMany({
      where: { announcementId },
      orderBy: { createdAt: 'asc' },
      include,
    });
    return this.resolveReactions(comments);
  }

  async create(announcementId: string, authorId: string, text: string, replyToId?: string) {
    const comment = await this.prisma.announcementComment.create({
      data: { announcementId, authorId, text, replyToId },
      include,
    });
    return this.resolveReaction(comment);
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

  // Editing is author-only — unlike delete, there's no admin override:
  // rewriting someone else's words isn't a moderation action.
  async update(commentId: string, userId: string, text: string) {
    const comment = await this.prisma.announcementComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException(`Comment ${commentId} not found`);
    if (comment.authorId !== userId) {
      throw new ForbiddenException('Only the comment author can edit this comment');
    }
    const updated = await this.prisma.announcementComment.update({
      where: { id: commentId },
      data: { text },
      include,
    });
    return this.resolveReaction(updated);
  }

  // reactions is a { emoji: userId[] } map — toggling removes the user from
  // that emoji's list (and drops the key once empty) or adds them to it.
  async toggleReaction(commentId: string, userId: string, emoji: string) {
    const comment = await this.prisma.announcementComment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException(`Comment ${commentId} not found`);
    const reactions = { ...(comment.reactions as ReactionsColumn) };
    const users = reactions[emoji] ?? [];
    const nextUsers = users.includes(userId) ? users.filter((id) => id !== userId) : [...users, userId];
    if (nextUsers.length > 0) {
      reactions[emoji] = nextUsers;
    } else {
      delete reactions[emoji];
    }
    const updated = await this.prisma.announcementComment.update({
      where: { id: commentId },
      data: { reactions },
      include,
    });
    return this.resolveReaction(updated);
  }
}
