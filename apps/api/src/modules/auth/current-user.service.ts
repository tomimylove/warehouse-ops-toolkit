import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UsersService } from './users.service';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  permissions: string[];
}

// Single seam between "who is making this request" and everything else —
// right now it always resolves the seeded dev user; swapping in real Azure
// AD later means changing only this method (validate the token, read its
// email claim), not the guard or any controller that uses it. Routes
// through UsersService.findOrCreateByEmail so the same "new user gets the
// Default role" behavior already applies here, not just once auth lands.
@Injectable()
export class CurrentUserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
  ) {}

  async get(): Promise<CurrentUser> {
    const identity = await this.users.findOrCreateByEmail('dev@warehouse-ops.local', 'Dev User');

    const role = await this.prisma.role.findUniqueOrThrow({
      where: { id: identity.roleId },
      include: { permissions: true },
    });

    return {
      id: identity.id,
      email: identity.email,
      name: identity.name,
      permissions: role.permissions.map((p) => p.key),
    };
  }
}
