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

- `CurrentUserService.get()` — the one seam between "who's calling" and
  everything else. Today it always resolves the seeded dev user
  (`dev@warehouse-ops.local`); swapping in real Azure AD later means
  changing only this method's body (validate the token, look up `User` by
  its email claim) — no controller or guard changes.
- `RequirePermission(key)` — decorator, marks a controller method with the
  permission key it needs.
- `PermissionsGuard` — reads that metadata, checks it against
  `CurrentUserService.get().permissions`, throws `ForbiddenException` if
  missing. Apply with `@UseGuards(PermissionsGuard)` on the controller.
- `GET /me` — returns `{ id, email, name, permissions }` for the frontend's
  `PermissionsContext`.

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
