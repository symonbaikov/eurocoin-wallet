# Complete Google OAuth Setup Guide

## Шаг 1: Настройка Google Cloud Console

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте проект или выберите существующий
3. Включите Google+ API:
   - Перейдите в "APIs & Services" > "Library"
   - Найдите "Google+ API" и включите его
4. Создайте OAuth 2.0 Client ID:
   - Перейдите в "APIs & Services" > "Credentials"
   - Нажмите "Create Credentials" > "OAuth client ID"
   - Выберите "Web application"
   - Назовите клиент (например, "EuroCoin Web Wallet")

### Authorized JavaScript origins (Важно!)
Добавьте ТОЛЬКО домены (без путей):
- Для разработки: `http://localhost:3000`
- Для продакшена: `https://www.euro-coin.eu`

### Authorized redirect URIs (Важно!)
Добавьте полные пути:
- Для разработки: `http://localhost:3000/api/auth/callback/google`
- Для продакшена: `https://www.euro-coin.eu/api/auth/callback/google`

5. Скопируйте **Client ID** и **Client Secret**

## Шаг 2: Настройка переменных окружения

### Локальная разработка (`.env.local`)

```env
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here-generate-with-openssl-rand-base64-32

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/web_wallet_db
```

### Production (Vercel)

В настройках проекта Vercel добавьте:
- `NEXTAUTH_URL` = `https://www.euro-coin.eu` (БЕЗ слеша в конце!)
- `NEXTAUTH_SECRET` = сгенерированный секрет
- `GOOGLE_CLIENT_ID` = ваш Client ID
- `GOOGLE_CLIENT_SECRET` = ваш Client Secret
- `DATABASE_URL` = ваша строка подключения к БД

## Шаг 3: Генерация NEXTAUTH_SECRET

```bash
openssl rand -base64 32
```

Скопируйте результат и добавьте в переменные окружения.

## Шаг 4: Проверка конфигурации

После добавления переменных окружения:

1. Перезапустите dev-сервер:
```bash
npm run dev
```

2. Проверьте логи консоли - должны увидеть:
```
[AUTH] Configuration check: {
  hasNextAuthSecret: true,
  finalNextAuthUrl: 'http://localhost:3000',
  hasGoogleClientId: true,
  hasGoogleClientSecret: true,
  hasAdapter: true
}
```

3. Откройте `/api/auth/providers` в браузере - должен вернуть:
```json
{
  "google": {
    "id": "google",
    "name": "Google",
    "type": "oauth",
    "signinUrl": "/api/auth/signin/google",
    "callbackUrl": "/api/auth/callback/google"
  }
}
```

## Шаг 5: Тестирование

1. Откройте `/login`
2. Нажмите "Sign in with Google"
3. Должно произойти перенаправление на Google
4. После авторизации - обратно на ваш сайт

## Возможные проблемы

### Проблема: "Invalid origin" в Google Cloud Console
**Решение:** Убедитесь, что в "Authorized JavaScript origins" указаны ТОЛЬКО домены:
- ✅ `http://localhost:3000`
- ❌ `http://localhost:3000/api/auth/callback/google`

### Проблема: "Redirect URI mismatch"
**Решение:** Убедитесь, что в "Authorized redirect URIs" указан полный путь:
- ✅ `http://localhost:3000/api/auth/callback/google`
- ❌ `http://localhost:3000`

### Проблема: "Configuration error"
**Решение:** 
1. Проверьте что `NEXTAUTH_URL` установлен правильно (без слеша в конце)
2. Проверьте что `NEXTAUTH_SECRET` установлен
3. Проверьте логи сервера для деталей ошибки

### Проблема: Кнопка Google не появляется
**Решение:**
1. Проверьте что `GOOGLE_CLIENT_ID` и `GOOGLE_CLIENT_SECRET` установлены
2. Проверьте логи консоли браузера
3. Откройте `/api/auth/providers` - должен вернуть объект с `google`

## Дополнительная информация

- NextAuth.js v5 Documentation: https://authjs.dev/
- Google OAuth Setup: https://developers.google.com/identity/protocols/oauth2

