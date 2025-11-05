# Telegram Webhook Setup для Production

## Текущая конфигурация

Webhook установлен на production URL: `https://www.euro-coin.eu/api/telegram-webhook`

## Проблема, которая была исправлена

### Проблема

- Webhook был установлен на ngrok URL (для разработки)
- Функции в боте использовали `localhost:3000` вместо production URL
- Обновления от бота не доходили до production среды

### Решение

1. **Исправлена функция определения URL** - теперь код автоматически определяет production URL из:
   - Переменной окружения `NEXT_PUBLIC_APP_URL`
   - Заголовков HTTP запроса (host и protocol)
   - Fallback на `https://www.euro-coin.eu` в production режиме

2. **Webhook установлен на production URL** - все обновления от Telegram теперь приходят на production сервер

## Настройка переменных окружения

### Для Production

Убедитесь, что в production среде установлена переменная:

```env
NEXT_PUBLIC_APP_URL=https://www.euro-coin.eu
```

Это гарантирует, что все внутренние запросы будут использовать правильный URL.

### Для локальной разработки

Для локальной разработки переменная не обязательна - код автоматически использует `http://localhost:3000`.

## Управление webhook

### Проверка текущего webhook

```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
```

### Установка webhook (через скрипт)

```bash
# Используя скрипт
tsx scripts/set-telegram-webhook.ts

# Или указав URL явно
tsx scripts/set-telegram-webhook.ts https://www.euro-coin.eu/api/telegram-webhook
```

### Установка webhook (через curl)

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://www.euro-coin.eu/api/telegram-webhook"
```

### Удаление webhook (для переключения на polling)

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/deleteWebhook"
```

## Тестирование

1. **Проверьте, что webhook работает:**
   - Отправьте сообщение боту в Telegram
   - Проверьте логи сервера - должно появиться обновление

2. **Проверьте, что обновления доходят до production:**
   - Отправьте сообщение через бота
   - Проверьте, что оно отображается на сайте https://www.euro-coin.eu

3. **Проверьте внутренние запросы:**
   - При изменении статуса заявки через бота
   - Проверьте, что статус обновляется на сайте

## Отладка

### Проблема: Webhook не получает обновления

1. Проверьте, что webhook установлен правильно:

   ```bash
   curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo"
   ```

2. Проверьте, что endpoint доступен:

   ```bash
   curl "https://www.euro-coin.eu/api/telegram-webhook"
   ```

   Должен вернуть: `{"status":"Telegram webhook is active"}`

3. Проверьте логи сервера на наличие ошибок

### Проблема: Обновления приходят, но не обрабатываются

1. Проверьте переменную `TELEGRAM_API_KEY` - она должна быть установлена
2. Проверьте логи сервера на наличие ошибок обработки
3. Убедитесь, что база данных доступна и подключена

### Проблема: Внутренние запросы идут на localhost

1. Убедитесь, что `NEXT_PUBLIC_APP_URL` установлена в production
2. Или что код может определить URL из заголовков запроса
3. Проверьте логи - функция `getAppUrl()` должна логировать используемый URL

## Изменения в коде

### Файл: `app/api/telegram-webhook/route.ts`

1. Добавлена функция `getAppUrl()` для автоматического определения URL
2. Обновлены все места, где использовался `NEXT_PUBLIC_APP_URL || "http://localhost:3000"`
3. Добавлено кэширование URL из заголовков запроса для использования в обработчиках бота

### Основные изменения:

- Функция `updateRequestStatus()` теперь использует `getAppUrl()`
- Функция получения истории чата использует `getAppUrl()`
- Функция отправки рассылки использует `getAppUrl()`
