# Announcements (frontend)

Простой модуль. `AnnouncementsPage.tsx` — список + форма создания, через
`dataProvider` (см. `src/lib/data-provider.ts`) — не завязан напрямую на
REST, чтобы backend можно было заменить, не трогая этот файл.

Пока без дизайн-системы — голая разметка, будет обёрнута в компоненты
дизайн-системы на следующем этапе (см. `specs/ARCHITECTURE.md`, Rollout
order, шаг 5).
