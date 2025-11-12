# Исправление ошибок подписки на рассылку

## Проблема

В продакшене возникают ошибки HTTP 500 при попытке подписки на рассылку:

- `/api/newsletter/check-subscription` возвращает 500
- `/api/newsletter/send-code` возвращает 500
- Ошибка: "Database error. Please try again later."

**Причина:** Таблица `newsletter_subscribers` не существует в продакшн базе данных.

## Решение

### Вариант 1: Автоматическое применение при деплое (рекомендуется)

Миграция будет применена автоматически при следующем деплое, так как она добавлена в `lib/database/init.ts`.

Команда `npm run db:init` (которая запускается при деплое) теперь автоматически создаст таблицы newsletter, если их нет.

### Вариант 2: Ручное применение миграции

Если нужно применить миграцию немедленно без деплоя:

```bash
# В продакшн окружении
npm run db:newsletter
```

Или напрямую через SQL:

```bash
psql $DATABASE_URL -f lib/database/migrations/add-newsletter-tables.sql
```

### Вариант 3: Применение через скрипт инициализации

```bash
npm run db:init
```

Этот скрипт применит все миграции, включая newsletter таблицы.

## Что создается

Миграция создает следующие таблицы:

1. **newsletter_subscribers** - подписчики рассылки
   - `id` (SERIAL PRIMARY KEY)
   - `email` (VARCHAR(255) UNIQUE)
   - `chat_id` (VARCHAR(255)) - для Telegram
   - `verified` (BOOLEAN) - email подтвержден
   - `verification_code` (VARCHAR(6)) - код подтверждения
   - `code_expires_at` (TIMESTAMP) - срок действия кода
   - `subscribed_at` (TIMESTAMP)
   - `is_active` (BOOLEAN) - статус подписки
   - `language` (VARCHAR(10)) - язык (ru/en/all)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

2. **newsletter_campaigns** - история рассылок
   - `id` (SERIAL PRIMARY KEY)
   - `subject` (TEXT)
   - `message` (TEXT)
   - `language` (VARCHAR(10))
   - `sent_count` (INTEGER)
   - `success_count` (INTEGER)
   - `failed_count` (INTEGER)
   - `created_by` (VARCHAR(255))
   - `created_at` (TIMESTAMP)
   - `sent_at` (TIMESTAMP)

3. **newsletter_logs** - логи отправки
   - `id` (SERIAL PRIMARY KEY)
   - `campaign_id` (INTEGER) - ссылка на newsletter_campaigns
   - `chat_id` (VARCHAR(255))
   - `success` (BOOLEAN)
   - `error_message` (TEXT)
   - `sent_at` (TIMESTAMP)

## Проверка

После применения миграции проверьте, что таблицы созданы:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_name LIKE 'newsletter%';
```

Должны быть видны:

- `newsletter_subscribers`
- `newsletter_campaigns`
- `newsletter_logs`

## Файлы изменений

1. **lib/database/migrations/add-newsletter-tables.sql** - новая миграция
2. **lib/database/init.ts** - добавлена проверка и применение newsletter миграции
3. **scripts/apply-newsletter-schema.ts** - отдельный скрипт для применения схемы
4. **package.json** - добавлена команда `db:newsletter`

## После применения

После успешного применения миграции:

1. Перезапустите приложение (если нужно)
2. Протестируйте подписку на рассылку
3. Проверьте, что код отправляется на email
4. Проверьте, что верификация работает

## Примечания

- Миграция использует `CREATE TABLE IF NOT EXISTS`, поэтому безопасна для повторного запуска
- Миграция проверяет существование таблиц перед созданием
- Все индексы создаются с `IF NOT EXISTS`
- Триггер для `updated_at` использует существующую функцию `update_updated_at_column()`
