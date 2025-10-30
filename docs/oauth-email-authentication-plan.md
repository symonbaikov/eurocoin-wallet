# План интеграции Email-аутентификации через OAuth 2.0

## Обзор проекта

**Цель:** Добавить альтернативный метод входа через email (OAuth 2.0) параллельно с существующей аутентификацией через MetaMask.

**Текущее состояние:**
- Одиночный метод входа: MetaMask wallet
- Хук `useWalletConnection` управляет подключением кошелька
- Cookie `metamask_connected` для персистентности сессии
- Страница `/app/login/page.tsx` с одной кнопкой входа

**Целевое состояние:**
- Два метода входа: MetaMask ИЛИ Email (OAuth 2.0)
- Единая система управления сессиями
- Разделение прав доступа (только чтение для email-пользователей)
- UI с двумя кнопками на странице логина

---

## Этап 1: Выбор OAuth 2.0 провайдера и архитектура

### 1.1 Выбор OAuth провайдера

**Рекомендуемые варианты:**

| Провайдер | Преимущества | Недостатки | Рекомендация |
|-----------|--------------|------------|--------------|
| **NextAuth.js v5** | • Встроенная интеграция с Next.js<br>• Поддержка Google, GitHub, Email<br>• JWT + Database sessions<br>• TypeScript support | • Требует настройки БД<br>• Дополнительные зависимости | ⭐ **Лучший выбор** |
| **Clerk** | • Готовый UI<br>• Быстрая интеграция<br>• Управление пользователями | • Платная модель<br>• Vendor lock-in | Для MVP |
| **Auth0** | • Enterprise-grade<br>• Множество провайдеров | • Сложная настройка<br>• Дорогой | Для корпоративных проектов |
| **Supabase Auth** | • PostgreSQL интеграция<br>• Open-source | • Требует Supabase backend | Если планируете Supabase |

**Финальный выбор:** `NextAuth.js v5` (Auth.js)

### 1.2 OAuth провайдеры для email

- **Google OAuth 2.0** (приоритет 1) - самый популярный
- **GitHub OAuth** (приоритет 2) - для разработчиков
- **Microsoft OAuth** (опционально) - для корпоративных пользователей
- **Email Magic Links** (опционально) - passwordless вход

### 1.3 Архитектурное решение

```
┌─────────────────────────────────────────┐
│         Login Page (/login)             │
│  ┌───────────────────────────────────┐  │
│  │   [Connect MetaMask]              │  │
│  │   [Sign in with Google]           │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │  Auth Manager  │
         │   (Unified)    │
         └────────────────┘
           │             │
           ▼             ▼
    ┌──────────┐   ┌──────────┐
    │ MetaMask │   │  OAuth   │
    │  Session │   │ Session  │
    └──────────┘   └──────────┘
           │             │
           └──────┬──────┘
                  ▼
         ┌────────────────┐
         │  User Session  │
         │  (Cookie/JWT)  │
         └────────────────┘
                  │
                  ▼
         ┌────────────────┐
         │  App (/)       │
         │  Access based  │
         │  on auth type  │
         └────────────────┘
```

**Ключевые принципы:**
1. **Два типа пользователей:**
   - `wallet` - полный доступ (чтение + транзакции)
   - `email` - read-only доступ (только просмотр)

2. **Единая система сессий:**
   - JWT токены от NextAuth
   - Cookie для персистентности
   - Тип аутентификации в сессии

3. **Разделение компонентов:**
   - Компоненты для MetaMask (`/components/wallet/`)
   - Компоненты для OAuth (`/components/auth/`)
   - Унифицированный провайдер сессий

---

## Этап 2: Настройка NextAuth.js

### 2.1 Установка зависимостей

```bash
npm install next-auth@beta
npm install @auth/core @auth/drizzle-adapter
npm install -D @types/next-auth
```

**Версия:** NextAuth.js v5 (beta) для совместимости с Next.js 15+

### 2.2 Создание схемы БД для пользователей

**Файл:** `/lib/database/auth-schema.sql`

```sql
-- Users table для NextAuth
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT UNIQUE NOT NULL,
  email_verified TIMESTAMP,
  image TEXT,
  auth_type TEXT NOT NULL DEFAULT 'email', -- 'email' | 'wallet'
  wallet_address TEXT UNIQUE, -- для MetaMask пользователей
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Accounts table (OAuth connections)
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'oauth' | 'email'
  provider TEXT NOT NULL, -- 'google' | 'github' | 'metamask'
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at BIGINT,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Verification tokens (для email magic links)
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TIMESTAMP NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Indexes для производительности
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
```

### 2.3 Drizzle ORM схема

**Файл:** `/lib/database/auth-schema.ts`

```typescript
import { pgTable, uuid, text, timestamp, bigint, index } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified'),
  image: text('image'),
  authType: text('auth_type').notNull().default('email'), // 'email' | 'wallet'
  walletAddress: text('wallet_address').unique(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  walletIdx: index('idx_users_wallet').on(table.walletAddress),
}));

export const accounts = pgTable('accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refreshToken: text('refresh_token'),
  accessToken: text('access_token'),
  expiresAt: bigint('expires_at', { mode: 'number' }),
  tokenType: text('token_type'),
  scope: text('scope'),
  idToken: text('id_token'),
  sessionState: text('session_state'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_accounts_user_id').on(table.userId),
}));

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionToken: text('session_token').notNull().unique(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  userIdIdx: index('idx_sessions_user_id').on(table.userId),
  tokenIdx: index('idx_sessions_token').on(table.sessionToken),
}));

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull().unique(),
  expires: timestamp('expires').notNull(),
}, (table) => ({
  pk: index('verification_tokens_pk').on(table.identifier, table.token),
}));
```

### 2.4 Конфигурация NextAuth

**Файл:** `/lib/auth.ts`

```typescript
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/database/db';
import { users, accounts, sessions, verificationTokens } from '@/lib/database/auth-schema';

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
        },
      },
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt', // JWT для serverless окружения (Vercel)
    maxAge: 7 * 24 * 60 * 60, // 7 дней
  },
  callbacks: {
    async jwt({ token, user, account }) {
      // При первом логине добавляем тип аутентификации
      if (user) {
        token.authType = 'email';
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      // Добавляем кастомные поля в сессию
      if (session.user) {
        session.user.id = token.userId as string;
        session.user.authType = token.authType as 'email' | 'wallet';
      }
      return session;
    },
  },
  pages: {
    signIn: '/login', // Кастомная страница логина
    error: '/login', // Редирект на логин при ошибке
  },
});
```

### 2.5 Environment Variables

**Добавить в `.env.local`:**

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-key-here-min-32-chars

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth (опционально)
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Database (уже должен быть настроен)
DATABASE_URL=postgresql://user:password@localhost:5432/eurocoin_wallet
```

### 2.6 API Routes

**Файл:** `/app/api/auth/[...nextauth]/route.ts`

```typescript
import { handlers } from '@/lib/auth';

export const { GET, POST } = handlers;
```

---

## Этап 3: Создание компонентов для OAuth

### 3.1 Структура компонентов

```
components/
├── auth/
│   ├── index.ts                    # Barrel export
│   ├── oauth-buttons.tsx           # Кнопки OAuth (Google, GitHub)
│   ├── auth-divider.tsx            # Разделитель "OR"
│   └── sign-out-button.tsx         # Кнопка выхода
├── wallet/
│   └── ...                         # Существующие компоненты MetaMask
└── providers/
    ├── app-providers.tsx           # Обновить для включения SessionProvider
    └── session-provider.tsx        # NextAuth SessionProvider wrapper
```

### 3.2 OAuthButtons Component

**Файл:** `/components/auth/oauth-buttons.tsx`

```typescript
'use client';

import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';
import { Chrome, Github } from 'lucide-react';
import toast from 'react-hot-toast';

export function OAuthButtons() {
  const { t } = useTranslation();

  const handleGoogleSignIn = async () => {
    try {
      await signIn('google', { callbackUrl: '/' });
    } catch (error) {
      toast.error(t('login.oauth.googleError'));
    }
  };

  const handleGitHubSignIn = async () => {
    try {
      await signIn('github', { callbackUrl: '/' });
    } catch (error) {
      toast.error(t('login.oauth.githubError'));
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Button
        variant="secondary"
        size="lg"
        fullWidth
        onClick={handleGoogleSignIn}
        className="flex items-center justify-center gap-2"
      >
        <Chrome className="h-5 w-5" />
        {t('login.oauth.google')}
      </Button>

      <Button
        variant="secondary"
        size="lg"
        fullWidth
        onClick={handleGitHubSignIn}
        className="flex items-center justify-center gap-2"
      >
        <Github className="h-5 w-5" />
        {t('login.oauth.github')}
      </Button>
    </div>
  );
}
```

### 3.3 AuthDivider Component

**Файл:** `/components/auth/auth-divider.tsx`

```typescript
'use client';

import { useTranslation } from '@/hooks/use-translation';

export function AuthDivider() {
  const { t } = useTranslation();

  return (
    <div className="relative my-4">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-outline dark:border-dark-outline" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-surface dark:bg-dark-surface px-2 text-foregroundMuted dark:text-dark-foregroundMuted">
          {t('login.divider.or')}
        </span>
      </div>
    </div>
  );
}
```

### 3.4 Session Provider Wrapper

**Файл:** `/components/providers/session-provider.tsx`

```typescript
'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import type { ReactNode } from 'react';

interface SessionProviderProps {
  children: ReactNode;
}

export function SessionProvider({ children }: SessionProviderProps) {
  return <NextAuthSessionProvider>{children}</NextAuthSessionProvider>;
}
```

### 3.5 Обновление AppProviders

**Файл:** `/components/providers/app-providers.tsx`

```typescript
'use client';

import { ReactNode } from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiConfig } from '@/lib/wagmi';
import { Toaster } from 'react-hot-toast';
import { SessionProvider } from './session-provider';

const queryClient = new QueryClient();

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <SessionProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {children}
          <Toaster position="top-center" />
        </QueryClientProvider>
      </WagmiProvider>
    </SessionProvider>
  );
}
```

---

## Этап 4: Обновление страницы Login

### 4.1 Новый дизайн Login Page

**Файл:** `/app/login/page.tsx`

```typescript
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PageTitle } from '@/components/layout/page-title';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useWalletConnection } from '@/hooks/use-wallet-connection';
import { OAuthButtons } from '@/components/auth/oauth-buttons';
import { AuthDivider } from '@/components/auth/auth-divider';
import { MetaMaskQR } from '@/components/metamask';
import { EuroCoin3D, EuroCoinInfoSection } from '@/components/eurocoin';
import { ReviewsCarousel } from '@/components/reviews';
import { useTranslation } from '@/hooks/use-translation';
import { useSession } from 'next-auth/react';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { useEffect } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const { connect, isConnecting, isConnected } = useWalletConnection();
  const { data: session, status } = useSession();
  const { t } = useTranslation();

  // Redirect if already authenticated
  useEffect(() => {
    if (session?.user || isConnected) {
      router.push('/');
    }
  }, [session, isConnected, router]);

  const handleMetaMaskConnect = async () => {
    try {
      if (isConnected) {
        Cookies.set('metamask_connected', 'true', { expires: 7 });
        toast.success(t('login.walletConnected'));
        setTimeout(() => router.push('/'), 1500);
        return;
      }

      await connect();
      Cookies.set('metamask_connected', 'true', { expires: 7 });
      toast.success(t('login.walletConnectedSuccess'));
      setTimeout(() => router.push('/'), 1500);
    } catch (error) {
      const message = error instanceof Error ? error.message : t('login.connectError');
      toast.error(message);
    }
  };

  return (
    <>
      <PageTitle title="Login" description="Connect your wallet or sign in with email" />
      <main className="min-h-screen bg-gradient-to-br from-backgroundAlt to-background dark:from-dark-backgroundAlt dark:to-dark-background">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:gap-8 sm:px-6 sm:py-12 md:flex-row md:items-center md:justify-between md:gap-10 md:px-10 md:py-16">
          <div className="flex-1 space-y-4 sm:space-y-6">
            <span className="pill bg-surface text-xs text-foreground dark:bg-dark-surface dark:text-dark-foreground sm:text-sm">
              {t('login.badge')}
            </span>
            <h1 className="text-3xl font-bold text-accent sm:text-4xl md:text-5xl">
              {t('login.heading')}
            </h1>
            <p className="max-w-xl text-sm text-foregroundMuted dark:text-dark-foregroundMuted sm:text-base md:text-lg">
              {t('login.descriptionText')}
            </p>

            {/* Auth Section */}
            <div className="flex flex-col gap-3 rounded-2xl border border-outline bg-surface p-4 shadow-card dark:border-dark-outline dark:bg-dark-surface sm:gap-4 sm:rounded-3xl sm:p-6">
              {/* MetaMask Button */}
              <Button
                size="lg"
                fullWidth
                onClick={handleMetaMaskConnect}
                disabled={isConnecting || status === 'loading'}
              >
                {isConnecting
                  ? t('login.connecting')
                  : isConnected
                    ? t('login.continue')
                    : t('login.connect')}
              </Button>

              {/* Divider */}
              <AuthDivider />

              {/* OAuth Buttons */}
              <OAuthButtons />

              <p className="text-[10px] text-foregroundMuted dark:text-dark-foregroundMuted sm:text-xs">
                {t('login.disclaimer')}
              </p>
            </div>

            {/* Links */}
            <div className="flex flex-wrap gap-3 text-[10px] text-foregroundMuted dark:text-dark-foregroundMuted sm:gap-4 sm:text-xs">
              <Link href="/info/requests" className="underline hover:text-accent">
                {t('login.link.requests')}
              </Link>
              <Link href="/info/terms" className="underline hover:text-accent">
                {t('login.link.terms')}
              </Link>
              <Link href="/info/exchange" className="underline hover:text-accent">
                {t('login.link.exchange')}
              </Link>
            </div>
          </div>

          {/* Logo */}
          <div className="flex flex-1 items-center justify-center sm:hidden">
            <Image
              src="/coinPNG.png"
              alt="EUROCOIN Logo"
              width={200}
              height={200}
              className="object-contain"
              priority
            />
          </div>
          <div className="hidden flex-1 items-center justify-center sm:flex">
            <Image
              src="/coinPNG.png"
              alt="EUROCOIN Logo"
              width={300}
              height={300}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Existing sections */}
        <EuroCoinInfoSection />
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 md:px-10">
          <section>
            <div className="mb-4 text-center sm:mb-6">
              <h2 className="mb-2 text-2xl font-bold text-foreground dark:text-dark-foreground sm:text-3xl">
                {t('eurocoin.sectionTitle')}
              </h2>
              <p className="text-sm text-foregroundMuted dark:text-dark-foregroundMuted sm:text-base">
                {t('eurocoin.sectionDescription')}
              </p>
            </div>
            <EuroCoin3D />
          </section>
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 md:px-10">
          <MetaMaskQR />
        </div>
        <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12 md:px-10">
          <ReviewsCarousel />
        </div>
      </main>
    </>
  );
}
```

### 4.2 Добавление переводов

**Файл:** `/lib/i18n/translations.ts` (добавить к существующим)

```typescript
export const translations = {
  ru: {
    // ... существующие переводы
    login: {
      // ... существующие переводы
      oauth: {
        google: 'Войти через Google',
        github: 'Войти через GitHub',
        googleError: 'Ошибка входа через Google',
        githubError: 'Ошибка входа через GitHub',
      },
      divider: {
        or: 'или',
      },
    },
  },
  en: {
    // ... существующие переводы
    login: {
      // ... существующие переводы
      oauth: {
        google: 'Sign in with Google',
        github: 'Sign in with GitHub',
        googleError: 'Google sign-in error',
        githubError: 'GitHub sign-in error',
      },
      divider: {
        or: 'or',
      },
    },
  },
};
```

---

## Этап 5: Управление доступом и middleware

### 5.1 Типы пользователей и права доступа

**Тип пользователя** | **Права**
---|---
`wallet` (MetaMask) | • Полный доступ<br>• Просмотр баланса<br>• Отправка токенов<br>• Создание запросов<br>• Все транзакции
`email` (OAuth) | • Read-only режим<br>• Просмотр информации<br>• ❌ Нет транзакций<br>• ❌ Нет отправки токенов

### 5.2 Auth Middleware

**Файл:** `/middleware.ts`

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const session = await auth();
  const isLoginPage = request.nextUrl.pathname === '/login';

  // Если пользователь не авторизован и не на странице логина
  if (!session && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Если пользователь авторизован и на странице логина - редирект на главную
  if (session && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /api/auth (NextAuth routes)
     * - /_next/static (static files)
     * - /_next/image (image optimization)
     * - /favicon.ico (favicon)
     * - /public (public files)
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
```

### 5.3 Unified Auth Hook

**Файл:** `/hooks/use-auth.ts`

```typescript
'use client';

import { useSession } from 'next-auth/react';
import { useAccount } from 'wagmi';
import { useMemo } from 'react';

export type AuthType = 'wallet' | 'email' | null;

interface UseAuthResult {
  isAuthenticated: boolean;
  authType: AuthType;
  userId?: string;
  walletAddress?: `0x${string}`;
  email?: string;
  canMakeTransactions: boolean;
  isLoading: boolean;
}

export function useAuth(): UseAuthResult {
  const { data: session, status } = useSession();
  const { address, isConnected } = useAccount();

  return useMemo(() => {
    // Loading state
    if (status === 'loading') {
      return {
        isAuthenticated: false,
        authType: null,
        canMakeTransactions: false,
        isLoading: true,
      };
    }

    // MetaMask authentication
    if (isConnected && address) {
      return {
        isAuthenticated: true,
        authType: 'wallet',
        walletAddress: address,
        canMakeTransactions: true,
        isLoading: false,
      };
    }

    // OAuth email authentication
    if (session?.user) {
      return {
        isAuthenticated: true,
        authType: 'email',
        userId: session.user.id,
        email: session.user.email ?? undefined,
        canMakeTransactions: false, // Email users can't make transactions
        isLoading: false,
      };
    }

    // Not authenticated
    return {
      isAuthenticated: false,
      authType: null,
      canMakeTransactions: false,
      isLoading: false,
    };
  }, [session, status, address, isConnected]);
}
```

### 5.4 Обновление UI компонентов

**Пример: TransferForm с проверкой прав**

```typescript
'use client';

import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';

export function TransferForm() {
  const { canMakeTransactions, authType } = useAuth();
  const { t } = useTranslation();

  if (!canMakeTransactions) {
    return (
      <div className="rounded-lg border border-outline p-4 dark:border-dark-outline">
        <p className="text-sm text-foregroundMuted dark:text-dark-foregroundMuted">
          {t('wallet.transfer.emailUserRestriction')}
        </p>
        <p className="mt-2 text-xs text-foregroundMuted dark:text-dark-foregroundMuted">
          {t('wallet.transfer.connectMetamask')}
        </p>
      </div>
    );
  }

  return (
    <form>
      {/* Transfer form fields */}
      <Button type="submit">
        {t('wallet.transfer.send')}
      </Button>
    </form>
  );
}
```

---

## Этап 6: Настройка Google OAuth

### 6.1 Google Cloud Console

1. **Создать проект:**
   - Перейти на https://console.cloud.google.com
   - Создать новый проект "EuroCoin Wallet"

2. **Включить Google+ API:**
   - APIs & Services → Library
   - Найти "Google+ API" и включить

3. **Создать OAuth credentials:**
   - APIs & Services → Credentials
   - Create Credentials → OAuth 2.0 Client ID
   - Application type: Web application
   - Name: "EuroCoin Web Wallet"

4. **Authorized redirect URIs:**
   ```
   http://localhost:3000/api/auth/callback/google
   https://your-domain.com/api/auth/callback/google
   ```

5. **Скопировать:**
   - Client ID → `GOOGLE_CLIENT_ID`
   - Client Secret → `GOOGLE_CLIENT_SECRET`

### 6.2 GitHub OAuth (опционально)

1. **Настройки GitHub:**
   - Settings → Developer settings → OAuth Apps
   - New OAuth App

2. **Application settings:**
   - Application name: "EuroCoin Wallet"
   - Homepage URL: `https://your-domain.com`
   - Authorization callback URL: `https://your-domain.com/api/auth/callback/github`

3. **Скопировать:**
   - Client ID → `GITHUB_CLIENT_ID`
   - Client Secret → `GITHUB_CLIENT_SECRET`

---

## Этап 7: Тестирование

### 7.1 Тестовые сценарии

**Сценарий 1: Вход через MetaMask**
- [ ] Клик на "Connect MetaMask"
- [ ] MetaMask запрашивает подключение
- [ ] После подключения редирект на `/`
- [ ] Cookie `metamask_connected` установлена
- [ ] Тип аутентификации: `wallet`
- [ ] Доступны все функции (транзакции)

**Сценарий 2: Вход через Google**
- [ ] Клик на "Sign in with Google"
- [ ] Редирект на Google OAuth
- [ ] Выбор аккаунта Google
- [ ] Редирект обратно на `/`
- [ ] Сессия NextAuth создана
- [ ] Тип аутентификации: `email`
- [ ] Транзакции недоступны (read-only)

**Сценарий 3: Вход через GitHub**
- [ ] Клик на "Sign in with GitHub"
- [ ] Редирект на GitHub OAuth
- [ ] Авторизация приложения
- [ ] Редирект обратно на `/`
- [ ] Сессия создана
- [ ] Read-only режим

**Сценарий 4: Переключение между аккаунтами**
- [ ] Вход через MetaMask
- [ ] Выход (signOut)
- [ ] Вход через Google
- [ ] Проверка ограничений доступа

**Сценарий 5: Persistent sessions**
- [ ] Вход через любой метод
- [ ] Закрыть браузер
- [ ] Открыть снова
- [ ] Сессия сохранена (не требуется повторный вход)

### 7.2 Unit тесты

**Файл:** `/tests/hooks/use-auth.test.ts`

```typescript
import { renderHook } from '@testing-library/react';
import { useAuth } from '@/hooks/use-auth';

describe('useAuth', () => {
  it('should return wallet auth type for MetaMask users', () => {
    // Mock useAccount to return connected state
    // ...
    const { result } = renderHook(() => useAuth());
    expect(result.current.authType).toBe('wallet');
    expect(result.current.canMakeTransactions).toBe(true);
  });

  it('should return email auth type for OAuth users', () => {
    // Mock useSession to return session
    // ...
    const { result } = renderHook(() => useAuth());
    expect(result.current.authType).toBe('email');
    expect(result.current.canMakeTransactions).toBe(false);
  });

  it('should return null for unauthenticated users', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.authType).toBe(null);
    expect(result.current.isAuthenticated).toBe(false);
  });
});
```

---

## Этап 8: Безопасность

### 8.1 Критические меры безопасности

**1. Environment Variables:**
- ✅ Все секреты в `.env.local` (не коммитить)
- ✅ `.env.example` без реальных значений
- ✅ Vercel Environment Variables для production

**2. NEXTAUTH_SECRET:**
```bash
# Генерация безопасного секрета
openssl rand -base64 32
```

**3. CSRF Protection:**
- NextAuth автоматически использует CSRF tokens
- Проверить что `sameSite: 'lax'` в cookie настройках

**4. Session Security:**
```typescript
// В /lib/auth.ts
session: {
  strategy: 'jwt',
  maxAge: 7 * 24 * 60 * 60, // 7 дней
  updateAge: 24 * 60 * 60, // обновлять каждый день
},
cookies: {
  sessionToken: {
    name: '__Secure-next-auth.session-token',
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    },
  },
},
```

**5. Rate Limiting для OAuth:**
- Установить `npm install @upstash/ratelimit @upstash/redis`
- Ограничить количество попыток входа

**6. Email Verification:**
- Опционально: требовать подтверждение email
- Использовать `email` provider от NextAuth

### 8.2 GDPR Compliance

**Файл:** `/app/api/user/delete/route.ts`

```typescript
import { auth } from '@/lib/auth';
import { db } from '@/lib/database/db';
import { users } from '@/lib/database/auth-schema';
import { eq } from 'drizzle-orm';

export async function DELETE() {
  const session = await auth();

  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Удаление всех данных пользователя
  await db.delete(users).where(eq(users.id, session.user.id));

  return Response.json({ success: true });
}
```

---

## Этап 9: Deployment

### 9.1 Vercel Deployment Checklist

**1. Environment Variables в Vercel:**
```
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=<generated-secret>
GOOGLE_CLIENT_ID=<your-client-id>
GOOGLE_CLIENT_SECRET=<your-client-secret>
DATABASE_URL=<postgres-connection-string>
```

**2. Database Migration:**
```bash
# Локально
npm run db:migrate

# Или через Vercel CLI
vercel env pull .env.local
npm run db:migrate
```

**3. OAuth Redirect URLs:**
- Обновить Google Console с production URL
- Обновить GitHub OAuth settings

**4. Testing:**
```bash
# Production build локально
npm run build
npm run start

# Проверить все OAuth flows
```

### 9.2 Post-Deployment Monitoring

**Логирование:**
```typescript
// В callbacks NextAuth
async signIn({ user, account }) {
  console.log(`[AUTH] Sign in: ${user.email} via ${account.provider}`);
  return true;
},
async session({ session, token }) {
  console.log(`[AUTH] Session: ${session.user.email}`);
  return session;
},
```

**Metrics для отслеживания:**
- Количество входов через MetaMask vs OAuth
- Ошибки OAuth (failed sign-ins)
- Session duration
- User retention

---

## Этап 10: Документация и поддержка

### 10.1 User Documentation

**Файл:** `/docs/user-auth-guide.md`

```markdown
# Руководство по входу в EuroCoin Wallet

## Способы входа

### 1. MetaMask Wallet (Рекомендуется)
- **Полный доступ** к функциям кошелька
- Возможность отправки токенов
- Создание запросов на обмен

**Как войти:**
1. Установите MetaMask расширение
2. Нажмите "Connect MetaMask"
3. Подтвердите подключение в MetaMask

### 2. Email (Google/GitHub)
- **Read-only доступ**
- Просмотр информации о токене
- Без возможности транзакций

**Как войти:**
1. Нажмите "Sign in with Google" или "Sign in with GitHub"
2. Выберите аккаунт
3. Подтвердите доступ
```

### 10.2 Developer Documentation

**Файл:** `/docs/oauth-implementation.md`

```markdown
# OAuth 2.0 Implementation Guide

## Architecture
[Диаграммы и схемы из этого документа]

## API Endpoints
- `GET /api/auth/signin` - Страница входа
- `GET /api/auth/callback/:provider` - OAuth callback
- `POST /api/auth/signout` - Выход

## Hooks
- `useAuth()` - Unified authentication state
- `useSession()` - NextAuth session (OAuth only)
- `useWalletConnection()` - MetaMask connection

## Database Schema
[SQL schema из Этапа 2]
```

---

## Резюме реализации

### Стек технологий
- **OAuth Library:** NextAuth.js v5
- **Провайдеры:** Google OAuth, GitHub OAuth
- **Database:** PostgreSQL + Drizzle ORM
- **Session:** JWT-based
- **UI:** Existing TailwindCSS components

### Временные затраты (оценка)

| Этап | Время |
|------|-------|
| 1. Архитектура и выбор провайдера | 2 часа |
| 2. Настройка NextAuth + БД | 4 часа |
| 3. Компоненты OAuth | 3 часа |
| 4. Обновление Login page | 2 часа |
| 5. Middleware и доступ | 3 часа |
| 6. Настройка Google/GitHub OAuth | 1 час |
| 7. Тестирование | 4 часа |
| 8. Безопасность | 2 часа |
| 9. Deployment | 2 часа |
| 10. Документация | 2 часа |
| **ИТОГО** | **25 часов** |

### Приоритеты MVP

**Phase 1 (Must have):**
- ✅ NextAuth setup
- ✅ Google OAuth
- ✅ Database schema
- ✅ Login page UI
- ✅ useAuth hook
- ✅ Read-only режим для email users

**Phase 2 (Should have):**
- GitHub OAuth
- Email verification
- User profile page
- Session management UI

**Phase 3 (Nice to have):**
- Magic link login
- Microsoft OAuth
- Two-factor authentication
- Advanced session analytics

---

## Следующие шаги

1. **Создать PostgreSQL schema** для пользователей
2. **Установить NextAuth.js** и зависимости
3. **Получить Google OAuth credentials**
4. **Создать компоненты OAuth**
5. **Обновить Login page**
6. **Тестировать локально**
7. **Deploy на Vercel**

**Начать с:** Этап 2.1 - установка зависимостей
