# Warehouse Ops Toolkit

A generic warehouse operations toolkit — announcements, shift handover,
staff/admin, and a digital twin (photo-annotated site plan + isometric
schema) for warehouse layout. Built as a modular monolith: React frontend,
NestJS backend, Prisma/SQL Server data layer, backend swappable behind a
`DataProvider` interface.

See `specs/` for the full architecture, data schema, and per-module
requirements. See each module's own `README.md` (once scaffolded) for how
it's built and how complex it is to pick up.

## Status

Scaffolded: `apps/web` (React + Vite), `apps/api` (NestJS), `prisma/schema.prisma`
(SQL Server), CI on GitHub Actions. No design system yet — screens are
unstyled until that lands. See `specs/ARCHITECTURE.md` for full decisions
and `specs/PRD.md` for scope.

## Modules

| Module | Complexity | Status |
|---|---|---|
| Announcements | Simple | First vertical slice built (list + create), unstyled |
| Handover | Simple | Not started |
| Admin | Medium | Not started |
| Digital Twin (Photo Plan + Isometric Schema) | High — read its own `README.md` first | Not started |

## Stack

React + TypeScript · NestJS · Prisma · SQL Server (Azure SQL free tier for
dev/demo) · GitHub Actions · Netlify

## Development

```bash
npm install
cp .env.example .env          # then point DATABASE_URL at your own SQL Server/Azure SQL
cp apps/web/.env.example apps/web/.env
npx prisma generate --schema=prisma/schema.prisma
npm run dev:api                # http://localhost:3000
npm run dev:web                # separate terminal, http://localhost:5173
```

See `specs/ARCHITECTURE.md`, section "Rollout order", for what's next.
