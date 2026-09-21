/**
 * Telegram Bot API client and formatting utilities
 */

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_API_BASE = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export async function sendTelegramMessage(chatId, text, inlineKeyboard = null) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN is not configured.");
    return { ok: false, description: "Missing TELEGRAM_BOT_TOKEN" };
  }

  const payload = {
    chat_id: chatId,
    text,
    parse_mode: "Markdown",
  };

  if (inlineKeyboard && inlineKeyboard.length > 0) {
    payload.reply_markup = {
      inline_keyboard: inlineKeyboard,
    };
  }

  try {
    const res = await fetch(`${TELEGRAM_API_BASE}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error("Error sending Telegram message:", err);
    return { ok: false, error: err.message };
  }
}

export async function answerCallbackQuery(callbackQueryId, text = "") {
  if (!TELEGRAM_BOT_TOKEN) return;

  try {
    await fetch(`${TELEGRAM_API_BASE}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
      }),
    });
  } catch (err) {
    console.warn("Error answering callback query:", err);
  }
}

export async function downloadTelegramFile(fileId) {
  if (!TELEGRAM_BOT_TOKEN || !fileId) return null;

  try {
    // 1. Get file path
    const fileRes = await fetch(`${TELEGRAM_API_BASE}/getFile?file_id=${fileId}`);
    const fileData = await fileRes.json();

    if (!fileData.ok || !fileData.result?.file_path) {
      return null;
    }

    const filePath = fileData.result.file_path;
    const downloadUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

    const res = await fetch(downloadUrl);
    if (!res.ok) return null;

    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (err) {
    console.error("Error downloading Telegram file:", err);
    return null;
  }
}

import { formatCurrency, getCurrencySymbol } from "../currency.js";

export function formatExpenseProposalMessage(proposal, userName, warning = null, currencyCode = "INR") {
  const lines = [];

  if (warning) {
    lines.push(`⚠️ *${warning}*\n`);
  }

  lines.push(`🧾 *Expense Parsed by Settlo AI*`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`📌 *${proposal.description || "Expense"}*`);
  lines.push(`💰 *Total Amount:* ${formatCurrency(proposal.amount || 0, currencyCode)}`);
  if (proposal.category) {
    lines.push(`🏷️ *Category:* ${proposal.category}`);
  }
  lines.push(`💳 *Paid by:* ${proposal.paidByUserName || "You"}`);
  lines.push(``);
  lines.push(`📊 *Split Breakdown:*`);

  (proposal.splits || []).forEach((split) => {
    const isPayer = split.userId === proposal.paidByUserId;
    const name = split.userName || (isPayer ? "You" : "Participant");
    const status = isPayer ? "✅ (Payer)" : "⏳ (Owes)";
    lines.push(`• *${name}:* ${formatCurrency(split.amount || 0, currencyCode)} ${status}`);
  });

  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Click a button below or reply *1* to Confirm, *2* to Cancel.`);

  return lines.join("\n");
}

export function getProposalInlineKeyboard() {
  return [
    [
      { text: "Confirm & Save 💾", callback_data: "confirm_expense" },
      { text: "Cancel ❌", callback_data: "cancel_expense" },
    ],
  ];
}

export function formatBalanceMessage(userName, balances, currencyCode = "INR") {
  const lines = [];
  lines.push(`👋 *Hello, ${userName}!* Here is your Settlo balance:`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);

  const netBalance = balances?.totalBalance || 0;
  if (netBalance > 0) {
    lines.push(`🟢 *Total Balance:* +${formatCurrency(netBalance, currencyCode)} (You are owed money)`);
  } else if (netBalance < 0) {
    lines.push(`🔴 *Total Balance:* -${formatCurrency(Math.abs(netBalance), currencyCode)} (You owe money)`);
  } else {
    lines.push(`⚪ *Total Balance:* ${formatCurrency(0, currencyCode)} (All settled up!)`);
  }

  lines.push(``);
  lines.push(`💵 *You are owed:* ${formatCurrency(balances?.youAreOwed || 0, currencyCode)}`);
  if (balances?.oweDetails?.youAreOwedBy?.length > 0) {
    balances.oweDetails.youAreOwedBy.slice(0, 5).forEach((p) => {
      lines.push(`  • ${p.name}: ${formatCurrency(p.amount, currencyCode)}`);
    });
  }

  lines.push(``);
  lines.push(`💳 *You owe:* ${formatCurrency(balances?.youOwe || 0, currencyCode)}`);
  if (balances?.oweDetails?.youOwe?.length > 0) {
    balances.oweDetails.youOwe.slice(0, 5).forEach((p) => {
      lines.push(`  • ${p.name}: ${formatCurrency(p.amount, currencyCode)}`);
    });
  }

  lines.push(`━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`💡 _Tip: You can text an expense anytime (e.g. "Dinner 450 split with Alex"), send a receipt photo, or record a voice note!_`);

  return lines.join("\n");
}

export function getHelpMessage(userName = "there") {
  return `🤖 *Settlo Telegram Bot Guide*
━━━━━━━━━━━━━━━━━━━━━
Hi ${userName}! Here is what you can do:

1️⃣ *Log an Expense:*
• Text: _"Dinner 60 paid by me split with Alex"_
• Hinglish: _"Bhai CCD pe 450 gaya, maine pay kiya Alex aur mera aadha aadha"_
• 📸 *Receipt Photo:* Send a photo of any receipt
• 🎙️ *Voice Note:* Record and send a voice memo

2️⃣ *Commands:*
• /balance or *hisab*: Check who owes you / who you owe
• *1* or *yes*: Confirm pending expense
• *2* or *cancel*: Discard pending expense
• /unlink: Disconnect your Telegram from Settlo
• /help: Show this guide
━━━━━━━━━━━━━━━━━━━━━`;
}
