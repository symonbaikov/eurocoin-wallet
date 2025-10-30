# OAuth 2.0 Components - Этап 3 Завершен ✅

## Что было сделано

### 1. Созданы OAuth компоненты

#### OAuthButtons (`components/auth/oauth-buttons.tsx`)
Компонент с кнопками входа через OAuth провайдеры.

**Функциональность:**
- ✅ Кнопка "Sign in with Google" с иконкой Chrome
- ✅ Кнопка "Sign in with GitHub" с иконкой GitHub
- ✅ Loading states для каждой кнопки
- ✅ Обработка ошибок с toast notifications
- ✅ Поддержка callbackUrl
- ✅ Disabled state когда идет загрузка

**Props:**
```typescript
interface OAuthButtonsProps {
  callbackUrl?: string;    // Default: '/'
  disabled?: boolean;       // Default: false
}
```

**Использование:**
```tsx
import { OAuthButtons } from '@/components/auth';

<OAuthButtons callbackUrl="/" />
```

#### AuthDivider (`components/auth/auth-divider.tsx`)
Визуальный разделитель между MetaMask и OAuth методами входа.

**Функциональность:**
- ✅ Горизонтальная линия
- ✅ Текст "ИЛИ" / "OR" (из translations)
- ✅ Поддержка dark mode
- ✅ Responsive дизайн

**Использование:**
```tsx
import { AuthDivider } from '@/components/auth';

<AuthDivider />
```

#### SessionProvider (`components/auth/session-provider.tsx`)
Wrapper для NextAuth SessionProvider.

**Функциональность:**
- ✅ Обертка над `NextAuthSessionProvider`
- ✅ Автоматический refetch сессии каждые 5 минут
- ✅ Refetch при focus window
- ✅ Типизация для Session

**Props:**
```typescript
interface SessionProviderProps {
  children: ReactNode;
  session?: Session | null;
}
```

**Использование:**
```tsx
// Уже интегрирован в AppProviders
import { SessionProvider } from '@/components/auth';

<SessionProvider>
  {children}
</SessionProvider>
```

#### SignOutButton (`components/auth/sign-out-button.tsx`)
Кнопка выхода из OAuth сессии.

**Функциональность:**
- ✅ Sign out через NextAuth
- ✅ Loading state
- ✅ Toast notifications
- ✅ Redirect на /login после выхода
- ✅ Иконка LogOut (опционально)
- ✅ Кастомизируемый variant и size

**Props:**
```typescript
interface SignOutButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  showIcon?: boolean;
  callbackUrl?: string;    // Default: '/login'
}
```

**Использование:**
```tsx
import { SignOutButton } from '@/components/auth';

<SignOutButton
  variant="ghost"
  showIcon={true}
  callbackUrl="/login"
/>
```

### 2. Barrel Export (`components/auth/index.ts`)

Все компоненты экспортируются через единый файл:

```typescript
export { OAuthButtons } from './oauth-buttons';
export { AuthDivider } from './auth-divider';
export { SessionProvider } from './session-provider';
export { SignOutButton } from './sign-out-button';
```

**Использование:**
```tsx
import { OAuthButtons, AuthDivider, SignOutButton } from '@/components/auth';
```

### 3. Обновлен AppProviders

**Файл:** `components/providers/app-providers.tsx`

**Изменения:**
- ✅ Добавлен import SessionProvider
- ✅ SessionProvider обернут вокруг всего приложения
- ✅ Расположен выше ThemeProvider для корректной работы

**Структура провайдеров:**
```tsx
<HelmetProvider>
  <SessionProvider>           {/* NEW */}
    <ThemeProvider>
      <LanguageProvider>
        <WagmiProvider>
          <QueryClientProvider>
            {children}
          </QueryClientProvider>
        </WagmiProvider>
      </LanguageProvider>
    </ThemeProvider>
  </SessionProvider>
</HelmetProvider>
```

### 4. Добавлены переводы

**Файл:** `lib/i18n/translations.ts`

#### Русские переводы:
```typescript
login: {
  oauth: {
    google: "Войти через Google",
    github: "Войти через GitHub",
    googleLoading: "Вход через Google...",
    githubLoading: "Вход через GitHub...",
    googleError: "Ошибка входа через Google",
    githubError: "Ошибка входа через GitHub",
  },
  divider: {
    or: "или",
  },
},
auth: {
  signOut: "Выйти",
  signingOut: "Выход...",
  signOutSuccess: "Вы успешно вышли из системы",
  signOutError: "Ошибка при выходе из системы",
},
```

#### Английские переводы:
```typescript
login: {
  oauth: {
    google: "Sign in with Google",
    github: "Sign in with GitHub",
    googleLoading: "Signing in with Google...",
    githubLoading: "Signing in with GitHub...",
    googleError: "Google sign-in error",
    githubError: "GitHub sign-in error",
  },
  divider: {
    or: "or",
  },
},
auth: {
  signOut: "Sign out",
  signingOut: "Signing out...",
  signOutSuccess: "You have successfully signed out",
  signOutError: "Error signing out",
},
```

---

## Структура файлов

```
components/
├── auth/
│   ├── index.ts                      ✅ Barrel export
│   ├── oauth-buttons.tsx             ✅ OAuth login buttons
│   ├── auth-divider.tsx              ✅ "OR" divider
│   ├── session-provider.tsx          ✅ NextAuth session wrapper
│   └── sign-out-button.tsx           ✅ Sign out button
└── providers/
    └── app-providers.tsx             ✅ Updated with SessionProvider

lib/i18n/
└── translations.ts                   ✅ Added OAuth translations
```

---

## Как использовать компоненты

### Пример: Login Page Layout

```tsx
'use client';

import { OAuthButtons, AuthDivider } from '@/components/auth';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  return (
    <div className="login-container">
      {/* MetaMask Button */}
      <Button onClick={handleMetaMaskConnect}>
        Connect MetaMask
      </Button>

      {/* Divider */}
      <AuthDivider />

      {/* OAuth Buttons */}
      <OAuthButtons callbackUrl="/" />
    </div>
  );
}
```

### Пример: Header с Sign Out

```tsx
'use client';

import { SignOutButton } from '@/components/auth';
import { useSession } from 'next-auth/react';

export function Header() {
  const { data: session } = useSession();

  if (!session) return null;

  return (
    <header>
      <div>Welcome, {session.user.email}</div>
      <SignOutButton variant="ghost" />
    </header>
  );
}
```

---

## Testing Checklist

### Manual Testing

- [ ] **OAuthButtons:**
  - [ ] Клик на "Sign in with Google" открывает OAuth popup
  - [ ] Клик на "Sign in with GitHub" открывает OAuth popup
  - [ ] Loading state отображается корректно
  - [ ] Ошибки показывают toast notifications
  - [ ] После успешного входа redirect на callbackUrl

- [ ] **AuthDivider:**
  - [ ] Линия отображается корректно
  - [ ] Текст "или" / "or" центрирован
  - [ ] Dark mode работает

- [ ] **SessionProvider:**
  - [ ] useSession() hook работает в любом компоненте
  - [ ] Сессия обновляется автоматически
  - [ ] При refresh страницы сессия сохраняется

- [ ] **SignOutButton:**
  - [ ] Клик на кнопку выполняет sign out
  - [ ] Redirect на /login после выхода
  - [ ] Toast notification показывается
  - [ ] Loading state работает

### Integration Testing

```bash
# Test OAuth flow
1. Open /login
2. Click "Sign in with Google"
3. Complete Google OAuth
4. Verify redirect to /
5. Verify session exists
6. Click Sign Out
7. Verify redirect to /login
```

---

## Troubleshooting

### ❌ Error: "useSession must be wrapped in SessionProvider"

**Проблема:** Компонент использует `useSession()` но не обернут в SessionProvider

**Решение:**
SessionProvider уже добавлен в AppProviders, убедитесь что:
1. AppProviders обернут вокруг всего app в layout.tsx
2. Компонент marked as `'use client'` если использует useSession

### ❌ Error: "signIn is not a function"

**Проблема:** Не импортирован signIn из next-auth/react

**Решение:**
```tsx
import { signIn } from 'next-auth/react';
```

### ❌ OAuth buttons не работают

**Проблема:** Environment variables не настроены

**Решение:**
1. Проверьте `.env.local`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
2. Перезапустите dev server

---

## Что дальше?

**Этап 4: Обновление Login Page**
- Интегрировать OAuth компоненты в существующую страницу логина
- Обновить layout с MetaMask + OAuth buttons
- Добавить useAuth unified hook
- Протестировать весь authentication flow

**Готовы к Этапу 4?** 🚀
