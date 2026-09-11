import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";
import { parseExpenseWithGemini } from "../ai/expense-parser.js";
import { formatCurrency, getCurrencySymbol } from "../currency.js";
import {
  formatExpenseProposalMessage,
  getProposalInlineKeyboard,
  formatBalanceMessage,
  getHelpMessage,
  sendTelegramMessage,
  downloadTelegramFile,
  answerCallbackQuery,
} from "./telegram-client.js";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function processTelegramUpdate(update) {
  // 1. Handle Inline Button Clicks (Callback Query)
  if (update.callback_query) {
    const callback = update.callback_query;
    const chatId = String(callback.message?.chat?.id);
    const action = callback.data;

    await answerCallbackQuery(callback.id);

    if (action === "confirm_expense") {
      return await handleConfirmExpense(chatId);
    } else if (action === "cancel_expense") {
      return await handleCancelExpense(chatId);
    }
  }

  const message = update.message;
  if (!message || !message.chat) {
    return;
  }

  const chatId = String(message.chat.id);
  const username = message.from?.username || message.from?.first_name || "";
  const text = (message.text || message.caption || "").trim();
  const lowerText = text.toLowerCase();

  // 2. Resolve User & Session in Convex
  let userData = null;
  try {
    userData = await convex.query(api.telegram.getUserByTelegramChatId, {
      chatId,
    });
  } catch (err) {
    console.error("Error looking up Telegram user:", err);
  }

  const user = userData?.user;
  const session = userData?.session;

  const startMatch =
    text.match(/^\/start\s+([A-Za-z0-9]+)$/i) ||
    text.match(/^LINK\s+([A-Za-z0-9]+)$/i) ||
    (text.length === 6 && text.match(/^([A-Za-z0-9]{6})$/));

  if (startMatch) {
    const code = startMatch[1].toUpperCase();
    try {
      const linkResult = await convex.mutation(api.telegram.linkTelegramByCode, {
        chatId,
        code,
        username,
      });

      if (linkResult.success) {
        await sendTelegramMessage(
          chatId,
          `🎉 *Welcome ${linkResult.userName}!*
Your Telegram account is now connected to Settlo.

💡 *Try sending an expense right now:*
• _"Dinner with Harsh $60, I paid"_
• _"Bhai CCD pe 450 bill aaya, maine pay kiya Harsh aur mera aadha aadha"_
• 📸 Send a receipt photo
• 🎙️ Record a voice memo

Type /help anytime to see commands.`
        );
        return;
      } else {
        await sendTelegramMessage(
          chatId,
          `❌ ${linkResult.error || "Could not link account. Please click 'Connect on Telegram' in Settlo to generate a fresh link."}`
        );
        return;
      }
    } catch (linkErr) {
      await sendTelegramMessage(
        chatId,
        `❌ Linking failed: ${linkErr.message}. Please generate a new code in Settlo.`
      );
      return;
    }
  }

  if (!user) {
    await sendTelegramMessage(
      chatId,
      `👋 *Hi there! Welcome to Settlo.*

To log expenses directly via Telegram, please connect your account:
1. Open the Settlo app on your browser
2. Click the *Telegram Bot* button in the header
3. Click *Connect on Telegram* (or copy your 6-digit code and send here)`
    );
    return;
  }


  const userCurrency = user?.currency || "INR";

  if (lowerText === "/help" || lowerText === "help" || lowerText === "menu" || lowerText === "?") {
    await sendTelegramMessage(chatId, getHelpMessage(user.name));
    return;
  }

  // B. Unlink Account
  if (lowerText === "/unlink" || lowerText === "unlink") {
    try {
      await convex.mutation(api.telegram.unlinkTelegram, {});
      await sendTelegramMessage(chatId, "✅ Your Telegram account has been disconnected from Settlo.");
    } catch {
      await sendTelegramMessage(chatId, "✅ Telegram connection cleared.");
    }
    return;
  }

  // C. Balance / Hisab Check
  if (
    lowerText === "/balance" ||
    lowerText === "balance" ||
    lowerText === "hisab" ||
    lowerText === "khata"
  ) {
    try {
      const balanceData = await convex.query(api.telegram.getTelegramUserBalances, {
        userId: user.id || user._id,
      });
      const balanceMsg = formatBalanceMessage(user.name, balanceData, userCurrency);
      await sendTelegramMessage(chatId, balanceMsg);
    } catch (balErr) {
      console.error("Balance fetch error:", balErr);
      await sendTelegramMessage(
        chatId,
        `📊 *Settlo Account Balance*
━━━━━━━━━━━━━━━━━━━━━
👤 User: *${user.name}*

View your full balance details and interactive charts on your web dashboard:
👉 ${process.env.NEXT_PUBLIC_APP_URL || "https://settlo.app"}/dashboard`
      );
    }
    return;
  }

  // D. Quick Cancellation (/cancel, cancel, reset, discard, clear)
  if (
    lowerText === "/cancel" ||
    lowerText === "cancel" ||
    lowerText === "reset" ||
    lowerText === "discard" ||
    lowerText === "clear" ||
    (session?.status === "awaiting_confirmation" && (lowerText === "2" || lowerText === "no" || lowerText === "na"))
  ) {
    await handleCancelExpense(chatId);
    return;
  }

  // E. Quick Confirmation (1 / YES / HAAN / CONFIRM / SAVE)
  if (
    session?.status === "awaiting_confirmation" &&
    (lowerText === "1" ||
      lowerText === "yes" ||
      lowerText === "confirm" ||
      lowerText === "haan" ||
      lowerText === "save" ||
      lowerText === "ok")
  ) {
    await handleConfirmExpense(chatId);
    return;
  }

  // 5. Natural Language / Receipt / Audio Parsing via Gemini
  try {
    // Download Media (Photo or Voice Note) if attached
    let imageBuffer = null;
    let audioBuffer = null;
    let audioMimeType = null;

    if (message.photo && message.photo.length > 0) {
      // Pick highest resolution photo (last in array)
      const highestPhoto = message.photo[message.photo.length - 1];
      imageBuffer = await downloadTelegramFile(highestPhoto.file_id);
    } else if (message.voice) {
      audioBuffer = await downloadTelegramFile(message.voice.file_id);
      audioMimeType = message.voice.mime_type || "audio/ogg";
    } else if (message.audio) {
      audioBuffer = await downloadTelegramFile(message.audio.file_id);
      audioMimeType = message.audio.mime_type || "audio/mp3";
    }

    // Fetch user contacts & groups context from Convex via authenticated query
    let contacts = [];
    let groups = [];
    try {
      const contextData = await convex.query(
        api.telegram.getTelegramUserContext,
        {
          userId: user.id || user._id,
        }
      );
      contacts = contextData?.contacts || [];
      groups = contextData?.groups || [];
    } catch (ctxErr) {
      console.warn("Could not fetch contacts for Telegram bot:", ctxErr);
    }

    // Build multi-turn context
    let conversationHistory = Array.isArray(session?.conversationHistory)
      ? [...session.conversationHistory]
      : [];

    let inputPromptText = text;

    // Check if there is a pending receipt in session awaiting split instructions
    const pendingReceipt =
      session?.status === "awaiting_split" ||
      (session?.pendingExpense && session?.pendingExpense?.type === "receipt_analysis")
        ? session.pendingExpense
        : null;

    if (pendingReceipt && !imageBuffer && text) {
      inputPromptText = `Receipt Scanned previously: Merchant "${pendingReceipt.merchantName || "Receipt"}", Total amount ${formatCurrency(pendingReceipt.totalAmount, userCurrency)}, Category: "${pendingReceipt.category || "foodDrink"}".
User's split instruction: "${text}".
Please generate the complete expense proposal.`;

      conversationHistory.push({
        role: "assistant",
        content: `Receipt Scanned: ${pendingReceipt.merchantName || "Receipt"}, Total: ${formatCurrency(pendingReceipt.totalAmount, userCurrency)}. Who should this receipt be split with?`,
      });
      conversationHistory.push({
        role: "user",
        content: text,
      });
    }

    const parsedResult = await parseExpenseWithGemini({
      text: inputPromptText,
      imageBuffer,
      imageMimeType: "image/jpeg",
      audioBuffer,
      audioMimeType: audioMimeType || "audio/ogg",
      currentUser: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
      },
      contacts,
      groups,
      conversationHistory,
    });

    // Case 1: Clarification Needed
    if (parsedResult.type === "clarification_needed") {
      const updatedHistory = [
        ...conversationHistory.slice(-4),
        { role: "user", content: text || "[media]" },
        { role: "assistant", content: parsedResult.question },
      ];

      await convex.mutation(api.telegram.savePendingExpenseSession, {
        chatId,
        status: "awaiting_clarification",
        conversationHistory: updatedHistory,
      });

      await sendTelegramMessage(
        chatId,
        `❓ *Settlo AI Question:*\n${parsedResult.question}\n\n_(Reply with details to continue, or type /cancel)_`
      );
      return;
    }

    // Case 2: Receipt Analysis Output (Waiting for split instructions)
    if (parsedResult.type === "receipt_analysis") {
      const total = parsedResult.totalAmount || 0;
      const merchant = parsedResult.merchantName || "Receipt";
      const itemsCount = parsedResult.lineItems?.length || 0;

      const receiptHistory = [
        {
          role: "assistant",
          content: `Receipt Scanned: ${merchant}, Total: ${formatCurrency(total, userCurrency)} (${itemsCount} items).`,
        },
      ];

      await convex.mutation(api.telegram.savePendingExpenseSession, {
        chatId,
        pendingExpense: parsedResult,
        status: "awaiting_split",
        conversationHistory: receiptHistory,
      });

      await sendTelegramMessage(
        chatId,
        `📸 *Receipt Scanned: ${merchant}*\n💰 *Total:* ${formatCurrency(total, userCurrency)} (${itemsCount} items)\n\nWho should this receipt be split with?\n_(e.g., reply "Split equally with Harsh", "50-50 with Dhruv")_`
      );
      return;
    }

    // Case 3: Complete Expense Proposal Ready for Confirmation
    if (parsedResult.type === "expense_proposal") {
      // Auto-resolve or create contact users if any participant IDs are missing
      const rawParticipantNames = (parsedResult.splits || []).map((s) => s.userId || s.name || "");
      if (rawParticipantNames.length > 0) {
        try {
          const resolvedUsers = await convex.mutation(
            api.telegram.resolveOrCreateParticipants,
            {
              participants: rawParticipantNames,
              currentUserId: user.id || user._id,
            }
          );

          // Update splits with authentic IDs
          parsedResult.splits = (parsedResult.splits || []).map((s, idx) => {
            const match = resolvedUsers[idx] || resolvedUsers.find(
              (ru) => ru.name.toLowerCase() === (s.name || s.userId || "").toLowerCase()
            );
            return {
              ...s,
              userId: match ? match.id : s.userId,
              userName: match ? match.name : s.name || "Participant",
            };
          });
        } catch (resolveErr) {
          console.warn("Participant resolve error:", resolveErr);
        }
      }

      // Cross-channel Deduplication check
      let warning = null;
      try {
        const dupCheck = await convex.query(
          api.telegram.checkRecentDuplicateExpense,
          {
            userId: user.id || user._id,
            amount: parsedResult.amount,
            description: parsedResult.description,
            windowMinutes: 10,
          }
        );
        if (dupCheck?.isDuplicate) {
          warning = `Notice: A similar expense ("${dupCheck.existingExpense.description}" for ${formatCurrency(dupCheck.existingExpense.amount, userCurrency)}) was recorded a few minutes ago.`;
        }
      } catch (dupErr) {
        console.warn("Dedup check error:", dupErr);
      }

      // Enrich split user names for display
      const allKnown = [
        { id: user.id || user._id, name: `${user.name} (You)` },
        ...contacts,
      ];

      const payerObj = allKnown.find((u) => (u.id || u._id) === parsedResult.paidByUserId);
      parsedResult.paidByUserName = payerObj ? payerObj.name : "You";

      parsedResult.splits = (parsedResult.splits || []).map((s) => {
        const participantObj = allKnown.find(
          (u) => (u.id || u._id) === s.userId
        );
        return {
          ...s,
          userName: participantObj ? participantObj.name : s.userName || "Participant",
        };
      });

      // Save proposal in session and mark awaiting confirmation
      await convex.mutation(api.telegram.savePendingExpenseSession, {
        chatId,
        pendingExpense: parsedResult,
        status: "awaiting_confirmation",
        conversationHistory: [],
      });

      const messageText = formatExpenseProposalMessage(parsedResult, user.name, warning, userCurrency);
      const keyboard = getProposalInlineKeyboard();

      await sendTelegramMessage(chatId, messageText, keyboard);
      return;
    }

    await sendTelegramMessage(
      chatId,
      "Could not understand expense. Please try phrasing like: 'Dinner with Harsh $50, I paid' or send a receipt photo."
    );
  } catch (err) {
    console.error("Telegram parsing error:", err);
    await sendTelegramMessage(
      chatId,
      `❌ AI parsing error: ${err.message || "Unknown error"}. You can enter expenses manually at ${process.env.NEXT_PUBLIC_APP_URL || "https://settlo.app"}/expenses/new`
    );
  }
}

async function handleConfirmExpense(chatId) {
  let userData = null;
  try {
    userData = await convex.query(api.telegram.getUserByTelegramChatId, {
      chatId,
    });
  } catch (err) {
    console.error("Lookup error:", err);
  }

  const user = userData?.user;
  const session = userData?.session;

  if (session?.status === "awaiting_confirmation" && session?.pendingExpense) {
    try {
      const pending = session.pendingExpense;

      await convex.mutation(api.telegram.createExpenseFromTelegram, {
        chatId,
        userId: user.id || user._id,
        expense: {
          description: pending.description || "Expense",
          amount: pending.amount,
          category: pending.category || "other",
          date: pending.date || Date.now(),
          paidByUserId: pending.paidByUserId,
          splitType: pending.splitType || "equal",
          splits: pending.splits.map((s) => ({
            userId: s.userId,
            amount: s.amount,
            paid: s.paid || s.userId === pending.paidByUserId,
          })),
          groupId: pending.groupId || undefined,
        },
      });

      const userCurrency = user?.currency || "INR";
      await sendTelegramMessage(
        chatId,
        `🎉 *Expense Saved Successfully!*
━━━━━━━━━━━━━━━━━━━━━
📌 *${pending.description}* (${formatCurrency(pending.amount, userCurrency)}) has been recorded and balances updated in real time.

📊 View on dashboard: ${process.env.NEXT_PUBLIC_APP_URL || "https://settlo.app"}/dashboard`
      );
    } catch (saveErr) {
      await sendTelegramMessage(
        chatId,
        `❌ Error saving expense: ${saveErr.message}.`
      );
    }
  } else {
    await sendTelegramMessage(
      chatId,
      "ℹ️ No pending expense proposal to confirm. Send a message like: 'Dinner with Harsh $60, I paid' to create one!"
    );
  }
}

async function handleCancelExpense(chatId) {
  try {
    await convex.mutation(api.telegram.clearPendingExpenseSession, {
      chatId,
    });
  } catch (err) {
    console.error("Error clearing pending session:", err);
  }

  await sendTelegramMessage(
    chatId,
    "❌ Current expense proposal or conversation cancelled. What would you like to log next?"
  );
}
