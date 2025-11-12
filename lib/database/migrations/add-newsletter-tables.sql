-- Migration: Add Newsletter Tables
-- Description: Creates tables for newsletter subscription system with email verification
-- Date: 2025-01-30

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
-- 4. Add updated_at trigger for newsletter_subscribers
-- ============================================
DROP TRIGGER IF EXISTS trg_newsletter_subscribers_updated ON newsletter_subscribers;
CREATE TRIGGER trg_newsletter_subscribers_updated
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE newsletter_subscribers IS 'Stores newsletter subscribers with email verification';
COMMENT ON TABLE newsletter_campaigns IS 'Stores newsletter campaign history';
COMMENT ON TABLE newsletter_logs IS 'Logs newsletter sending attempts';

