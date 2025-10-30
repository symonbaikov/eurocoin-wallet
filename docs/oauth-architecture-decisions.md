# OAuth 2.0 Architecture - Design Decisions

## Документ архитектурных решений для интеграции OAuth 2.0

**Дата:** 2025-10-29
**Версия:** 1.0
**Статус:** ✅ Approved для имплементации

---

## 1. Выбор OAuth библиотеки

### Решение: NextAuth.js v5 (Auth.js)

**Обоснование:**
- ✅ **Нативная интеграция с Next.js 15/16** - минимальная конфигурация
- ✅ **TypeScript first** - полная типизация из коробки
- ✅ **Serverless-ready** - JWT стратегия для Vercel
- ✅ **Drizzle ORM adapter** - совместимость с текущей БД
- ✅ **Open source** - без vendor lock-in
- ✅ **Active community** - регулярные обновления

**Альтернативы рассмотрены:**

| Библиотека | Плюсы | Минусы | Решение |
|------------|-------|--------|---------|
| **Clerk** | Готовый UI, быстрая интеграция | Платная модель, vendor lock-in | ❌ Отклонено |
| **Auth0** | Enterprise features | Сложность, высокая цена | ❌ Отклонено |
| **Supabase Auth** | PostgreSQL интеграция | Требует Supabase backend | ❌ Отклонено |
| **Passport.js** | Гибкость | Устаревший, много boilerplate | ❌ Отклонено |

---

## 2. OAuth провайдеры

### Решение: Google OAuth + GitHub OAuth

**Приоритет 1: Google OAuth**
- Самый популярный провайдер (85% пользователей имеют Gmail)
- Простая настройка через Google Cloud Console
- Стабильный API

**Приоритет 2: GitHub OAuth**
- Идеален для разработчиков/технических пользователей
- Минимальная настройка
- Нет необходимости в email verification (GitHub уже верифицирует)

**Отложено на будущее:**
- Microsoft OAuth (для корпоративных пользователей)
- Magic Link email (passwordless)
- Apple Sign In (если потребуется мобильная версия)

---

## 3. Архитектура системы аутентификации

### 3.1 Двухфакторная аутентификация

```
┌─────────────────────────────────────────────────────┐
│                   Login Page                        │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │  [🦊 Connect MetaMask]                        │ │
│  │          ↓                                     │ │
│  │  Full access (wallet user)                    │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
│                     OR                              │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │  [🔵 Sign in with Google]                     │ │
│  │  [⚫ Sign in with GitHub]                     │ │
│  │          ↓                                     │ │
│  │  Read-only access (email user)                │ │
│  └───────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

### 3.2 Унифицированная система сессий

```typescript
// Unified Auth State
interface AuthState {
  isAuthenticated: boolean;
  authType: 'wallet' | 'email' | null;
  userId?: string;
  walletAddress?: `0x${string}`; // только для wallet
  email?: string;                 // только для email
  canMakeTransactions: boolean;   // true только для wallet
}
```

**Ключевой принцип:** Один хук `useAuth()` для обоих типов аутентификации

```typescript
// Использование в компонентах
const { isAuthenticated, authType, canMakeTransactions } = useAuth();

if (!canMakeTransactions) {
  return <ReadOnlyBanner />;
}
```

### 3.3 Разделение прав доступа

| Функция | Wallet User | Email User |
|---------|-------------|------------|
| Просмотр баланса | ✅ | ✅ |
| Просмотр истории | ✅ | ✅ |
| Просмотр цены токена | ✅ | ✅ |
| Отправка токенов | ✅ | ❌ |
| Создание внутренних запросов | ✅ | ❌ |
| Взаимодействие со смарт-контрактом | ✅ | ❌ |

**Реализация:**
```typescript
// Permission system
enum Permission {
  VIEW_PUBLIC = 'view_public',
  VIEW_BALANCE = 'view_balance',
  TRANSFER_TOKENS = 'transfer_tokens',
  CREATE_REQUESTS = 'create_requests',
}

const AUTH_PERMISSIONS = {
  wallet: [Permission.VIEW_PUBLIC, Permission.VIEW_BALANCE, Permission.TRANSFER_TOKENS, Permission.CREATE_REQUESTS],
  email: [Permission.VIEW_PUBLIC, Permission.VIEW_BALANCE], // read-only
};
```

---

## 4. Database Schema

### Решение: Расширение существующей PostgreSQL БД

**Таблицы NextAuth:**
- `users` - основная таблица пользователей
- `accounts` - OAuth connections
- `sessions` - JWT sessions
- `verification_tokens` - для email magic links (будущее)

**Ключевое поле: `auth_type`**
```sql
CREATE TYPE auth_type_enum AS ENUM ('wallet', 'email');

ALTER TABLE users ADD COLUMN auth_type auth_type_enum NOT NULL DEFAULT 'email';
ALTER TABLE users ADD COLUMN wallet_address TEXT UNIQUE; -- только для wallet users
```

**Индексы для производительности:**
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_sessions_token ON sessions(session_token);
```

---

## 5. Session Management

### 5.1 Стратегия: JWT (не database sessions)

**Обоснование:**
- ✅ **Serverless-friendly** - не требует database lookup на каждый запрос
- ✅ **Масштабируемость** - нет нагрузки на БД для каждой сессии
- ✅ **Vercel optimization** - идеально для edge functions
- ✅ **Автоматическая ротация** - NextAuth обновляет токены

**Конфигурация:**
```typescript
session: {
  strategy: 'jwt',
  maxAge: 7 * 24 * 60 * 60, // 7 дней
  updateAge: 24 * 60 * 60,   // обновлять ежедневно
}
```

### 5.2 Cookie настройки

```typescript
cookies: {
  sessionToken: {
    name: '__Secure-next-auth.session-token',
    options: {
      httpOnly: true,        // защита от XSS
      sameSite: 'lax',       // CSRF protection
      path: '/',
      secure: process.env.NODE_ENV === 'production', // HTTPS only в production
    },
  },
}
```

---

## 6. Middleware и защита роутов

### Решение: Next.js Middleware для глобальной защиты

**Файл:** `/middleware.ts`

```typescript
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = await auth();
  const isLoginPage = request.nextUrl.pathname === '/login';

  // Redirect unauthenticated users to login
  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect authenticated users from login page
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)'],
};
```

**Преимущества:**
- Глобальная защита всех страниц
- Автоматический редирект на `/login`
- Исключения для статики и API routes

---

## 7. UI/UX дизайн

### 7.1 Login Page Layout

```
┌─────────────────────────────────────────┐
│  🪙 EuroCoin Wallet                     │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [🦊 Connect MetaMask]           │   │
│  │                                 │   │
│  │        ────── OR ──────         │   │
│  │                                 │   │
│  │ [🔵 Sign in with Google]       │   │
│  │ [⚫ Sign in with GitHub]       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  By signing in, you agree to our       │
│  Terms of Service and Privacy Policy   │
└─────────────────────────────────────────┘
```

### 7.2 Post-Login Experience

**Для Wallet Users:**
- Показывать подключенный адрес в Header
- Зеленый индикатор "Connected"
- Все функции доступны

**Для Email Users:**
- Показывать email в Header
- Синий индикатор "Read-only mode"
- Banner с предложением подключить MetaMask для полного доступа

```typescript
// Component: ReadOnlyBanner.tsx
{authType === 'email' && (
  <Banner variant="info">
    <p>You're in read-only mode. Connect MetaMask for full access.</p>
    <Button onClick={connectWallet}>Connect MetaMask</Button>
  </Banner>
)}
```

---

## 8. Безопасность

### 8.1 Environment Variables

**Критические секреты:**
```env
# NextAuth
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<min-32-chars-random>  # ⚠️ НИКОГДА не коммитить

# OAuth Providers
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx               # ⚠️ НИКОГДА не коммитить

GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx               # ⚠️ НИКОГДА не коммитить
```

**Генерация секрета:**
```bash
openssl rand -base64 32
```

### 8.2 CSRF Protection

- ✅ NextAuth автоматически добавляет CSRF tokens
- ✅ `sameSite: 'lax'` cookie attribute
- ✅ Проверка state parameter в OAuth flow

### 8.3 XSS Protection

- ✅ `httpOnly: true` cookies (токены недоступны из JavaScript)
- ✅ Content Security Policy headers
- ✅ Sanitization всех user inputs

### 8.4 Rate Limiting

**Будущее:** Добавить rate limiting для OAuth endpoints
```typescript
// С использованием Upstash Redis
import { Ratelimit } from '@upstash/ratelimit';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 h'), // 10 попыток в час
});
```

---

## 9. Миграция существующих пользователей

### Сценарий: Пользователь уже подключался через MetaMask

**Решение:** Связать wallet address с OAuth account

```typescript
// В callbacks NextAuth
async signIn({ user, account, profile }) {
  // Если пользователь уже существует с таким email
  const existingUser = await db.users.findByEmail(profile.email);

  if (existingUser && existingUser.walletAddress) {
    // Связать OAuth account с существующим wallet user
    await db.accounts.create({
      userId: existingUser.id,
      type: 'oauth',
      provider: account.provider,
      providerAccountId: account.providerAccountId,
    });
  }

  return true;
}
```

**Преимущества:**
- Один пользователь может входить через MetaMask ИЛИ OAuth
- История и баланс сохраняются
- Плавная миграция

---

## 10. Мониторинг и аналитика

### Метрики для отслеживания

**Auth Metrics:**
- `auth.signin.wallet` - вход через MetaMask
- `auth.signin.google` - вход через Google
- `auth.signin.github` - вход через GitHub
- `auth.signin.failed` - ошибки входа
- `auth.session.duration` - длительность сессий

**User Behavior:**
- Соотношение wallet vs email users
- Retention rate по типу аутентификации
- Конверсия email → wallet upgrade

**Реализация:**
```typescript
// В callbacks
async signIn({ user, account }) {
  console.log('[METRICS]', {
    event: 'auth.signin',
    provider: account.provider,
    userId: user.id,
    timestamp: new Date(),
  });

  // Отправить в аналитику (Google Analytics, Mixpanel, etc)
  return true;
}
```

---

## 11. Тестирование

### 11.1 Unit Tests

**Файлы для тестирования:**
- `/hooks/use-auth.test.ts` - unified auth hook
- `/lib/auth.test.ts` - NextAuth configuration
- `/components/auth/*.test.tsx` - OAuth components

**Сценарии:**
```typescript
describe('useAuth', () => {
  it('returns wallet auth for MetaMask users', () => {
    // Mock useAccount with connected state
    const { result } = renderHook(() => useAuth());
    expect(result.current.authType).toBe('wallet');
    expect(result.current.canMakeTransactions).toBe(true);
  });

  it('returns email auth for OAuth users', () => {
    // Mock useSession with session
    const { result } = renderHook(() => useAuth());
    expect(result.current.authType).toBe('email');
    expect(result.current.canMakeTransactions).toBe(false);
  });
});
```

### 11.2 E2E Tests

**Cypress scenarios:**
1. Sign in with MetaMask → verify full access
2. Sign in with Google → verify read-only mode
3. Sign out → verify redirect to login
4. Already authenticated → verify redirect from login page

---

## 12. Deployment Checklist

### Pre-Deployment

- [ ] Создать Google OAuth credentials
- [ ] Создать GitHub OAuth app
- [ ] Настроить Database migration
- [ ] Установить Environment Variables в Vercel
- [ ] Сгенерировать NEXTAUTH_SECRET
- [ ] Обновить redirect URLs в OAuth providers

### Post-Deployment

- [ ] Протестировать Google OAuth flow на production
- [ ] Протестировать GitHub OAuth flow на production
- [ ] Проверить MetaMask интеграцию (не сломана ли)
- [ ] Проверить permissions для email users
- [ ] Мониторинг ошибок в Sentry/LogRocket

### Rollback Plan

**Если что-то пойдет не так:**
1. Быстрый rollback Vercel deployment
2. Отключить OAuth providers в конфиге
3. Fallback на только MetaMask authentication
4. Анализ логов и исправление

---

## 13. Будущие улучшения

### Phase 2 (После MVP)

- [ ] **Email Magic Links** - passwordless вход без OAuth
- [ ] **Two-Factor Authentication (2FA)** - дополнительная безопасность
- [ ] **Social Recovery** - восстановление доступа через друзей
- [ ] **Wallet Upgrade Flow** - помощь email users подключить MetaMask

### Phase 3 (Long-term)

- [ ] **Microsoft OAuth** - для корпоративных клиентов
- [ ] **Apple Sign In** - для iOS приложения
- [ ] **Biometric Auth** - WebAuthn/Passkeys
- [ ] **Multi-Wallet Support** - WalletConnect, Coinbase Wallet

---

## 14. Принятые риски

| Риск | Вероятность | Воздействие | Митигация |
|------|-------------|-------------|-----------|
| NextAuth breaking changes | Низкая | Высокое | Зафиксировать версию, следить за changelog |
| OAuth provider downtime | Средняя | Среднее | Fallback на MetaMask, показать ошибку |
| JWT token theft | Низкая | Высокое | httpOnly cookies, short expiration, HTTPS |
| Database migration issues | Средняя | Высокое | Тщательное тестирование, rollback plan |

---

## 15. Контакты и ресурсы

**Документация:**
- NextAuth.js: https://next-auth.js.org
- Google OAuth: https://developers.google.com/identity/protocols/oauth2
- GitHub OAuth: https://docs.github.com/en/developers/apps/oauth-apps

**Поддержка:**
- NextAuth Discord: https://discord.gg/nextauth
- Drizzle ORM Docs: https://orm.drizzle.team

---

## Резюме решений

✅ **NextAuth.js v5** для OAuth
✅ **Google + GitHub** провайдеры
✅ **JWT sessions** для serverless
✅ **PostgreSQL** с Drizzle ORM
✅ **Permission-based access control**
✅ **Unified `useAuth()` hook**
✅ **Next.js Middleware** для защиты роутов
✅ **Read-only mode** для email users

**Статус:** Готово к имплементации Этапа 2 ✅
