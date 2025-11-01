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

/**
 * Get the singleton instance of the Telegram bot
 * Creates the bot only once and reuses it across the app
 */
export function getBot(): Telegraf {
  if (!bot) {
    const apiKey = process.env.TELEGRAM_API_KEY;

    if (!apiKey) {
      throw new Error(
        'TELEGRAM_API_KEY is not set in environment variables.\n' +
        'Please add it to your .env.local file:\n' +
        'TELEGRAM_API_KEY=your_bot_token_here'
      );
    }

    bot = new Telegraf(apiKey);
    console.log('[bot] Telegram bot instance created');
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
