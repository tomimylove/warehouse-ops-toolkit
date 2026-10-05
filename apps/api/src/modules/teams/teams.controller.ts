import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamsService } from './teams.service';

// No dedicated teams:* permission yet — Team is currently only consumed by
// Announcements' audience picker, so it rides on that module's keys
// (announcements:view to read the list, announcements:edit to manage it).
// Give Team its own permission once Staff grows into its second consumer.
@Controller('teams')
@UseGuards(PermissionsGuard)
export class TeamsController {
  constructor(private readonly teams: TeamsService) {}

  @Get()
  @RequirePermission('announcements:view')
  list() {
    return this.teams.list();
  }

  @Post()
  @RequirePermission('announcements:edit')
  create(@Body() dto: CreateTeamDto) {
    return this.teams.create(dto.name);
  }

  @Delete(':id')
  @RequirePermission('announcements:edit')
  remove(@Param('id') id: string) {
    return this.teams.remove(id);
  }
}
