#!/usr/bin/env tsx

/**
 * Прямая регистрация пользователя через SQL
 */

import { config } from "dotenv";
import { resolve } from "path";
import { query } from "@/lib/database/db";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function registerUser(walletAddress: string, name: string) {
  const normalizedAddress = walletAddress.toLowerCase();

  console.log(`📝 Регистрация пользователя: ${normalizedAddress}\n`);

  try {
    // Проверка существования
    const existing = await query(
      "SELECT id FROM users WHERE LOWER(wallet_address) = $1 LIMIT 1",
      [normalizedAddress],
    );

    if (existing.rows.length > 0) {
      console.log("✅ Пользователь уже существует:");
      console.log(JSON.stringify(existing.rows[0], null, 2));
      return existing.rows[0];
    }

    // Создание пользователя
    const result = await query(
      `INSERT INTO users (wallet_address, name, auth_type, created_at, updated_at)
       VALUES ($1, $2, 'wallet', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING id, wallet_address, name, email`,
      [normalizedAddress, name],
    );

    console.log("✅ Пользователь успешно зарегистрирован:");
    console.log(JSON.stringify(result.rows[0], null, 2));
    return result.rows[0];
  } catch (error) {
    console.error("❌ Ошибка при регистрации пользователя:");
    console.error(error);
    throw error;
  }
}

const walletAddress = process.argv[2] || "0x899CD926A9028aFE9056e76Cc01f32EE859e7a65";
const name = process.argv[3] || "Test User";

registerUser(walletAddress, name)
  .then(() => {
    console.log("\n✅ Готово!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Ошибка:", error.message);
    process.exit(1);
  });

