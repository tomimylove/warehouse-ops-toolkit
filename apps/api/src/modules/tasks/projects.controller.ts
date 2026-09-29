import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermission } from '../auth/require-permission.decorator';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Controller('projects')
@UseGuards(PermissionsGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @RequirePermission('tasks:view')
  list() {
    return this.projects.list();
  }

  @Post()
  @RequirePermission('tasks:create')
  create(@Body() dto: CreateProjectDto) {
    return this.projects.create(dto);
  }
}
