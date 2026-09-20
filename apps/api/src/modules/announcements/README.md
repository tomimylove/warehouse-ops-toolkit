# Announcements

## Что делает

CRUD объявлений: заголовок, текст, автор, дата, закрепление. Список —
закреплённые сверху, дальше по дате убыв. Каждый эндпоинт-мутация закрыт
своим permission-ключом через `PermissionsGuard` (см.
`../auth/README.md`, если появится, иначе `../auth/*`).

## Эндпоинты

| Метод | Путь | Permission | Описание |
|---|---|---|---|
| GET | `/announcements` | `announcements:view` | Список всех объявлений |
| GET | `/announcements/:id` | `announcements:view` | Одно объявление |
| POST | `/announcements` | `announcements:create` | Создать (`{ title, body }`) |
| PATCH | `/announcements/:id` | `announcements:edit` (+ `announcements:pin` если меняется `pinned`) | Частичное обновление |
| DELETE | `/announcements/:id` | `announcements:delete` | Удалить |

## Модель данных

См. `prisma/schema.prisma`, модель `Announcement`.

## Что дальше по этому модулю

Требует Core-примитивов, которых пока нет: вложения (файловый storage),
комментарии/история версий (общий механизм), видимость по командам (модель
Team), read-state ("Mark all as read" + счётчик непрочитанного). См.
`specs/features/01-announcements.md` в исходном FSA-проекте — там
полный список требований, отсюда переносится по мере готовности
инфраструктуры.

`authorId` уже реальный `User.id` (см. `CurrentUserService`) — не
произвольная строка, но сам пользователь пока один захардкоженный dev-юзер
до подключения Azure AD.
