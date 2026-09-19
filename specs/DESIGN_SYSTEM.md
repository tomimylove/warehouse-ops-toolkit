# Design System

Один визуальный язык для всех модулей — определяется один раз здесь, дальше
только переиспользуется. Ничего специфичного под конкретный модуль сюда не
попадает.

Ревизия: проект перешёл на **shadcn/ui** (Tailwind CSS + Radix primitives,
дефолтная тема "Nova") вместо самописной Jira-style дизайн-системы. Причина
смены — не недовольство внешним видом (перенос из FSA был осознанным и
валидированным), а компоненты, которые дорого поддерживать самим: date
picker, комбобокс, полноценный сайдбар с клавиатурной навигацией и т.д.
shadcn даёт это готовым поверх Radix, без веса Fluent UI (тот по-прежнему
отклонён, см. `ARCHITECTURE.md`).

## Стек

- **Tailwind CSS v4** — `@tailwindcss/vite`, без отдельного `tailwind.config`.
- **shadcn/ui**, стиль `radix-nova`, base color `neutral` — компоненты
  копируются в `src/components/ui/` через `npx shadcn add <component>`, не
  ставятся как npm-зависимость.
- Тема — CSS-переменные в `src/styles/global.css` (`:root` / `.dark`),
  сгенерированы `shadcn init`, не редактируются вручную — если нужен другой
  акцент, перегенерировать через CLI, а не патчить `oklch()`-значения руками.
- **Тёмная тема — явный переключатель в сайдбаре** (`useTheme.ts`, класс
  `.dark` на `<html>`), не `prefers-color-scheme` — то же решение, что было
  в FSA: на общем компьютере системная тема не должна тихо переключать и
  это приложение тоже.
- **Inter → Geist Variable** (шрифт приходит вместе с темой shadcn через
  `@fontsource-variable/geist`). Данные (id, даты, координаты, номера ячеек)
  — моноширинный вариант того же стека (`font-mono` в Tailwind), отдельный
  IBM Plex Mono больше не подключаем.

## Компоненты

`src/components/ui/` — два вида файлов:

- **shadcn-компоненты** (`button.tsx`, `input.tsx`, `card.tsx`, `dialog.tsx`,
  `table.tsx`, `tabs.tsx`, `sidebar.tsx`, `command.tsx`, `popover.tsx`,
  `calendar.tsx` и т.д.) — сгенерированы CLI, не редактируются руками кроме
  как через сам CLI (`--overwrite`) — ручные правки потеряются при апдейте.
- **свои компоненты** (`PageHeader.tsx`, `EmptyState.tsx`,
  `RichTextEditor.tsx`) — то, чего нет в shadcn: заголовок страницы,
  "список пуст", Tiptap-редактор (MIT-лицензия, жирный/курсив/список,
  набор можно расширить через `StarterKit`). Стилизованы Tailwind-классами
  тех же токенов (`bg-card`, `text-muted-foreground` и т.д.), не своим CSS.

Модули приложения используют только эти компоненты для типовых элементов
интерфейса — не пишут кнопки/инпуты с нуля у себя.

Сайдбар (`src/app/AppSidebar.tsx`) построен на `Sidebar`/`SidebarMenu`/
`SidebarMenuSub` из shadcn (`collapsible="icon"`) — раскрывающиеся группы
(Warehouse) через `Collapsible`, а не самописный accordion. Порядок и
группировка пунктов меню по-прежнему берутся из истории FSA (см.
`ARCHITECTURE.md`), а не придуманы заново: Announcements → HSE → Warehouse
(Staff, Weekly meeting, Digital twin) → Projects → Planner → Dashboards →
Knowledge base → Handover → Links → Admin (последний).

## Что не входит в эту версию

- Иконки продукта (не путать с иконками Изометрической схемы — те решаются
  отдельно, см. `ARCHITECTURE.md`, раздел про Digital Twin). Иконки меню —
  `lucide-react`, тот же набор, что использует сам shadcn.
- Анимации/переходы — то, что даёт Radix/Tailwind из коробки (fade, collapse);
  ничего сверху не добавляем ради красоты.
