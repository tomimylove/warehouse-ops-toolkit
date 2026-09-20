import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CurrentUserService } from './current-user.service';
import { PERMISSION_KEY } from './require-permission.decorator';

// Server-side enforcement of @RequirePermission — the sidebar/route gating
// in apps/web is a UX convenience, not the security boundary. A request
// missing the required key is rejected here regardless of what the client
// showed or hid.
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly currentUser: CurrentUserService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.get<string | undefined>(PERMISSION_KEY, context.getHandler());
    if (!required) return true;

    const user = await this.currentUser.get();
    if (!user.permissions.includes(required)) {
      throw new ForbiddenException(`Missing permission: ${required}`);
    }
    return true;
  }
}
