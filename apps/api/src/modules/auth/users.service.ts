import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Every user starts on the "Default" role (Role.isDefault) — an admin can
// grant a different one later (future Admin UI), but nobody is ever left
// without a role. This is also where real Azure AD auth hooks in later:
// once a token is validated, its email claim comes through here instead
// of a hardcoded dev address, and a first-time user is auto-provisioned
// with Default rather than requiring a manual seed per person.
@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findOrCreateByEmail(email: string, name: string) {
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) return existing;

    const defaultRole = await this.prisma.role.findFirst({ where: { isDefault: true } });
    if (!defaultRole) {
      throw new NotFoundException('No default role configured — run prisma:seed.');
    }

    return this.prisma.user.create({ data: { email, name, roleId: defaultRole.id } });
  }
}
