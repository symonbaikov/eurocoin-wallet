# Диагностика ошибки Configuration в NextAuth

## Проблема
Ошибка "Configuration" появляется при попытке входа через Google, хотя провайдер доступен (`/api/auth/providers` возвращает `google`).

## Шаги диагностики

### 1. Проверьте логи сервера (не только браузера!)

В терминале где запущен `npm run dev` должны быть логи вида:
```
[AUTH] ✅ Google OAuth provider initialized: { ... }
[AUTH] Sign in attempt: { ... }
[AUTH EVENT] ❌ Sign in error occurred: { ... }
```

### 2. Проверьте переменные окружения

**В браузере (только для проверки):**
```javascript
// Откройте консоль браузера и выполните:
fetch('/api/auth/providers').then(r => r.json()).then(console.log)
```

**На сервере (в логах):**
Должны увидеть:
```
[AUTH] Configuration check: {
  hasNextAuthSecret: true,
  finalNextAuthUrl: 'https://www.euro-coin.eu',
  hasGoogleClientId: true,
  hasGoogleClientSecret: true,
  hasAdapter: true
}
```

### 3. Проверьте Google Cloud Console

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Откройте ваш проект
3. Перейдите в "APIs & Services" > "Credentials"
4. Найдите ваш OAuth 2.0 Client ID
5. Проверьте:

**Authorized JavaScript origins:**
- ✅ `https://www.euro-coin.eu` (БЕЗ `/api/auth/callback/google`!)
- ❌ `https://www.euro-coin.eu/api/auth/callback/google`

**Authorized redirect URIs:**
- ✅ `https://www.euro-coin.eu/api/auth/callback/google`
- ❌ `https://www.euro-coin.eu`

### 4. Проверьте что происходит при клике на кнопку

Откройте Network tab в DevTools и:
1. Нажмите "Sign in with Google"
2. Найдите запрос к `/api/auth/signin/google`
3. Посмотрите Response и Status Code
4. Проверьте есть ли редирект на Google

### 5. Проверьте cookies

Ошибка "Configuration" может быть связана с cookies. Проверьте:
- Cookies включены в браузере
- Нет блокировки cookies от сторонних сайтов
- Secure cookies работают на HTTPS

### 6. Проверьте что адаптер работает

Ошибка может быть связана с базой данных. Проверьте логи:
```
[AUTH] ✅ Database adapter enabled for email authentication
```

Если видите ошибки про БД - это может быть причиной.

## Что делать дальше

1. **Запустите сервер заново** и посмотрите логи при старте
2. **Попробуйте войти через Google** и смотрите логи в реальном времени
3. **Пришлите логи сервера** (не только браузера!), особенно:
   - Логи при старте сервера
   - Логи при клике на кнопку Google
   - Логи при редиректе обратно с Google

## Типичные причины ошибки Configuration

1. **Неправильный `NEXTAUTH_URL`** - должен быть БЕЗ слеша в конце
2. **Отсутствует `NEXTAUTH_SECRET`** - требуется для работы
3. **Проблемы с адаптером БД** - если используется email auth
4. **Неправильный redirect URI в Google Console** - должен точно совпадать
5. **Проблемы с cookies** - особенно в production с HTTPS

## Проверка через API

Откройте в браузере:
- `https://www.euro-coin.eu/api/auth/providers` - должен вернуть объект с `google`
- `https://www.euro-coin.eu/api/auth/session` - проверить текущую сессию
- `https://www.euro-coin.eu/api/auth/csrf` - проверить CSRF токен

Если какой-то из этих endpoints возвращает ошибку - это источник проблемы.

