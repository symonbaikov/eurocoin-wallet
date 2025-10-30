# OAuth 2.0 Setup - Этап 2 Завершен ✅

## Что было сделано

### 1. Установлены зависимости
```bash
npm install next-auth@beta @auth/drizzle-adapter
```

**Установленные пакеты:**
- `next-auth@5.0.0-beta.30` - NextAuth.js v5
- `@auth/drizzle-adapter@1.11.1` - Drizzle ORM adapter

### 2. Созданы файлы базы данных

#### SQL Schema (`lib/database/auth-schema.sql`)
- ✅ `auth_users` - таблица пользователей
- ✅ `auth_accounts` - OAuth provider accounts
- ✅ `auth_sessions` - активные сессии
- ✅ `auth_verification_tokens` - токены для email verification
- ✅ `auth_authenticators` - WebAuthn (для будущего)
- ✅ Indexes для производительности
- ✅ Helper functions (cleanup, triggers)

#### Drizzle ORM Schema (`lib/database/auth-schema.ts`)
- ✅ TypeScript типы для всех таблиц
- ✅ Type inference (`AuthUser`, `AuthAccount`, и т.д.)
- ✅ Экспорт `authTables` для Drizzle Adapter

#### Drizzle Database Instance (`lib/database/drizzle.ts`)
- ✅ PostgreSQL connection pool
- ✅ Drizzle instance с auth schema
- ✅ Error handling

### 3. Создана NextAuth конфигурация (`lib/auth.ts`)

**Основные компоненты:**
- ✅ **Providers:** Google OAuth, GitHub OAuth
- ✅ **Session Strategy:** JWT (serverless-ready)
- ✅ **Drizzle Adapter:** интеграция с PostgreSQL
- ✅ **Callbacks:** `signIn`, `jwt`, `session`, `redirect`
- ✅ **Events:** логирование sign in/out, new users
- ✅ **Security:** httpOnly cookies, CSRF protection
- ✅ **Helper functions:** `getSession()`, `isAuthenticated()`, etc.

**Настройки безопасности:**
```typescript
session: {
  strategy: 'jwt',
  maxAge: 7 * 24 * 60 * 60,     // 7 days
  updateAge: 24 * 60 * 60,       // Update daily
}

cookies: {
  sessionToken: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  }
}
```

### 4. Создан API route (`app/api/auth/[...nextauth]/route.ts`)

**Endpoints:**
- `GET  /api/auth/signin` - Sign in page
- `POST /api/auth/signin/:provider` - Initiate OAuth
- `GET  /api/auth/callback/:provider` - OAuth callback
- `POST /api/auth/signout` - Sign out
- `GET  /api/auth/session` - Get session
- `GET  /api/auth/csrf` - CSRF token
- `GET  /api/auth/providers` - List providers

### 5. Созданы скрипты миграции

#### Apply Migration (`scripts/apply-auth-migration.ts`)
Применяет SQL схему к базе данных.

**Использование:**
```bash
npm run auth:migrate
```

**Что делает:**
- Читает `auth-schema.sql`
- Подключается к PostgreSQL
- Создает все таблицы в транзакции
- Проверяет успешное создание
- Rollback при ошибках

#### Test Database (`scripts/test-auth-db.ts`)
Проверяет корректность настройки БД.

**Использование:**
```bash
npm run auth:test
```

**Что проверяет:**
- Существование всех таблиц
- Структуру таблиц (колонки, типы)
- Indexes
- Foreign key constraints
- Функции и triggers
- Write permissions
- Статистику (количество пользователей)

### 6. Обновлен package.json

**Новые скрипты:**
```json
{
  "auth:migrate": "tsx scripts/apply-auth-migration.ts",
  "auth:test": "tsx scripts/test-auth-db.ts"
}
```

---

## Следующие шаги для деплоя

### Шаг 1: Настроить environment variables

Создайте `.env.local` (если еще не создан):

```bash
cp .env.example .env.local
```

**Минимально необходимые переменные:**

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/eurocoin_wallet

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-with-openssl>

# Google OAuth (получить: https://console.cloud.google.com)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# GitHub OAuth (получить: https://github.com/settings/developers)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
```

### Шаг 2: Сгенерировать NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Скопируйте результат в `.env.local`:
```env
NEXTAUTH_SECRET=<ваш-сгенерированный-секрет>
```

### Шаг 3: Настроить Google OAuth

1. **Перейдите в Google Cloud Console:**
   https://console.cloud.google.com

2. **Создайте проект:**
   - "EuroCoin Wallet"

3. **Включите Google+ API:**
   - APIs & Services → Library
   - Найдите "Google+ API"
   - Нажмите "Enable"

4. **Создайте OAuth credentials:**
   - APIs & Services → Credentials
   - Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Name: "EuroCoin Web Wallet"

5. **Добавьте Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-production-domain.com/api/auth/callback/google
   ```

6. **Скопируйте Client ID и Client Secret** в `.env.local`

### Шаг 4: Настроить GitHub OAuth

1. **Перейдите в GitHub Settings:**
   https://github.com/settings/developers

2. **OAuth Apps → New OAuth App:**
   - Application name: "EuroCoin Wallet"
   - Homepage URL: `http://localhost:3000`
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

3. **Создайте Client Secret**

4. **Скопируйте Client ID и Client Secret** в `.env.local`

### Шаг 5: Применить миграцию базы данных

```bash
# Проверьте что DATABASE_URL правильный
npm run auth:migrate
```

**Ожидаемый вывод:**
```
🚀 Starting NextAuth database migration...
📄 Reading schema from: lib/database/auth-schema.sql
✅ Connected to PostgreSQL database
🔄 Starting transaction...
📝 Creating auth tables...
✅ Transaction committed successfully!

📊 Created tables:
   ✓ auth_accounts
   ✓ auth_authenticators
   ✓ auth_sessions
   ✓ auth_users
   ✓ auth_verification_tokens

🎉 Migration completed successfully!
```

### Шаг 6: Протестировать настройку БД

```bash
npm run auth:test
```

**Ожидаемый вывод:**
```
🔍 Testing NextAuth database setup...
✅ Connected to PostgreSQL database

📊 Test 1: Checking tables...
✅ All tables exist

📋 Test 2: Checking table structures...
✅ auth_users columns

🔍 Test 3: Checking indexes...
✅ Indexes created

⚙️  Test 4: Checking functions...
✅ Functions created

🧪 Test 5: Testing write permissions...
✅ Write permissions OK

🔗 Test 6: Checking foreign key constraints...
✅ Foreign key constraints

🎉 All tests passed!
```

### Шаг 7: Запустить dev сервер

```bash
npm run dev
```

Откройте http://localhost:3000

---

## Проверка работоспособности

### 1. Проверьте NextAuth endpoints

```bash
# Получить список провайдеров
curl http://localhost:3000/api/auth/providers

# Должен вернуть:
{
  "google": { "id": "google", "name": "Google", "type": "oauth" },
  "github": { "id": "github", "name": "GitHub", "type": "oauth" }
}
```

### 2. Проверьте CSRF token

```bash
curl http://localhost:3000/api/auth/csrf
```

### 3. Проверьте session (должен вернуть null если не авторизован)

```bash
curl http://localhost:3000/api/auth/session
```

---

## Troubleshooting

### ❌ Error: "CLIENT_ID is undefined"

**Проблема:** Environment variables не загружены

**Решение:**
1. Проверьте что `.env.local` существует
2. Убедитесь что переменные правильно названы:
   - `GOOGLE_CLIENT_ID` (не `GOOGLE_ID`)
   - `GITHUB_CLIENT_ID` (не `GITHUB_ID`)
3. Перезапустите dev server

### ❌ Error: "Database connection failed"

**Проблема:** Неправильный DATABASE_URL

**Решение:**
1. Проверьте формат: `postgresql://user:pass@host:port/db`
2. Убедитесь что PostgreSQL запущен
3. Проверьте credentials

### ❌ Error: "redirect_uri_mismatch" (Google)

**Проблема:** Redirect URI не совпадает с настройками в Google Console

**Решение:**
1. Точный URI должен быть: `http://localhost:3000/api/auth/callback/google`
2. Без trailing slash
3. Протокол должен совпадать (http vs https)

### ❌ Error: Tables already exist

**Проблема:** Миграция уже применена

**Решение:**
- Это нормально! Просто используйте `npm run auth:test` для проверки

---

## Созданные файлы

```
lib/
├── database/
│   ├── auth-schema.sql          ✅ SQL schema
│   ├── auth-schema.ts           ✅ Drizzle ORM schema
│   └── drizzle.ts               ✅ Database instance
└── auth.ts                      ✅ NextAuth config

app/
└── api/
    └── auth/
        └── [...nextauth]/
            └── route.ts         ✅ API routes

scripts/
├── apply-auth-migration.ts      ✅ Migration script
└── test-auth-db.ts              ✅ Test script

types/
└── auth.ts                      ✅ TypeScript types (из Этапа 1)

.env.example                     ✅ Updated with OAuth vars
```

---

## Что дальше?

**Этап 3: Создание OAuth компонентов**
- `OAuthButtons` component
- `AuthDivider` component
- `SessionProvider` wrapper
- Обновление `AppProviders`

**Этап 4: Обновление Login page**
- Добавить кнопки OAuth
- Интеграция с NextAuth
- Тестирование flow

**Готовы к Этапу 3?** 🚀
