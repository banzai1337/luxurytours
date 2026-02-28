# exportonserver

Готовый статический экспорт сайта для публикации на GitHub Pages.

## Как загрузить

1. Создай отдельный репозиторий (или ветку/папку) и загрузи содержимое этой папки `exportonserver`.
2. В GitHub открой `Settings` → `Pages`.
3. Выбери:
   - `Source`: `Deploy from a branch`
   - `Branch`: `main` (или `master`), папка `/ (root)`
4. Сохрани и дождись публикации.

## Важно

- Это **статический** экспорт (без Node backend).
- Авторизация и часть данных работают через browser storage/fallback.
- Для серверных функций (API, webhook, backend auth) нужен отдельный backend.
