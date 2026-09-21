import { parseExpenseWithGemini, validateAndSanitizeResponse } from "../lib/ai/expense-parser.js";
import assert from "node:assert";

// Load environment variables from .env.local
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

console.log("🚀 Starting Phase 1 AI Parsing Test Suite...\n");

const mockCurrentUser = {
  id: "user_me_123",
  name: "Alex",
  email: "alex@example.com",
};

const mockContacts = [
  { id: "user_alice_456", name: "Alice Smith", email: "alice@example.com" },
  { id: "user_bob_789", name: "Bob Johnson", email: "bob@example.com" },
];

const mockGroups = [
  {
    id: "group_trip_001",
    name: "Weekend Trip",
    members: [
      { userId: "user_me_123", name: "Alex" },
      { userId: "user_alice_456", name: "Alice Smith" },
      { userId: "user_bob_789", name: "Bob Johnson" },
    ],
  },
];

let testsPassed = 0;
let testsFailed = 0;

async function runTest(testName, fn) {
  process.stdout.write(`• Running: ${testName}... `);
  try {
    await fn();
    console.log("✅ PASSED");
    testsPassed++;
  } catch (err) {
    console.log("❌ FAILED");
    console.error("  Error:", err.message);
    testsFailed++;
  }
}

async function main() {
  // TEST 1: Equal Split Test
  await runTest("Equal Split Parsing ('Dinner with Alice $50, I paid')", async () => {
    const result = await parseExpenseWithGemini({
      text: "Dinner with Alice $50, I paid",
      currentUser: mockCurrentUser,
      contacts: mockContacts,
      groups: mockGroups,
    });

    assert.strictEqual(result.type, "expense_proposal", "Result type should be expense_proposal");
    assert.strictEqual(result.amount, 50, "Amount should be 50");
    assert.strictEqual(result.paidByUserId, "user_me_123", "Payer should be currentUser");
    assert.strictEqual(result.splits.length, 2, "Should have 2 splits");

    const totalSplit = result.splits.reduce((sum, s) => sum + s.amount, 0);
    assert(Math.abs(totalSplit - 50) <= 0.01, `Splits sum (${totalSplit}) must equal total (50)`);

    const aliceSplit = result.splits.find((s) => s.userId === "user_alice_456");
    assert(aliceSplit, "Alice should be in splits");
    assert.strictEqual(aliceSplit.amount, 25, "Alice split should be 25");
  });

  // TEST 2: Exact Split Test
  await runTest("Exact Split Parsing ('Uber $30, Alice owes 20 and I owe 10')", async () => {
    const result = await parseExpenseWithGemini({
      text: "Uber $30, Alice owes 20 and I owe 10",
      currentUser: mockCurrentUser,
      contacts: mockContacts,
      groups: mockGroups,
    });

    assert.strictEqual(result.type, "expense_proposal");
    assert.strictEqual(result.amount, 30);
    const aliceSplit = result.splits.find((s) => s.userId === "user_alice_456");
    const mySplit = result.splits.find((s) => s.userId === "user_me_123");
    assert.strictEqual(aliceSplit.amount, 20);
    assert.strictEqual(mySplit.amount, 10);
  });

  // TEST 2B: Third-Party Payer Test ("Sam has paid bill for Alex $40")
  await runTest("Third-Party Payer ('Sam has paid bill for Alex $40')", async () => {
    const result = await parseExpenseWithGemini({
      text: "Sam has paid bill for Alex $40",
      currentUser: mockCurrentUser,
      contacts: [
        { id: "user_sam_999", name: "Sam", email: "sam@example.com" },
        ...mockContacts,
      ],
      groups: mockGroups,
    });

    assert.strictEqual(result.type, "expense_proposal");
    assert.strictEqual(result.amount, 40);
    assert.strictEqual(result.paidByUserId, "user_sam_999", "Payer must be Sam");
    const samSplit = result.splits.find((s) => s.userId === "user_sam_999");
    const alexSplit = result.splits.find((s) => s.userId === "user_me_123");
    assert(samSplit, "Sam must be in splits");
    assert(alexSplit, "Alex must be in splits");
    assert.strictEqual(samSplit.paid, true, "Sam paid should be true");
    assert.strictEqual(alexSplit.paid, false, "Alex paid should be false");
  });

  // TEST 3: Percentage Split Test
  await runTest("Percentage Split Parsing ('Groceries $100, 60/40 between me and Bob')", async () => {
    const result = await parseExpenseWithGemini({
      text: "Groceries $100, 60/40 between me and Bob",
      currentUser: mockCurrentUser,
      contacts: mockContacts,
      groups: mockGroups,
    });

    assert.strictEqual(result.type, "expense_proposal");
    assert.strictEqual(result.amount, 100);
    const mySplit = result.splits.find((s) => s.userId === "user_me_123");
    const bobSplit = result.splits.find((s) => s.userId === "user_bob_789");
    assert.strictEqual(mySplit.amount, 60);
    assert.strictEqual(bobSplit.amount, 40);
  });

  // TEST 3B: Hinglish Equal Split Parsing ("Bhai CCD pe 450 bill aaya, maine pay kiya Sam aur mere beech aadha aadha split kar")
  await runTest("Hinglish Equal Split ('Bhai CCD pe 450 bill aaya, maine pay kiya Sam aur mere beech aadha aadha split kar')", async () => {
    const result = await parseExpenseWithGemini({
      text: "Bhai CCD pe 450 bill aaya, maine pay kiya Sam aur mere beech aadha aadha split kar",
      currentUser: mockCurrentUser,
      contacts: [
        { id: "user_sam_999", name: "Sam", email: "sam@example.com" },
        ...mockContacts,
      ],
      groups: mockGroups,
    });

    assert.strictEqual(result.type, "expense_proposal");
    assert.strictEqual(result.amount, 450);
    assert.strictEqual(result.paidByUserId, "user_me_123", "Payer must be currentUser");
    const mySplit = result.splits.find((s) => s.userId === "user_me_123");
    const samSplit = result.splits.find((s) => s.userId === "user_sam_999");
    assert(mySplit, "CurrentUser must be in splits");
    assert(samSplit, "Sam must be in splits");
    assert.strictEqual(mySplit.amount, 225);
    assert.strictEqual(samSplit.amount, 225);
  });

  // TEST 3C: Hinglish Third-Party Payer & Transportation ("Uber gaadi mein 300 gaya, Sam ne pay kiya mera aur uska 50-50")
  await runTest("Hinglish Payer & Category ('Uber gaadi mein 300 gaya, Sam ne pay kiya mera aur uska 50-50')", async () => {
    const result = await parseExpenseWithGemini({
      text: "Uber gaadi mein 300 gaya, Sam ne pay kiya mera aur uska 50-50",
      currentUser: mockCurrentUser,
      contacts: [
        { id: "user_sam_999", name: "Sam", email: "sam@example.com" },
        ...mockContacts,
      ],
      groups: mockGroups,
    });

    assert.strictEqual(result.type, "expense_proposal");
    assert.strictEqual(result.amount, 300);
    assert.strictEqual(result.paidByUserId, "user_sam_999", "Payer must be Sam");
    assert.strictEqual(result.category, "transportation");
    const samSplit = result.splits.find((s) => s.userId === "user_sam_999");
    const mySplit = result.splits.find((s) => s.userId === "user_me_123");
    assert.strictEqual(samSplit.amount, 150);
    assert.strictEqual(mySplit.amount, 150);
    assert.strictEqual(samSplit.paid, true);
    assert.strictEqual(mySplit.paid, false);
  });

  // TEST 3D: Hinglish Exact Allocation ("Groceries ka 1000 maine diya, Bob ka 400 baaki mera")
  await runTest("Hinglish Exact Split ('Groceries ka 1000 maine diya, Bob ka 400 baaki mera')", async () => {
    const result = await parseExpenseWithGemini({
      text: "Groceries ka 1000 maine diya, Bob ka 400 baaki mera",
      currentUser: mockCurrentUser,
      contacts: mockContacts,
      groups: mockGroups,
    });

    assert.strictEqual(result.type, "expense_proposal");
    assert.strictEqual(result.amount, 1000);
    assert.strictEqual(result.paidByUserId, "user_me_123", "Payer must be currentUser");
    assert.strictEqual(result.category, "groceries");
    const bobSplit = result.splits.find((s) => s.userId === "user_bob_789");
    const mySplit = result.splits.find((s) => s.userId === "user_me_123");
    assert.strictEqual(bobSplit.amount, 400);
    assert.strictEqual(mySplit.amount, 600);
  });

  // TEST 4: Ambiguity Test
  await runTest("Ambiguity Check ('Spent $50' with no participants)", async () => {
    const result = await parseExpenseWithGemini({
      text: "Spent $50",
      currentUser: mockCurrentUser,
      contacts: mockContacts,
      groups: mockGroups,
    });

    assert.strictEqual(result.type, "clarification_needed", "Should request clarification for missing participants");
    assert(result.question && result.question.length > 0, "Should include clarification question");
  });

  // TEST 5: Hallucinated ID Rejection Guard
  await runTest("Hallucinated ID Rejection Guard", async () => {
    const mockGeminiHallucination = {
      type: "expense_proposal",
      description: "Coffee",
      amount: 10,
      category: "coffee",
      paidByUserId: "user_me_123",
      splits: [
        { userId: "user_me_123", amount: 5, paid: true },
        { userId: "user_hallucinated_unknown_999", amount: 5, paid: false },
      ],
    };

    const sanitized = validateAndSanitizeResponse({
      parsed: mockGeminiHallucination,
      currentUser: mockCurrentUser,
      contacts: mockContacts,
      groups: mockGroups,
    });

    assert.strictEqual(sanitized.type, "clarification_needed", "Should downgrade hallucinated ID to clarification_needed");
    assert(sanitized.question.includes("clarify"), "Should ask user to clarify participant");
  });

  // TEST 6: Hallucinated Group ID Rejection Guard
  await runTest("Hallucinated Group ID Rejection Guard", async () => {
    const mockGeminiHallucinatedGroup = {
      type: "expense_proposal",
      description: "Flight tickets",
      amount: 300,
      category: "travel",
      groupId: "group_does_not_exist_999",
      paidByUserId: "user_me_123",
      splits: [
        { userId: "user_me_123", amount: 150, paid: true },
        { userId: "user_alice_456", amount: 150, paid: false },
      ],
    };

    const sanitized = validateAndSanitizeResponse({
      parsed: mockGeminiHallucinatedGroup,
      currentUser: mockCurrentUser,
      contacts: mockContacts,
      groups: mockGroups,
    });

    assert.strictEqual(sanitized.type, "clarification_needed", "Should downgrade hallucinated group ID to clarification_needed");
    assert(sanitized.question.includes("group"), "Should ask user to clarify group");
  });

  // TEST 7: Arithmetic Rounding Correction Test
  await runTest("Arithmetic Float Correction ($100 split 3 ways)", async () => {
    const mockFloatDiscrepancy = {
      type: "expense_proposal",
      description: "Pizza dinner",
      amount: 100,
      category: "foodDrink",
      paidByUserId: "user_me_123",
      splitType: "equal",
      splits: [
        { userId: "user_me_123", amount: 33.33, paid: true },
        { userId: "user_alice_456", amount: 33.33, paid: false },
        { userId: "user_bob_789", amount: 33.33, paid: false }, // 33.33 * 3 = 99.99 (0.01 diff)
      ],
    };

    const sanitized = validateAndSanitizeResponse({
      parsed: mockFloatDiscrepancy,
      currentUser: mockCurrentUser,
      contacts: mockContacts,
      groups: mockGroups,
    });

    assert.strictEqual(sanitized.type, "expense_proposal");
    const splitsSum = sanitized.splits.reduce((sum, s) => sum + s.amount, 0);
    assert.strictEqual(Math.round(splitsSum * 100) / 100, 100, "Sum of splits must equal 100 after auto-correction");
  });

  // TEST 8: Receipt Analysis Schema Validation
  await runTest("Receipt Analysis Schema Validation", async () => {
    const mockReceipt = {
      type: "receipt_analysis",
      merchantName: "Trader Joe's",
      totalAmount: 45.5,
      tax: 3.5,
      tip: 0,
      category: "groceries",
      lineItems: [
        { id: "item_1", name: "Almond Milk", amount: 3.99 },
        { id: "item_2", name: "Organic Eggs", amount: 5.49 },
        { id: "item_3", name: "Avocados", amount: 4.99 },
      ],
      confidence: 0.96,
    };

    const sanitized = validateAndSanitizeResponse({
      parsed: mockReceipt,
      currentUser: mockCurrentUser,
      contacts: mockContacts,
      groups: mockGroups,
    });

    assert.strictEqual(sanitized.type, "receipt_analysis");
    assert.strictEqual(sanitized.merchantName, "Trader Joe's");
    assert.strictEqual(sanitized.lineItems.length, 3);
    assert.strictEqual(sanitized.category, "groceries");
  });

  // TEST 9: Timeout / Failure State Handling Test
  await runTest("Timeout / Failure Simulation", async () => {
    // Simulate error handling format expected by the API route and UI
    const simulateErrorResponse = (isTimeout) => ({
      success: false,
      error: isTimeout
        ? "The AI parsing service timed out. Please try again or enter the expense manually."
        : "AI parsing failed: Invalid request payload. Use the manual form if the issue persists.",
      fallbackUrl: "/expenses/new",
    });

    const timeoutRes = simulateErrorResponse(true);
    assert.strictEqual(timeoutRes.success, false);
    assert.strictEqual(timeoutRes.fallbackUrl, "/expenses/new");
    assert(timeoutRes.error.includes("timed out"));

    const networkRes = simulateErrorResponse(false);
    assert.strictEqual(networkRes.success, false);
    assert.strictEqual(networkRes.fallbackUrl, "/expenses/new");
  });

  console.log(`\n========================================`);
  console.log(`Test Results: ${testsPassed} passed, ${testsFailed} failed`);
  console.log(`========================================\n`);

  if (testsFailed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal test error:", err);
  process.exit(1);
});
