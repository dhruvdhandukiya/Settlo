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

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
  console.error("❌ Error: TELEGRAM_BOT_TOKEN is missing in .env.local");
  process.exit(1);
}

const targetUrl =
  process.argv[2] ||
  process.env.NEXT_PUBLIC_APP_URL ||
  "https://settlo-app.vercel.app";

const webhookUrl = `${targetUrl.replace(/\/+$/, "")}/api/telegram/webhook`;

console.log(`🔗 Setting Telegram Webhook to: ${webhookUrl}...`);

try {
  const res = await fetch(
    `https://api.telegram.org/bot${token}/setWebhook?url=${encodeURIComponent(
      webhookUrl
    )}`
  );
  const data = await res.json();
  if (data.ok) {
    console.log("✅ Webhook registered successfully with Telegram!");
  } else {
    console.error("❌ Failed to set webhook:", data.description);
  }

  const infoRes = await fetch(
    `https://api.telegram.org/bot${token}/getWebhookInfo`
  );
  const info = await infoRes.json();
  console.log("ℹ️ Current Webhook Info:", info.result);
} catch (err) {
  console.error("❌ Error setting webhook:", err.message);
}
