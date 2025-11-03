# Исправление ошибки NextAuth "Configuration"

## Проблема
После попытки входа через Google возникает ошибка `error=Configuration` и пользователь не аутентифицируется.

## Причины ошибки Configuration

Ошибка `Configuration` в NextAuth обычно возникает когда:

1. **Неправильный callback URL в Google Cloud Console**
2. **NEXTAUTH_URL не совпадает с фактическим доменом**
3. **Проблема с базой данных или адаптером**

## Проверка в Google Cloud Console

### 1. Откройте Google Cloud Console
- Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
- Выберите ваш проект
- APIs & Services → Credentials
- Откройте ваш OAuth 2.0 Client ID

### 2. Проверьте Authorized redirect URIs

Должен быть **точно** такой URL (без изменений):

```
https://www.euro-coin.eu/api/auth/callback/google
```

**Важно:**
- ✅ Протокол: `https://` (не `http://`)
- ✅ Домен: `www.euro-coin.eu` (точно как в `NEXTAUTH_URL`)
- ✅ Путь: `/api/auth/callback/google` (без изменений)
- ✅ Без слэша в конце (не `/api/auth/callback/google/`)

### 3. Authorized JavaScript origins

Также добавьте:

```
https://www.euro-coin.eu
```

## Проверка в Vercel

### 1. Переменные окружения

В Vercel → Settings → Environment Variables:

```env
NEXTAUTH_URL=https://www.euro-coin.eu
NEXTAUTH_SECRET=<ваш-секрет>
GOOGLE_CLIENT_ID=<ваш-client-id>
GOOGLE_CLIENT_SECRET=<ваш-client-secret>
DATABASE_URL=<ваш-database-url>
```

**Важно:**
- `NEXTAUTH_URL` должен быть **без** `NEXTAUTH_URL=` в начале
- `NEXTAUTH_URL` должен быть **без** слэша в конце
- Все переменные должны быть для **Production** environment

## Проверка логов Vercel

После деплоя проверьте логи:

1. Vercel Dashboard → ваше deployment → View Function Logs
2. Ищите строки:
   - `[AUTH] Configuration check:` — показывает все переменные
   - `[AUTH] NEXTAUTH_URL validated:` — показывает валидацию URL
   - `[AUTH] Redirect callback called:` — показывает redirect после OAuth
   - `[AUTH EVENT] User signed in:` — показывает успешный вход

## Типичные ошибки

### Ошибка 1: Callback URL не совпадает
```
В Google Console: https://www.euro-coin.eu/api/auth/callback/google
В NextAuth: https://euro-coin.eu/api/auth/callback/google (без www)
```
**Решение:** Убедитесь, что в Google Console и `NEXTAUTH_URL` используется одинаковый домен (с www или без www)

### Ошибка 2: NEXTAUTH_URL неправильный формат
```
NEXTAUTH_URL=NEXTAUTH_URL=https://www.euro-coin.eu  ❌
NEXTAUTH_URL=https://www.euro-coin.eu/              ❌ (слэш в конце)
NEXTAUTH_URL=https://www.euro-coin.eu               ✅
```
**Решение:** Исправьте формат в Vercel

### Ошибка 3: Нет адаптера базы данных
```
[AUTH] ⚠️  WARNING: Email provider requires adapter but adapter is not initialized!
```
**Решение:** Убедитесь, что `DATABASE_URL` установлен и база доступна

## После исправления

1. Сохраните изменения в Google Cloud Console
2. Перезапустите deployment в Vercel (Redeploy)
3. Попробуйте войти снова
4. Проверьте логи Vercel для диагностики

## Дополнительная диагностика

Если ошибка остается:

1. Проверьте логи Vercel Function Logs — там должны быть детальные ошибки
2. Убедитесь, что все переменные окружения установлены
3. Проверьте, что база данных доступна из Vercel
4. Убедитесь, что домен верифицирован в Vercel

