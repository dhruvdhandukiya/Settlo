import { NextResponse } from "next/server";
import { processTelegramUpdate } from "@/lib/telegram/bot-state-machine.js";

export async function GET() {
  return NextResponse.json({
    status: "active",
    service: "Settlo Telegram Webhook",
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req) {
  try {
    const update = await req.json();

    if (!update) {
      return NextResponse.json({ ok: false, error: "Empty payload" }, { status: 400 });
    }

    // Process update asynchronously or synchronously
    await processTelegramUpdate(update);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Telegram Webhook Route Error:", error);
    return NextResponse.json(
      { ok: false, error: error.message || "Internal server error" },
      { status: 200 } // Telegram requires 200 OK so it doesn't repeatedly retry failed events
    );
  }
}
