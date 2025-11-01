/**
 * Telegram Bot Singleton Instance
 *
 * This file provides a single instance of the Telegraf bot that is shared
 * across the entire application. This ensures that:
 * 1. All callback_query handlers are properly registered
 * 2. There are no duplicate bot instances
 * 3. The bot can receive and handle webhook updates correctly
 */

import { Telegraf } from 'telegraf';

let bot: Telegraf | null = null;
let botCreationAttempted = false;

/**
 * Get the singleton instance of the Telegram bot
 * Creates the bot only once and reuses it across the app
 * Returns null if TELEGRAM_API_KEY is not available (e.g., during build)
 */
export function getBot(): Telegraf {
  if (!bot && !botCreationAttempted) {
    botCreationAttempted = true;
    const apiKey = process.env.TELEGRAM_API_KEY;

    if (!apiKey) {
      // During build time or when API key is not set, just warn instead of throwing
      // This allows the build to succeed
      if (process.env.NODE_ENV !== 'production') {
        console.warn(
          '⚠️  TELEGRAM_API_KEY is not set in environment variables.\n' +
          '   Telegram bot features will be disabled.\n' +
          '   Add it to your .env.local file:\n' +
          '   TELEGRAM_API_KEY=your_bot_token_here'
        );
      }
      // Don't throw during build - create a dummy bot that will fail gracefully at runtime
      const DummyBot = class extends Telegraf {
        constructor() {
          super('DUMMY_TOKEN_FOR_BUILD');
        }
      };
      bot = new DummyBot();
      return bot;
    }

    bot = new Telegraf(apiKey);
    console.log('[bot] Telegram bot instance created');
  }

  if (!bot) {
    throw new Error('TELEGRAM_API_KEY is not configured');
  }

  return bot;
}

/**
 * Get the Telegram API instance
 * Useful for sending messages without accessing the full bot instance
 */
export function getTelegramApi() {
  return getBot().telegram;
}
