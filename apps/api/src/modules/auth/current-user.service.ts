import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  permissions: string[];
}

// Single seam between "who is making this request" and everything else —
// right now it always resolves the seeded dev user; swapping in real Azure
// AD later means changing only this method (validate the token, look up
// User by its email claim), not the guard or any controller that uses it.
@Injectable()
export class CurrentUserService {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<CurrentUser> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { email: 'dev@warehouse-ops.local' },
      include: { role: { include: { permissions: true } } },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      permissions: user.role.permissions.map((p) => p.key),
    };
  }
}
