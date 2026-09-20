import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUserService } from '../auth/current-user.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Controller('announcements')
@UseGuards(PermissionsGuard)
export class AnnouncementsController {
  constructor(
    private readonly announcements: AnnouncementsService,
    private readonly currentUser: CurrentUserService,
  ) {}

  @Get()
  @RequirePermission('announcements:view')
  list() {
    return this.announcements.list();
  }

  @Get(':id')
  @RequirePermission('announcements:view')
  get(@Param('id') id: string) {
    return this.announcements.get(id);
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
    if (dto.pinned !== undefined) {
      const user = await this.currentUser.get();
      if (!user.permissions.includes('announcements:pin')) {
        throw new ForbiddenException('Missing permission: announcements:pin');
      }
    }
    return this.announcements.update(id, dto);
  }

  @Delete(':id')
  @RequirePermission('announcements:delete')
  remove(@Param('id') id: string) {
    return this.announcements.remove(id);
  }
}
