import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { CurrentUser } from '../auth/current-user.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

// Last N versions kept per announcement (specs/DATA_SCHEMA.md, "История
// версий") — accidental-edit protection, not a full audit log.
const MAX_VERSIONS = 10;

const include = {
  teams: { include: { team: true } },
  author: { select: { id: true, name: true } },
} as const;

function toDto(row: Awaited<ReturnType<AnnouncementsService['findRaw']>>, isRead: boolean) {
  const { teams, ...rest } = row;
  return { ...rest, teams: teams.map((t) => t.team), isRead };
}

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  private async findRaw(id: string) {
    const row = await this.prisma.announcement.findUnique({ where: { id }, include });
    if (!row) throw new NotFoundException(`Announcement ${id} not found`);
    return row;
  }

  // A plain reader only sees visibleToAll announcements plus ones limited
  // to their own team; announcements:edit bypasses the restriction
  // entirely (specs/features/01-announcements.md, Решение 91).
  async list(user: CurrentUser) {
    const canSeeAll = user.permissions.includes('announcements:edit');
    const visibilityOr = [{ visibleToAll: true }, ...(user.teamId ? [{ teams: { some: { teamId: user.teamId } } }] : [])];
    const where = canSeeAll ? {} : { OR: visibilityOr };

    const [rows, reads] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        include,
        orderBy: [{ pinned: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.announcementRead.findMany({ where: { userId: user.id }, select: { announcementId: true } }),
    ]);
    const readIds = new Set(reads.map((r) => r.announcementId));
    return rows.map((row) => toDto(row, readIds.has(row.id)));
  }

  async get(id: string, user: CurrentUser) {
    const row = await this.prisma.announcement.findUnique({ where: { id }, include });
    if (!row) throw new NotFoundException(`Announcement ${id} not found`);
    const read = await this.prisma.announcementRead.findUnique({
      where: { announcementId_userId: { announcementId: id, userId: user.id } },
    });
    return toDto(row, read !== null);
  }

  async create(dto: CreateAnnouncementDto, authorId: string) {
    const { teamIds, ...data } = dto;
    const row = await this.prisma.announcement.create({
      data: {
        ...data,
        authorId,
        teams: teamIds?.length ? { create: teamIds.map((teamId) => ({ teamId })) } : undefined,
      },
      include,
    });
    if (dto.pinned) await this.unpinOthers(row.id);
    return toDto(row, false);
  }

  async update(id: string, dto: UpdateAnnouncementDto, userId: string) {
    const before = await this.findRaw(id);
    const { teamIds, ...data } = dto;
    const changes = changeSummary(before, dto);

    // A bare pin/unpin toggle doesn't warrant a version snapshot — skipping
    // it for that one-field case saves 2-3 round trips on the single most
    // frequent write this module makes, and the write + read-status lookup
    // below run in parallel instead of one after another for the same reason.
    const onlyPinToggled = changes.length === 1 && (changes[0] === 'Pinned' || changes[0] === 'Unpinned');

    const [row, read] = await Promise.all([
      this.prisma.announcement.update({
        where: { id },
        data: {
          ...data,
          teams:
            teamIds !== undefined
              ? { deleteMany: {}, create: teamIds.map((teamId) => ({ teamId })) }
              : undefined,
        },
        include,
      }),
      this.prisma.announcementRead.findUnique({
        where: { announcementId_userId: { announcementId: id, userId } },
      }),
      onlyPinToggled ? Promise.resolve() : this.snapshotVersion(id, before, userId, changes),
      // Only one announcement can be pinned at a time — pinning this one
      // demotes whatever was pinned before, rather than piling them up.
      dto.pinned === true ? this.unpinOthers(id) : Promise.resolve(),
    ]);
    return toDto(row, read !== null);
  }

  private unpinOthers(excludeId: string) {
    return this.prisma.announcement.updateMany({
      where: { pinned: true, id: { not: excludeId } },
      data: { pinned: false },
    });
  }

  remove(id: string) {
    return this.prisma.announcement.delete({ where: { id } });
  }

  async markRead(id: string, userId: string) {
    await this.prisma.announcementRead.upsert({
      where: { announcementId_userId: { announcementId: id, userId } },
      update: {},
      create: { announcementId: id, userId },
    });
  }

  async markAllRead(user: CurrentUser) {
    const visible = await this.list(user);
    await this.prisma.announcementRead.createMany({
      data: visible.filter((a) => !a.isRead).map((a) => ({ announcementId: a.id, userId: user.id })),
      skipDuplicates: true,
    });
  }

  listVersions(announcementId: string) {
    return this.prisma.announcementVersion.findMany({
      where: { announcementId },
      orderBy: { savedAt: 'desc' },
      include: { savedBy: { select: { id: true, name: true } } },
    });
  }

  async restoreVersion(announcementId: string, versionId: string, userId: string) {
    const version = await this.prisma.announcementVersion.findUnique({ where: { id: versionId } });
    if (!version || !version.snapshot || version.announcementId !== announcementId) {
      throw new NotFoundException(`Version ${versionId} not found for announcement ${announcementId}`);
    }
    const snapshot = version.snapshot as { title: string; body: string; pinned: boolean; visibleToAll: boolean; teamIds: string[] };

    const before = await this.findRaw(announcementId);
    // The restore itself becomes a new version too — the old state right
    // before restoring isn't lost either.
    await this.snapshotVersion(announcementId, before, userId, [`Restored to version from ${version.savedAt.toISOString()}`]);

    const row = await this.prisma.announcement.update({
      where: { id: announcementId },
      data: {
        title: snapshot.title,
        body: snapshot.body,
        pinned: snapshot.pinned,
        visibleToAll: snapshot.visibleToAll,
        teams: { deleteMany: {}, create: snapshot.teamIds.map((teamId) => ({ teamId })) },
      },
      include,
    });
    if (snapshot.pinned) await this.unpinOthers(announcementId);
    return toDto(row, true);
  }

  private async snapshotVersion(
    announcementId: string,
    before: Awaited<ReturnType<AnnouncementsService['findRaw']>>,
    savedById: string,
    changes: string[],
  ) {
    await this.prisma.announcementVersion.create({
      data: {
        announcementId,
        savedById,
        changes,
        snapshot: {
          title: before.title,
          body: before.body,
          pinned: before.pinned,
          visibleToAll: before.visibleToAll,
          teamIds: before.teams.map((t) => t.teamId),
        },
      },
    });

    const extra = await this.prisma.announcementVersion.findMany({
      where: { announcementId },
      orderBy: { savedAt: 'desc' },
      skip: MAX_VERSIONS,
      select: { id: true },
    });
    if (extra.length) {
      await this.prisma.announcementVersion.deleteMany({ where: { id: { in: extra.map((v) => v.id) } } });
    }
  }
}

function changeSummary(before: { title: string; pinned: boolean; visibleToAll: boolean }, dto: UpdateAnnouncementDto) {
  const changes: string[] = [];
  if (dto.title !== undefined && dto.title !== before.title) changes.push('Title changed');
  if (dto.body !== undefined) changes.push('Body changed');
  if (dto.pinned !== undefined && dto.pinned !== before.pinned) changes.push(dto.pinned ? 'Pinned' : 'Unpinned');
  if (dto.visibleToAll !== undefined && dto.visibleToAll !== before.visibleToAll) changes.push('Audience changed');
  if (dto.teamIds !== undefined) changes.push('Audience changed');
  return changes;
}
