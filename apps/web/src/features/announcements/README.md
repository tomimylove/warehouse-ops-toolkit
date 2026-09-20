# Announcements (frontend)

`AnnouncementsPage.tsx` — лента + форма создания + inline pin/edit/delete,
через `dataProvider` (см. `src/lib/data-provider.ts`) — не завязан
напрямую на REST, чтобы backend можно было заменить, не трогая этот файл.

Каждое действие спрятано за своим permission-ключом через `usePermissions()`
(`announcements:create/edit/delete/pin`) — см. `specs/ARCHITECTURE.md`,
раздел про гранулярный RBAC. Сортировка (`pinned` сначала, дальше по дате)
считается на бэкенде (`AnnouncementsService.list()`), не на клиенте.

## Из спеки FSA (`specs/features/01-announcements.md`), что ещё не перенесено

Требует Core-примитивов/моделей, которых пока нет в проекте:

- Вложения (`.msg` и любые файлы) — нужен файловый storage (Azure Blob/др.).
- Комментарии, история версий — общие Core-примитивы, ещё не спроектированы.
- Видимость по командам + вкладки-фильтр — нужна модель Team.
- "Mark all as read" + счётчик непрочитанного — нужен read-state механизм.

Не пропущено случайно — сознательно отложено до соответствующей
инфраструктуры, чтобы не городить одноразовые версии этих вещей только под
Announcements.
