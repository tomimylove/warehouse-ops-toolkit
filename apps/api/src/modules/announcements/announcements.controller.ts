import { Body, Controller, Delete, ForbiddenException, Get, HttpCode, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUserService } from '../auth/current-user.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { AnnouncementCommentsService } from './announcement-comments.service';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Controller('announcements')
@UseGuards(PermissionsGuard)
export class AnnouncementsController {
  constructor(
    private readonly announcements: AnnouncementsService,
    private readonly comments: AnnouncementCommentsService,
    private readonly currentUser: CurrentUserService,
  ) {}

  @Get()
  @RequirePermission('announcements:view')
  async list() {
    const user = await this.currentUser.get();
    return this.announcements.list(user);
  }

  @Get(':id')
  @RequirePermission('announcements:view')
  async get(@Param('id') id: string) {
    const user = await this.currentUser.get();
    return this.announcements.get(id, user);
  }

  @Post()
  @RequirePermission('announcements:create')
  async create(@Body() dto: CreateAnnouncementDto) {
    const user = await this.currentUser.get();
    return this.announcements.create(dto, user.id);
  }

  // Pinning is its own permission on top of "announcements:edit" — a role
  // can edit the body/title without being allowed to reorder the whole
  // feed for everyone else (FSA behavior, specs/features/01-announcements.md).
  @Patch(':id')
  @RequirePermission('announcements:edit')
  async update(@Param('id') id: string, @Body() dto: UpdateAnnouncementDto) {
    const user = await this.currentUser.get();
    if (dto.pinned !== undefined && !user.permissions.includes('announcements:pin')) {
      throw new ForbiddenException('Missing permission: announcements:pin');
    }
    return this.announcements.update(id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermission('announcements:delete')
  remove(@Param('id') id: string) {
    return this.announcements.remove(id);
  }

  @Post(':id/read')
  @HttpCode(204)
  @RequirePermission('announcements:view')
  async markRead(@Param('id') id: string) {
    const user = await this.currentUser.get();
    await this.announcements.markRead(id, user.id);
  }

  @Post('mark-all-read')
  @HttpCode(204)
  @RequirePermission('announcements:view')
  async markAllRead() {
    const user = await this.currentUser.get();
    await this.announcements.markAllRead(user);
  }

  @Get(':id/versions')
  @RequirePermission('announcements:edit')
  listVersions(@Param('id') id: string) {
    return this.announcements.listVersions(id);
  }

  @Post(':id/versions/:versionId/restore')
  @RequirePermission('announcements:edit')
  async restoreVersion(@Param('id') id: string, @Param('versionId') versionId: string) {
    const user = await this.currentUser.get();
    return this.announcements.restoreVersion(id, versionId, user.id);
  }

  @Get(':id/comments')
  @RequirePermission('announcements:view')
  listComments(@Param('id') id: string) {
    return this.comments.list(id);
  }

  @Post(':id/comments')
  @RequirePermission('announcements:view')
  async createComment(@Param('id') id: string, @Body() dto: CreateCommentDto) {
    const user = await this.currentUser.get();
    return this.comments.create(id, user.id, dto.text);
  }

  @Delete(':id/comments/:commentId')
  @HttpCode(204)
  @RequirePermission('announcements:view')
  async removeComment(@Param('commentId') commentId: string) {
    const user = await this.currentUser.get();
    await this.comments.remove(commentId, user);
  }
}
