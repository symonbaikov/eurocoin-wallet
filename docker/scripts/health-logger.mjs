#!/usr/bin/env node

const [serviceName, url, intervalArg] = process.argv.slice(2);

if (!serviceName || !url) {
  console.error(
    "[health-logger] Usage: node scripts/health-logger.mjs <service-name> <url> [interval-ms]",
  );
  process.exit(1);
}

const intervalMs = Number.parseInt(intervalArg ?? "15000", 10);

if (!Number.isFinite(intervalMs) || intervalMs <= 0) {
  console.error("[health-logger] Interval must be a positive integer in milliseconds.");
  process.exit(1);
}

const log = (message, level = "info") => {
  const timestamp = new Date().toISOString();
  const prefix = `[health][${serviceName}][${level}]`;
  console.log(`${prefix} ${timestamp} ${message}`);
};

async function runCheck() {
  try {
    const response = await fetch(url, { method: "GET" });
    const status = response.status;
    const statusText = response.statusText || "OK";
    const ok = status === 200;

    log(`status=${status} ${statusText}`);

    if (!ok) {
      const bodyText = await response.text();
      log(`non-200 response body: ${bodyText.slice(0, 200)}`, "warn");
    }
  } catch (error) {
    log(`error=${error instanceof Error ? error.message : String(error)}`, "error");
  }
}

void runCheck();
setInterval(() => {
  void runCheck();
}, intervalMs);
