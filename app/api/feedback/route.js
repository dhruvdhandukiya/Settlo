import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api.js";
import { sendTelegramMessage } from "@/lib/telegram/telegram-client.js";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function POST(req) {
  try {
    const body = await req.json();
    const { name, contact, message } = body || {};

    if (!name || !contact || !message) {
      return NextResponse.json(
        { success: false, error: "Name, contact details, and message are required." },
        { status: 400 }
      );
    }

    // 1. Save to Convex Database
    let feedbackId = null;
    try {
      feedbackId = await convex.mutation(api.feedback.submitFeedback, {
        name: name.trim(),
        contact: contact.trim(),
        message: message.trim(),
      });
    } catch (dbErr) {
      console.error("Failed to save feedback to Convex:", dbErr);
    }

    // 2. Notify Owner via Telegram Bot if available
    const ownerChatId = process.env.OWNER_TELEGRAM_CHAT_ID;
    if (ownerChatId) {
      const tgText = `📬 *New Feedback / Inquiry on Settlo!*\n\n` +
        `👤 *Name:* ${name.trim()}\n` +
        `📞 *Contact:* ${contact.trim()}\n` +
        `💬 *Message:*\n${message.trim()}\n\n` +
        `⏱️ *Time:* ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })}`;

      try {
        await sendTelegramMessage(ownerChatId, tgText);
      } catch (tgErr) {
        console.warn("Could not send Telegram notification to owner:", tgErr);
      }
    }

    return NextResponse.json({
      success: true,
      feedbackId,
      message: "Your message has been sent to the team!",
    });
  } catch (error) {
    console.error("Feedback Route Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to submit feedback." },
      { status: 500 }
    );
  }
}
