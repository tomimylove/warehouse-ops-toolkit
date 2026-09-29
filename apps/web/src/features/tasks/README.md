# Tasks (frontend)

`TasksPage.tsx` — project switcher (buttons) → board tabs (shadcn `Tabs`)
→ `BoardView.tsx` (columns + cards, no drag-and-drop yet). Clicking a card
opens `TaskDrawer.tsx` (a `Sheet`) with Description/Subtasks tabs — Chat
isn't a tab yet, it's a shared Core primitive still being designed.

`QuickNotes.tsx` — the floating "+" button (`QuickNoteFab`), fixed
bottom-right on every screen (rendered by `AppShell`, not a sidebar entry
or route). Lists/creates the caller's Notes via `GET /tasks/mine` and
`POST /tasks` with no `boardId` — same `Task` table and API as board
tasks, not a separate mechanism (used to be localStorage-only).

`api.ts` is a small dedicated client (`tasksApi`), not the generic
`DataProvider` — the routes are nested (`/projects/:id/boards`) and
include a non-CRUD one (`/tasks/mine`), neither fits the flat
list/get/create/update/remove shape used for Announcements.

See `apps/api/src/modules/tasks/README.md` for the data model and
endpoints, and `specs/ARCHITECTURE.md` раздел 12 for why it's shaped this
way (YouGile-inspired, Notes as boardId-null Tasks, EntityDrawer as a
shared pattern).
