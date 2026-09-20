import { SetMetadata } from '@nestjs/common';

export const PERMISSION_KEY = 'permission';

// Marks a controller method as gated behind a permission key
// (e.g. "announcements:delete") — read by PermissionsGuard.
export const RequirePermission = (key: string) => SetMetadata(PERMISSION_KEY, key);
