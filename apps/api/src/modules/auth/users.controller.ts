import { Controller, Get, UseGuards } from '@nestjs/common';
import { PermissionsGuard } from './permissions.guard';
import { RequirePermission } from './require-permission.decorator';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(PermissionsGuard)
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get()
  @RequirePermission('tasks:view')
  list() {
    return this.users.list();
  }
}
