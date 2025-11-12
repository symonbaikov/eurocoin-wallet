#!/usr/bin/env tsx

/**
 * Скрипт для проверки существования пользователя в базе данных
 */

import { config } from "dotenv";
import { resolve } from "path";
import { query } from "@/lib/database/db";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function checkUser(walletAddress: string) {
  const normalizedAddress = walletAddress.toLowerCase();

  console.log(`🔍 Поиск пользователя с адресом: ${normalizedAddress}\n`);

  try {
    // Проверка в таблице users
    const usersResult = await query(
      "SELECT id, wallet_address, name, email FROM users WHERE LOWER(wallet_address) = $1 LIMIT 1",
      [normalizedAddress],
    );

    if (usersResult.rows.length > 0) {
      console.log("✅ Пользователь найден в таблице users:");
      console.log(JSON.stringify(usersResult.rows[0], null, 2));
      return usersResult.rows[0];
    }

    // Проверка в таблице auth_users (NextAuth)
    const authUsersResult = await query(
      "SELECT id, wallet_address, name, email FROM auth_users WHERE LOWER(wallet_address) = $1 LIMIT 1",
      [normalizedAddress],
    );

    if (authUsersResult.rows.length > 0) {
      console.log("✅ Пользователь найден в таблице auth_users:");
      console.log(JSON.stringify(authUsersResult.rows[0], null, 2));
      return authUsersResult.rows[0];
    }

    console.log("❌ Пользователь не найден ни в одной таблице");
    console.log("\n💡 Рекомендация: Зарегистрируйте пользователя через сайт или API");
    return null;
  } catch (error) {
    console.error("❌ Ошибка при проверке пользователя:");
    console.error(error);
    return null;
  }
}

const walletAddress = process.argv[2] || "0x899cd926a9028afe9056e76cc01f32ee859e7a65";
checkUser(walletAddress)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

