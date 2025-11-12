#!/usr/bin/env tsx

/**
 * Скрипт для тестирования начисления внутреннего баланса
 *
 * Использование:
 *   tsx scripts/test-balance-credit.ts <walletAddress> <amount> [reference]
 *
 * Примеры:
 *   tsx scripts/test-balance-credit.ts 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb 100
 *   tsx scripts/test-balance-credit.ts 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb 50 "Test credit"
 */

import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
const ADMIN_SECRET = process.env.INTERNAL_BALANCE_SIGNING_SECRET;

async function testBalanceCredit(walletAddress: string, amount: string, reference?: string) {
  if (!ADMIN_SECRET) {
    console.error("❌ Ошибка: INTERNAL_BALANCE_SIGNING_SECRET не установлен в .env.local");
    process.exit(1);
  }

  if (!walletAddress || !walletAddress.startsWith("0x")) {
    console.error("❌ Ошибка: Неверный формат адреса кошелька");
    console.log(
      "Использование: tsx scripts/test-balance-credit.ts <walletAddress> <amount> [reference]",
    );
    process.exit(1);
  }

  // Validate address format (0x + 40 hex characters = 42 total)
  if (!/^0x[0-9a-fA-F]{40}$/.test(walletAddress)) {
    console.error("❌ Ошибка: Неверный формат адреса кошелька");
    console.error(`   Адрес должен быть длиной 42 символа (0x + 40 hex символов)`);
    console.error(`   Получено: ${walletAddress.length} символов`);
    console.log(
      "Использование: tsx scripts/test-balance-credit.ts <walletAddress> <amount> [reference]",
    );
    process.exit(1);
  }

  const amountNum = parseFloat(amount);
  if (isNaN(amountNum) || amountNum <= 0) {
    console.error("❌ Ошибка: Неверная сумма");
    process.exit(1);
  }

  console.log("🧪 Тестирование начисления баланса...\n");
  console.log(`📍 URL: ${APP_URL}/api/internal-balance/credit`);
  console.log(`💼 Кошелек: ${walletAddress}`);
  console.log(`💰 Сумма: ${amount}`);
  console.log(`📝 Описание: ${reference || "—"}\n`);

  try {
    const response = await fetch(`${APP_URL}/api/internal-balance/credit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-admin-token": ADMIN_SECRET,
      },
      body: JSON.stringify({
        walletAddress: walletAddress.toLowerCase(),
        amount,
        reference,
        createdBy: "test-script",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Ошибка при начислении баланса:");
      console.error(JSON.stringify(data, null, 2));
      process.exit(1);
    }

    console.log("✅ Баланс успешно начислен!\n");
    console.log("📊 Результат:");
    console.log(`   Кошелек: ${data.balance?.walletAddress || walletAddress}`);
    console.log(`   Токен: ${data.tokenSymbol || "EURC"}`);
    console.log(`   Начислено: ${amount} ${data.tokenSymbol || "EURC"}`);

    const balance = data.balance?.balance || "0";
    const decimals = data.decimals || 18;
    const balanceFormatted = (parseFloat(balance) / Math.pow(10, decimals)).toFixed(2);
    console.log(`   Новый баланс: ${balanceFormatted} ${data.tokenSymbol || "EURC"}`);

    if (data.ledgerEntry) {
      console.log(`   ID операции: ${data.ledgerEntry.id}`);
      console.log(`   Тип: ${data.ledgerEntry.entryType}`);
      console.log(`   Дата: ${new Date(data.ledgerEntry.createdAt).toLocaleString()}`);
    }

    console.log("\n✅ Тест пройден успешно!");
  } catch (error) {
    console.error("❌ Ошибка при выполнении запроса:");
    console.error(error);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log(
    "Использование: tsx scripts/test-balance-credit.ts <walletAddress> <amount> [reference]",
  );
  console.log("\nПримеры:");
  console.log("  tsx scripts/test-balance-credit.ts 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb 100");
  console.log(
    '  tsx scripts/test-balance-credit.ts 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb 50 "Test credit"',
  );
  process.exit(1);
}

const [walletAddress, amount, reference] = args;
testBalanceCredit(walletAddress, amount, reference);
