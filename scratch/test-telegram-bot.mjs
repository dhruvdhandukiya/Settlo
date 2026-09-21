import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";

// Load environment variables from .env.local
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

const {
  formatExpenseProposalMessage,
  getProposalInlineKeyboard,
  formatBalanceMessage,
  getHelpMessage,
} = await import("../lib/telegram/telegram-client.js");

const { processTelegramUpdate } = await import("../lib/telegram/bot-state-machine.js");

console.log("🚀 Starting Settlo Telegram Bot Test Suite...\n");

let passed = 0;
let failed = 0;

async function runTest(name, fn) {
  process.stdout.write(`• Running: ${name}... `);
  try {
    await fn();
    console.log("✅ PASSED");
    passed++;
  } catch (err) {
    console.log("❌ FAILED");
    console.error("  Error:", err.message);
    failed++;
  }
}

async function main() {
  // Test 1: Proposal Message Formatting
  await runTest("Proposal Message & Inline Keyboard (INR & USD)", async () => {
    const mockProposal = {
      description: "Dinner at Taj",
      amount: 120,
      category: "foodDrink",
      paidByUserName: "Alex",
      paidByUserId: "user_alex_1",
      splits: [
        { userName: "Alex", userId: "user_alex_1", amount: 60, paid: true },
        { userName: "Sam", userId: "user_sam_2", amount: 60, paid: false },
      ],
    };

    // Test default currency (INR ₹)
    const inrMsg = formatExpenseProposalMessage(mockProposal, "Alex", null, "INR");
    assert(inrMsg.includes("Dinner at Taj"), "Must include description");
    assert(inrMsg.includes("₹120.00"), "Must include formatted INR amount");
    assert(inrMsg.includes("Alex"), "Must include payer");

    // Test USD ($)
    const usdMsg = formatExpenseProposalMessage(mockProposal, "Alex", null, "USD");
    assert(usdMsg.includes("$120.00"), "Must include formatted USD amount");

    const keyboard = getProposalInlineKeyboard();
    assert(keyboard.length === 1, "Must have 1 row of buttons");
    assert.strictEqual(keyboard[0][0].callback_data, "confirm_expense");
    assert.strictEqual(keyboard[0][1].callback_data, "cancel_expense");
  });

  // Test 2: Balance Message Formatting
  await runTest("Balance Summary Message (Multi-currency)", async () => {
    const mockBalances = {
      totalBalance: 45.5,
      youAreOwed: 45.5,
      youOwe: 0,
      oweDetails: {
        youAreOwedBy: [{ name: "Sam", amount: 45.5 }],
        youOwe: [],
      },
    };

    // Test INR
    const inrMsg = formatBalanceMessage("Alex", mockBalances, "INR");
    assert(inrMsg.includes("+₹45.50"), "Must format positive INR balance");
    assert(inrMsg.includes("Sam"), "Must list person who owes");

    // Test USD
    const usdMsg = formatBalanceMessage("Alex", mockBalances, "USD");
    assert(usdMsg.includes("+$45.50"), "Must format positive USD balance");
  });

  // Test 3: Help Guide Command
  await runTest("Help Guide Message", async () => {
    const msg = getHelpMessage("Alex");
    assert(msg.includes("Settlo Telegram Bot Guide"), "Must include title");
    assert(msg.includes("/balance"), "Must include /balance command");
    assert(msg.includes("Receipt Photo"), "Must mention receipt photo");
  });

  // Test 4: Unlinked Telegram User Update
  await runTest("Unlinked User /start Handling", async () => {
    // Simulated Telegram update
    const update = {
      update_id: 1001,
      message: {
        chat: { id: 999999999 },
        from: { id: 999999999, first_name: "Alex" },
        text: "Dinner 50",
      },
    };

    // Should process without throwing errors
    await processTelegramUpdate(update);
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
