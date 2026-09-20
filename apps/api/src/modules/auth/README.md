# Auth (Core)

Granular RBAC — no fixed admin/editor/reader tiers. A `Role` is a named
bundle of permission-key strings (`RolePermission.key`, e.g.
`"announcements:create"`); a module adds new keys by seeding data, never a
schema migration. A user with none of a module's keys doesn't just lose its
buttons — the frontend sidebar entry and the route itself are both gated
(`apps/web/src/app/PermissionsContext.tsx` / `RequirePermission.tsx`), and
this module enforces the same thing server-side, which is the actual
security boundary.

## Pieces

- `UsersService.findOrCreateByEmail(email, name)` — any email never seen
  before is created on the spot, assigned whichever `Role` has
  `isDefault: true` ("Default", seeded by `prisma/seed.ts`). Nobody is ever
  left without a role. An admin can move a user to a different role later
  (future Admin UI does a plain `User.roleId` update — no code change
  needed here for that).
- `CurrentUserService.get()` — the one seam between "who's calling" and
  everything else. Today it always resolves through
  `findOrCreateByEmail('dev@warehouse-ops.local', ...)`; swapping in real
  Azure AD later means changing only this method's body (validate the
  token, pass its email claim to the same `findOrCreateByEmail`) — no
  controller, guard, or default-role logic changes.
- `RequirePermission(key)` — decorator, marks a controller method with the
  permission key it needs.
- `PermissionsGuard` — reads that metadata, checks it against
  `CurrentUserService.get().permissions`, throws `ForbiddenException` if
  missing. Apply with `@UseGuards(PermissionsGuard)` on the controller.
- `GET /me` — returns `{ id, email, name, permissions }` for the frontend's
  `PermissionsContext`.

## The Default role

Seeded by `prisma/seed.ts` (`Role.isDefault: true`), starts with just
`announcements:view`. It's an ordinary, editable role — rename it or change
its permission set from the (future) Admin UI, same as any other role; the
only special behavior tied to `isDefault` is that `findOrCreateByEmail`
hands it to brand-new users. Exactly one role should carry `isDefault:
true` at a time — nothing in the DB enforces that today, it's on whoever
edits roles later to keep it that way.

## Adding a permission-gated action to a module

1. Pick a key: `"<module>:<action>"` (e.g. `"hse:edit"`).
2. `@RequirePermission('hse:edit')` on the controller method,
   `@UseGuards(PermissionsGuard)` on the controller.
3. Add the key to `prisma/seed.ts`'s `ALL_PERMISSIONS` (what "Administrator"
   grants) and re-run `npm run prisma:seed`.
4. If the action can be conditionally required within one endpoint (like
   `announcements:pin` riding on the same `PATCH` as `announcements:edit`),
   check it manually via `CurrentUserService` in the handler — see
   `AnnouncementsController.update()`.
