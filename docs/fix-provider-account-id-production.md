# Исправление ошибки provider_account_id в продакшене

## Проблема

Ошибка при попытке входа через Google:

```
error: column accounts.provider_account_id does not exist
code: '42703'
```

Это означает, что в таблице `accounts` отсутствует колонка `provider_account_id`, которая необходима для работы NextAuth.js с OAuth провайдерами.

## Решение

### Вариант 1: Автоматическое применение (рекомендуется)

Миграция будет применена автоматически при следующем запуске приложения через `lib/database/init.ts`.

**Просто перезапустите приложение в продакшене.**

### Вариант 2: Ручное применение миграции

Если нужно применить миграцию немедленно, выполните SQL из файла миграции:

**Файл:** `lib/database/migrations/fix-provider-account-id-column.sql`

**Способ применения:**

1. **Через Vercel Postgres UI:**
   - Откройте Vercel Dashboard → Ваш проект → Storage → Postgres → SQL Editor
   - Скопируйте содержимое файла `lib/database/migrations/fix-provider-account-id-column.sql`
   - Вставьте в SQL Editor и выполните

2. **Через psql:**
   ```bash
   psql "$DATABASE_URL" -f lib/database/migrations/fix-provider-account-id-column.sql
   ```

3. **Через скрипт:**
   ```bash
   npm run db:migrate
   ```

## Что делает миграция

1. **Проверяет существование колонки `provider_account_id`**
   - Если колонка существует → пропускает миграцию
   - Если колонка не существует → продолжает

2. **Проверяет наличие колонки в camelCase (`providerAccountId`)**
   - Если найдена → переименовывает в `provider_account_id` (snake_case)
   - Если не найдена → создает новую колонку `provider_account_id`

3. **Исправляет другие колонки в snake_case:**
   - `refresh_token`
   - `access_token`
   - `expires_at`
   - `token_type`
   - `id_token`
   - `session_state`

4. **Создает необходимые индексы и ограничения**

5. **Проверяет успешность применения**

## Проверка после применения

Выполните этот SQL запрос, чтобы убедиться, что колонка создана:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'accounts' 
AND column_name = 'provider_account_id';
```

Должна вернуться одна строка с колонкой `provider_account_id` типа `text`.

## Проверка всех колонок таблицы accounts

Чтобы увидеть все колонки таблицы `accounts`:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'accounts'
ORDER BY ordinal_position;
```

Ожидаемые колонки (в snake_case):
- `id`
- `user_id`
- `type`
- `provider`
- `provider_account_id` ← **эта колонка должна существовать**
- `refresh_token`
- `access_token`
- `expires_at`
- `token_type`
- `scope`
- `id_token`
- `session_state`

## После применения миграции

1. ✅ Перезапустите приложение (если нужно)
2. ✅ Попробуйте войти через Google снова
3. ✅ Проверьте логи на наличие ошибок

Ошибка `column accounts.provider_account_id does not exist` должна исчезнуть!

## Важно

- Миграция безопасна: она проверяет существование колонок перед изменением
- Миграция идемпотентна: её можно запускать несколько раз без побочных эффектов
- Миграция не удаляет данные: она только добавляет или переименовывает колонки

