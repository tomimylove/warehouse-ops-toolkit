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

Early scaffold — architecture and specs are being written before code.
See `specs/ARCHITECTURE.md` for current decisions and `specs/PRD.md` for
scope.

## Modules

| Module | Complexity | Status |
|---|---|---|
| Announcements | Simple | Spec pending |
| Handover | Simple | Spec pending |
| Admin | Medium | Spec pending |
| Digital Twin (Photo Plan + Isometric Schema) | High — read its own `README.md` first | Spec pending |

## Stack

React + TypeScript · NestJS · Prisma · SQL Server (Azure SQL free tier for
dev/demo) · GitHub Actions · Netlify

## Development

Not yet scaffolded. See `specs/ARCHITECTURE.md`, section "Rollout order",
for the plan.
