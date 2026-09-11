import fs from "node:fs";
import path from "node:path";

const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  envContent.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valParts] = trimmed.split("=");
      if (key && valParts.length > 0) {
        process.env[key.trim()] = valParts.join("=").trim();
      }
    }
  });
}

const { processTelegramUpdate } = await import("../lib/telegram/bot-state-machine.js");

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("❌ Error: TELEGRAM_BOT_TOKEN is missing in .env.local");
  console.error("👉 Please add TELEGRAM_BOT_TOKEN=\"...\" to your .env.local file.");
  process.exit(1);
}

console.log("🤖 Starting Settlo Telegram Bot in Local Polling Mode (Zero Tunnels Needed!)...\n");

try {
  await fetch(`https://api.telegram.org/bot${token}/deleteWebhook`);
  console.log("✅ Ready and listening for Telegram messages...\n");
} catch (e) {
  console.warn("Could not clear webhook:", e.message);
}

let offset = 0;

async function pollUpdates() {
  while (true) {
    try {
      const res = await fetch(
        `https://api.telegram.org/bot${token}/getUpdates?offset=${offset}&timeout=20`
      );
      const data = await res.json();

      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          const sender = update.message?.from?.first_name || update.callback_query?.from?.first_name || "User";
          const text = update.message?.text || update.message?.caption || update.callback_query?.data || "[media]";
          console.log(`📩 Received from ${sender}: "${text}"`);
          
          await processTelegramUpdate(update);
        }
      }
    } catch (err) {
      console.error("Polling error:", err.message);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

pollUpdates();
