# Warehouse Ops Toolkit

A generic warehouse operations toolkit — announcements, shift handover,
staff/admin, and a digital twin (photo-annotated site plan + isometric
schema) for warehouse layout. Built as a modular monolith: React frontend,
NestJS backend, Prisma/Postgres data layer, backend swappable behind a
`DataProvider` interface.

See `specs/` for the full architecture, data schema, and per-module
requirements. See each module's own `README.md` (once scaffolded) for how
it's built and how complex it is to pick up.

## Status

Scaffolded: `apps/web` (React + Vite), `apps/api` (NestJS), `prisma/schema.prisma`
(Postgres), CI on GitHub Actions, and a design system (shadcn/ui, light/dark).
See `specs/ARCHITECTURE.md` for full decisions, `specs/DESIGN_SYSTEM.md` for
the visual language, and `specs/PRD.md` for scope.

## Modules

Sidebar navigation is in place (`apps/web/src/app/`) — every module below has
a route, even if it's just a placeholder screen. Navigation 2.0
(`specs/ARCHITECTURE.md`, раздел 12) restructured the sidebar around a
YouGile-inspired Tasks model — Projects/Planner/HSE/Dashboards/Links/Handover
are no longer separate top-level entries.

| Module | Complexity | Status |
|---|---|---|
| Announcements | Simple | Rich text (Tiptap), list + create/edit/delete/pin, RBAC-gated. Comments/attachments/stories/widgets/EntityDrawer planned, not built yet |
| Operations (HSE, Staff, Weekly meeting, Digital twin, Dashboards, Links) | High — Digital Twin especially, read its own `README.md` first once it exists | Placeholder routes. Weekly meeting is specced in `specs/features/weekly-meeting.md`, not built yet |
| Tasks (replaces Projects + Planner) | High | Built — `Project → Board (tabs) → Column → Task`, Board/List/Gantt/Calendar views, drag-and-drop, multiple assignees, priorities, recurrence, task chat and timeline. Epics (with owner-scoped permissions) and Table view built; Weekly meeting stages 2-4 next (see its spec) |
| Knowledge base | Medium | Placeholder route only |
| Profile (personal hub — my tasks, Handover, activity) | Medium | Placeholder route only |
| Admin | Medium | Placeholder route only |

## Stack

React + TypeScript · NestJS · Prisma · Postgres (Supabase/Neon free tier
for dev/demo) · GitHub Actions · Netlify

## Development

```bash
npm install
cp .env.example .env          # then point DATABASE_URL at your own Postgres (Supabase/Neon)
cp apps/web/.env.example apps/web/.env
npx prisma generate --schema=prisma/schema.prisma
npm run dev:api                # http://localhost:3000
npm run dev:web                # separate terminal, http://localhost:5173
```

Leave both `dev:api` and `dev:web` running — they hot-reload on file changes,
no restart needed. To pull the latest code later, run `update.bat` (Windows,
double-click or run in a terminal) — it does `git pull` + `npm install` in
one go. `npm install` is a no-op if nothing changed, so it's always safe to
run.

See `specs/ARCHITECTURE.md`, section "Rollout order", for what's next.
