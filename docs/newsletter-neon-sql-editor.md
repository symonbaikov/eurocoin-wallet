# Применение миграции newsletter в Neon SQL Editor

## Способ 1: Прямое выполнение SQL в Neon SQL Editor

1. Откройте Neon SQL Editor (как на вашем скриншоте)
2. Убедитесь, что выбрана правильная база данных (branch "main")
3. Скопируйте и вставьте следующий SQL код в редактор:

```sql
-- Migration: Add Newsletter Tables
-- Description: Creates tables for newsletter subscription system with email verification

-- ============================================
-- 1. Create newsletter_subscribers table
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  chat_id VARCHAR(255),
  verified BOOLEAN DEFAULT FALSE,
  verification_code VARCHAR(6),
  code_expires_at TIMESTAMP,
  subscribed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  language VARCHAR(10) DEFAULT 'ru',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для newsletter_subscribers
CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_newsletter_chat_id ON newsletter_subscribers(chat_id);
CREATE INDEX IF NOT EXISTS idx_newsletter_is_active ON newsletter_subscribers(is_active);
CREATE INDEX IF NOT EXISTS idx_newsletter_verified ON newsletter_subscribers(verified);
CREATE INDEX IF NOT EXISTS idx_newsletter_language ON newsletter_subscribers(language);

-- ============================================
-- 2. Create newsletter_campaigns table
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id SERIAL PRIMARY KEY,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  language VARCHAR(10) DEFAULT 'en',
  sent_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  created_by VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at TIMESTAMP
);

-- ============================================
-- 3. Create newsletter_logs table
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter_logs (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES newsletter_campaigns(id),
  chat_id VARCHAR(255) NOT NULL,
  success BOOLEAN DEFAULT FALSE,
  error_message TEXT,
  sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для newsletter_logs
CREATE INDEX IF NOT EXISTS idx_logs_campaign_id ON newsletter_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_logs_chat_id ON newsletter_logs(chat_id);
CREATE INDEX IF NOT EXISTS idx_logs_sent_at ON newsletter_logs(sent_at);

-- ============================================
-- 4. Проверка существования функции update_updated_at_column
-- ============================================
-- Если функция не существует, создайте её:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'update_updated_at_column'
  ) THEN
    CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  END IF;
END $$;

-- ============================================
-- 5. Add updated_at trigger for newsletter_subscribers
-- ============================================
DROP TRIGGER IF EXISTS trg_newsletter_subscribers_updated ON newsletter_subscribers;
CREATE TRIGGER trg_newsletter_subscribers_updated
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

4. Нажмите кнопку **"Run"** (или используйте горячую клавишу)
5. Проверьте результат - должны появиться сообщения об успешном создании таблиц

## Способ 2: Проверка перед применением

Если хотите сначала проверить, существуют ли таблицы:

```sql
-- Проверка существования таблиц newsletter
SELECT table_name
FROM information_schema.tables
WHERE table_name LIKE 'newsletter%'
ORDER BY table_name;
```

Если таблицы уже существуют, вы увидите их список. Если список пустой - таблиц нет, нужно применить миграцию.

## Проверка после применения

После выполнения миграции проверьте созданные таблицы:

```sql
-- Список таблиц newsletter
SELECT table_name
FROM information_schema.tables
WHERE table_name LIKE 'newsletter%'
ORDER BY table_name;

-- Структура таблицы newsletter_subscribers
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'newsletter_subscribers'
ORDER BY ordinal_position;

-- Проверка индексов
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename LIKE 'newsletter%'
ORDER BY tablename, indexname;
```

## Важные замечания

1. **Безопасность**: Используется `CREATE TABLE IF NOT EXISTS`, поэтому повторное выполнение безопасно
2. **Функция update_updated_at_column**: Миграция проверяет существование функции и создаёт её, если нужно
3. **Триггер**: Триггер для `updated_at` будет пересоздан при повторном выполнении (безопасно)

## Что будет создано

- ✅ Таблица `newsletter_subscribers` с 11 колонками и 5 индексами
- ✅ Таблица `newsletter_campaigns` для истории рассылок
- ✅ Таблица `newsletter_logs` для логирования отправки
- ✅ Триггер для автоматического обновления `updated_at`

## После применения

После успешного применения миграции:

1. Ошибки HTTP 500 должны исчезнуть
2. Подписка на рассылку будет работать
3. Можно протестировать функционал на сайте
