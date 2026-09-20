# UI components (design system)

shadcn/ui (Radix + Tailwind, стиль `radix-nova`) — см. `specs/DESIGN_SYSTEM.md`.

- Файлы в нижнем регистре (`button.tsx`, `sidebar.tsx`, ...) — сгенерированы
  `npx shadcn add <component>`. Не редактировать руками кроме как через сам
  CLI (`--overwrite`) — иначе правки потеряются при следующем апдейте.
- Файлы в PascalCase (`PageHeader.tsx`, `EmptyState.tsx`, `RichTextEditor.tsx`)
  — свои, того нет в shadcn. Стилизованы Tailwind-классами поверх тех же
  токенов (`bg-card`, `text-muted-foreground` и т.д.), без отдельного CSS.

Модули приложения используют только эти компоненты для типовых элементов
интерфейса — не пишут кнопки/инпуты/карточки с нуля у себя.
