# Tasks

YouGile-inspired: `Project → Board (tabs within a project) → Column →
Task`, all one `Task` table — Board/Gantt/Calendar are views over the same
rows, not separate models (Gantt/Calendar not built yet). A `Task` with no
`boardId` and no `parentId` is a personal **Note**; a subtask of a board
task also has no `boardId` but does have a `parentId` — the two are told
apart by `parentId`, not `boardId` alone (see `TasksService.listNotes()`).

## Endpoints

| Method | Path | Permission | Notes |
|---|---|---|---|
| GET | `/projects` | `tasks:view` | Projects with their boards+columns |
| POST | `/projects` | `tasks:create` | `{ name }` |
| GET | `/projects/:projectId/boards` | `tasks:view` | |
| POST | `/projects/:projectId/boards` | `tasks:create` | `{ name }` — auto-creates To do/In progress/Done columns |
| GET | `/tasks?boardId=` | `tasks:view` | Tasks on a board, for the Board view |
| GET | `/tasks/mine` | `tasks:view` | Caller's own Notes |
| GET | `/tasks/:id` | `tasks:view` | Includes `subtasks` |
| POST | `/tasks` | `tasks:create` | Omit `boardId` for a Note |
| PATCH | `/tasks/:id` | `tasks:edit`, unless caller is the author | |
| DELETE | `/tasks/:id` | `tasks:delete`, unless caller is the author | |

Editing/deleting your own task (most often a Note) never needs
`tasks:edit`/`tasks:delete` — those only gate touching someone else's; see
`TasksController.requireOwnerOrPermission()`.

## What's deliberately not here yet

- **Chat/comments** — shared Core primitive (mentions, notifications),
  still being designed; not bolted onto Tasks alone.
- **Gantt/Calendar views**, **drag-and-drop** on the board, **column
  management UI** (columns are fixed to the three created with the board).
- Frontend Notes (`QuickNoteFab`) used to be localStorage-only; now reads
  this API — no other UI change was needed, confirming the "boardId-null
  Task is a Note" design (specs/ARCHITECTURE.md, раздел 12).
