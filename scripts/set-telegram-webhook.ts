#!/usr/bin/env tsx

/**
 * Script to set Telegram webhook URL
 * 
 * Usage:
 *   tsx scripts/set-telegram-webhook.ts [webhook-url]
 * 
 * If webhook-url is not provided, it will use:
 *   - NEXT_PUBLIC_APP_URL environment variable + /api/telegram-webhook
 *   - Or https://www.euro-coin.eu/api/telegram-webhook as fallback
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(process.cwd(), '.env.local') });
dotenv.config({ path: resolve(process.cwd(), '.env') });

const TELEGRAM_API_KEY = process.env.TELEGRAM_API_KEY;

if (!TELEGRAM_API_KEY) {
  console.error('❌ TELEGRAM_API_KEY is not set in environment variables');
  process.exit(1);
}

async function setWebhook(webhookUrl: string) {
  const url = `https://api.telegram.org/bot${TELEGRAM_API_KEY}/setWebhook`;
  
  console.log(`📡 Setting webhook to: ${webhookUrl}`);
  console.log(`🔗 API URL: ${url}`);
  
  try {
    const response = await fetch(`${url}?url=${encodeURIComponent(webhookUrl)}`);
    const data = await response.json();
    
    if (data.ok) {
      console.log('✅ Webhook set successfully!');
      console.log(`📋 Webhook URL: ${webhookUrl}`);
      return true;
    } else {
      console.error('❌ Failed to set webhook:');
      console.error(JSON.stringify(data, null, 2));
      return false;
    }
  } catch (error) {
    console.error('❌ Error setting webhook:');
    console.error(error);
    return false;
  }
}

async function getWebhookInfo() {
  const url = `https://api.telegram.org/bot${TELEGRAM_API_KEY}/getWebhookInfo`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.ok) {
      console.log('\n📋 Current webhook info:');
      console.log(JSON.stringify(data.result, null, 2));
      return data.result;
    } else {
      console.error('❌ Failed to get webhook info');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting webhook info:');
    console.error(error);
    return null;
  }
}

async function main() {
  // Get webhook URL from command line argument or environment
  let webhookUrl = process.argv[2];
  
  if (!webhookUrl) {
    // Try to get from environment variable
    webhookUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/api/telegram-webhook`
      : 'https://www.euro-coin.eu/api/telegram-webhook';
  }
  
  // Ensure URL ends with /api/telegram-webhook
  if (!webhookUrl.includes('/api/telegram-webhook')) {
    webhookUrl = webhookUrl.replace(/\/$/, '') + '/api/telegram-webhook';
  }
  
  console.log('🤖 Telegram Webhook Setup Script\n');
  
  // Show current webhook info
  await getWebhookInfo();
  
  console.log('\n');
  
  // Set new webhook
  const success = await setWebhook(webhookUrl);
  
  if (success) {
    console.log('\n');
    // Show updated webhook info
    await getWebhookInfo();
  }
  
  process.exit(success ? 0 : 1);
}

main().catch(console.error);
