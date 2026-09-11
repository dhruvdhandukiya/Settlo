import { GoogleGenerativeAI } from "@google/generative-ai";
import { EXPENSE_CATEGORIES } from "../expense-categories.js";

const VALID_CATEGORIES = Object.keys(EXPENSE_CATEGORIES);

const CANDIDATE_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.6-flash",
];

/**
 * Call Gemini with candidate model fallback and retry
 */
async function generateWithFallback(promptParts) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in environment variables");
  }
  const genAI = new GoogleGenerativeAI(apiKey);

  let lastError = null;

  for (const modelName of CANDIDATE_MODELS) {
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        });
        const response = await model.generateContent(promptParts);
        return response.response.text();
      } catch (err) {
        lastError = err;
        const msg = err.message || "";
        if (msg.includes("404") || msg.includes("not found") || msg.includes("no longer available")) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
      }
    }
  }

  throw lastError || new Error("All Gemini models failed to respond");
}

/**
 * Main parser function: processes natural language text and/or receipt image with user context
 */
export async function parseExpenseWithGemini({
  text = "",
  imageBuffer = null,
  imageMimeType = "image/jpeg",
  currentUser,
  contacts = [],
  groups = [],
  conversationHistory = [],
}) {
  if (!currentUser || !currentUser.id) {
    throw new Error("Valid authenticated currentUser context is required");
  }

  // Prepare safe context representation for the prompt
  const contactsContext = contacts.map((c) => ({
    userId: c.id,
    name: c.name,
    email: c.email,
  }));

  const groupsContext = groups.map((g) => ({
    groupId: g.id,
    name: g.name,
    memberUserIds: (g.members || []).map((m) => m.userId || m.id),
  }));

  const systemInstruction = `
You are an expert AI expense parsing agent for Settlo, an expense-sharing application.
Your role is to analyze natural language expense descriptions and/or receipt photos and produce a clean, structured JSON output.

CURRENT AUTHENTICATED USER:
- User ID: "${currentUser.id}"
- Name: "${currentUser.name || "User"}"
- Email: "${currentUser.email || ""}"
- Today's Date & Timestamp: ${Date.now()} (${new Date().toDateString()})
Whenever "I", "me", "myself", "my" or the creator is mentioned without a specific name, map it to User ID: "${currentUser.id}".

USER'S KNOWN CONTACTS & REGISTERED USERS:
${JSON.stringify(contactsContext, null, 2)}

USER'S GROUPS:
${JSON.stringify(groupsContext, null, 2)}

ALLOWED CATEGORIES (must be one of these exact keys):
${JSON.stringify(VALID_CATEGORIES)}

PRIOR CONVERSATION / CLARIFICATION HISTORY:
${JSON.stringify(conversationHistory, null, 2)}

RULES & BEHAVIOR:
1. WHO PAID (PAYER DETECTION):
   - If text mentions someone else paid (e.g. "Harsh has paid bill for Dhruv", "Harsh paid $50", "Alice paid for dinner"):
     * Set "paidByUserId" to that person's userId (e.g., Harsh's userId).
     * In "splits", include both the payer and the person(s) who were covered or shared the expense (e.g., Harsh and Dhruv).
     * Set "paid: true" for the payer, and "paid: false" for all other participants who owe money.
   - If text says "I paid", "paid by me", or no other payer is named, "paidByUserId" is "${currentUser.id}".
2. MATCHING PARTICIPANTS:
   - Match participant names flexibly (case-insensitive, first name or full name) against the CONTACTS list and CURRENT USER.
3. DEFAULT GROUP BEHAVIOR: If an expense involves a contact and no group is specified (e.g. "Dinner with Alice $50"), treat it as a 1-on-1 personal expense (groupId: null).
4. RECEIPT PHOTO HANDLING:
   - If an image/photo of a receipt is provided, return Type 2 ("receipt_analysis") extracting merchant, line items, total, tax, tip.
   - If user provided notes (e.g. "Harsh paid for Dhruv"), also identify "suggestedPayerUserId" and "suggestedParticipantUserIds".
5. AMOUNT EXTRACTION:
   - Always extract the numeric value from text like "$45", "45 dollars", "bill of $45", "spent 45", etc., and set "amount": 45.0.
   - When an amount and participant(s) are given in the text, you MUST return Type 1 ("expense_proposal"). NEVER return "clarification_needed" for amount if any number is in the user's input.
6. DATE HANDLING:
   - Use current timestamp (${Date.now()}) unless a specific relative date ("yesterday", "last Friday") or explicit date is mentioned in the text.
7. AMBIGUITY: Only return Type 3 ("clarification_needed") if participants are completely missing or no amount can be found anywhere in the text or receipt.
8. ARITHMETIC: In Type 1 ("expense_proposal"), splits must sum up exactly to the total amount.

JSON RESPONSE SCHEMAS:

Type 1 - Expense Proposal:
{
  "type": "expense_proposal",
  "description": "Lunch with Harsh",
  "amount": 50.0,
  "category": "foodDrink",
  "date": ${Date.now()},
  "paidByUserId": "user_id_of_payer",
  "groupId": null,
  "splitType": "equal",
  "splits": [
    { "userId": "user_id_of_payer", "amount": 25.0, "paid": true },
    { "userId": "user_id_of_participant", "amount": 25.0, "paid": false }
  ],
  "reasoning": "Harsh paid $50 for dinner with Dhruv, split equally ($25 each)",
  "confidence": 0.95
}

Type 2 - Receipt Analysis:
{
  "type": "receipt_analysis",
  "merchantName": "Restaurant Name",
  "date": ${Date.now()},
  "totalAmount": 48.50,
  "tax": 3.50,
  "tip": 5.00,
  "category": "foodDrink",
  "suggestedPayerUserId": "user_id_if_specified_in_notes_or_null",
  "suggestedParticipantUserIds": ["user_id_1", "user_id_2"],
  "lineItems": [
    { "id": "item_1", "name": "Pasta Carbonara", "amount": 22.00 },
    { "id": "item_2", "name": "Caesar Salad", "amount": 14.00 },
    { "id": "item_3", "name": "Drinks", "amount": 4.00 }
  ],
  "confidence": 0.9
}

Type 3 - Clarification Needed:
{
  "type": "clarification_needed",
  "question": "Who was this expense shared with?",
  "missingFields": ["participants"],
  "partialProposal": {
    "description": "Lunch",
    "amount": 50.0,
    "category": "foodDrink"
  }
}

Return ONLY valid JSON matching one of the 3 schemas above.
`.trim();

  // Assemble prompt content parts
  const promptParts = [];
  promptParts.push(systemInstruction);

  if (text && text.trim()) {
    promptParts.push(`USER REQUEST / INPUT TEXT:\n"${text.trim()}"`);
  }

  if (imageBuffer) {
    promptParts.push({
      inlineData: {
        data: Buffer.from(imageBuffer).toString("base64"),
        mimeType: imageMimeType || "image/jpeg",
      },
    });
    promptParts.push(
      "Please analyze this receipt photo. Extract line items, total, taxes, tips, merchant, and suggest category and participants if mentioned."
    );
  }

  // Call Gemini with fallback
  const responseText = await generateWithFallback(promptParts);

  let parsed;
  try {
    parsed = JSON.parse(responseText);
  } catch (err) {
    const match = responseText.match(/\{[\s\S]*\}/);
    if (match) {
      parsed = JSON.parse(match[0]);
    } else {
      throw new Error("Gemini returned non-JSON output: " + responseText);
    }
  }

  // Server-side Context & ID Validation Guard
  return validateAndSanitizeResponse({
    parsed,
    currentUser,
    contacts,
    groups,
  });
}

/**
 * Validate and sanitize Gemini output against real database IDs and arithmetic checks
 */
export function validateAndSanitizeResponse({
  parsed,
  currentUser,
  contacts = [],
  groups = [],
}) {
  if (!parsed || typeof parsed !== "object") {
    return {
      type: "clarification_needed",
      question: "Could not understand the expense details. Could you rephrase?",
      missingFields: ["all"],
    };
  }

  // Collect all known authentic users (currentUser + contacts + group members)
  const allKnownUsers = [
    {
      id: currentUser.id,
      name: currentUser.name || "You",
      email: currentUser.email || "",
    },
    ...contacts.map((c) => ({
      id: c.id || c.userId,
      name: c.name || "",
      email: c.email || "",
    })),
  ];

  groups.forEach((g) => {
    (g.members || []).forEach((m) => {
      if (m.userId || m.id) {
        allKnownUsers.push({
          id: m.userId || m.id,
          name: m.name || "",
          email: m.email || "",
        });
      }
    });
  });

  // Helper to resolve user by ID, Name, or Email
  const resolveUser = (rawVal) => {
    if (!rawVal) return null;
    const rawStr = String(rawVal).trim();

    // 1. Direct ID match
    const exactId = allKnownUsers.find((u) => u.id === rawStr);
    if (exactId) return exactId;

    // 2. Name match (case-insensitive)
    const valLower = rawStr.toLowerCase();
    const nameMatch = allKnownUsers.find((u) => {
      const uName = (u.name || "").toLowerCase();
      const uFirst = uName.split(" ")[0];
      const uEmail = (u.email || "").toLowerCase();
      return (
        uName === valLower ||
        uFirst === valLower ||
        valLower.includes(uFirst) ||
        uEmail.includes(valLower)
      );
    });

    return nameMatch || null;
  };

  // Handle clarification_needed
  if (parsed.type === "clarification_needed") {
    return {
      type: "clarification_needed",
      question: parsed.question || "Could you provide more details about this expense?",
      missingFields: Array.isArray(parsed.missingFields) ? parsed.missingFields : [],
      partialProposal: parsed.partialProposal || null,
    };
  }

  // Handle receipt_analysis
  if (parsed.type === "receipt_analysis") {
    const lineItems = Array.isArray(parsed.lineItems)
      ? parsed.lineItems.map((item, idx) => ({
          id: item.id || `item_${idx + 1}`,
          name: item.name || `Item ${idx + 1}`,
          amount: typeof item.amount === "number" ? Math.abs(item.amount) : 0,
        }))
      : [];

    const totalAmount =
      typeof parsed.totalAmount === "number"
        ? Math.abs(parsed.totalAmount)
        : lineItems.reduce((acc, it) => acc + it.amount, 0);

    const category = VALID_CATEGORIES.includes(parsed.category)
      ? parsed.category
      : "foodDrink";

    // Resolve suggested payer and participants if present
    const resolvedSuggestedPayer = parsed.suggestedPayerUserId
      ? resolveUser(parsed.suggestedPayerUserId)?.id
      : null;

    const resolvedSuggestedParticipants = Array.isArray(
      parsed.suggestedParticipantUserIds
    )
      ? parsed.suggestedParticipantUserIds
          .map((p) => resolveUser(p)?.id)
          .filter(Boolean)
      : [];

    return {
      type: "receipt_analysis",
      merchantName: parsed.merchantName || "Receipt",
      date: typeof parsed.date === "number" ? parsed.date : Date.now(),
      totalAmount: Math.round(totalAmount * 100) / 100,
      tax: typeof parsed.tax === "number" ? Math.abs(parsed.tax) : 0,
      tip: typeof parsed.tip === "number" ? Math.abs(parsed.tip) : 0,
      category,
      suggestedPayerUserId: resolvedSuggestedPayer,
      suggestedParticipantUserIds: resolvedSuggestedParticipants,
      lineItems,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.9,
    };
  }

  // Handle expense_proposal
  if (parsed.type === "expense_proposal" || parsed.amount !== undefined) {
    const validGroupIds = new Set(groups.map((g) => g.id || g.groupId));

    // Validate groupId
    let validatedGroupId = null;
    if (parsed.groupId) {
      if (validGroupIds.has(parsed.groupId)) {
        validatedGroupId = parsed.groupId;
      } else {
        return {
          type: "clarification_needed",
          question: `Which group was this expense for? We couldn't find a group matching "${parsed.groupId}".`,
          missingFields: ["groupId"],
          partialProposal: {
            description: parsed.description,
            amount: parsed.amount,
          },
        };
      }
    }

    // Resolve and validate paidByUserId
    let validatedPaidBy = currentUser.id;
    if (parsed.paidByUserId) {
      const resolvedPayer = resolveUser(parsed.paidByUserId);
      if (resolvedPayer) {
        validatedPaidBy = resolvedPayer.id;
      }
    }

    // Validate splits and participant IDs
    const rawSplits = Array.isArray(parsed.splits) ? parsed.splits : [];
    const sanitizedSplits = [];

    for (const split of rawSplits) {
      const rawSplitUser = split.userId || split.id || split.name;
      const resolvedObj = resolveUser(rawSplitUser);

      if (!resolvedObj) {
        const participantLabel = split.name || rawSplitUser || "a participant";
        return {
          type: "clarification_needed",
          question: `Could you clarify who "${participantLabel}" is in your contacts?`,
          missingFields: ["participants"],
          partialProposal: {
            description: parsed.description,
            amount: parsed.amount,
          },
        };
      }

      sanitizedSplits.push({
        userId: resolvedObj.id,
        amount: typeof split.amount === "number" ? Math.abs(split.amount) : 0,
        paid: resolvedObj.id === validatedPaidBy,
      });
    }

    // If no splits or only 1, ensure current user and payer are included
    if (sanitizedSplits.length === 0) {
      return {
        type: "clarification_needed",
        question: "Who should this expense be split with?",
        missingFields: ["participants"],
        partialProposal: {
          description: parsed.description,
          amount: parsed.amount,
        },
      };
    }

    const totalAmount =
      typeof parsed.amount === "number" && parsed.amount > 0
        ? Math.round(parsed.amount * 100) / 100
        : Math.round(
            sanitizedSplits.reduce((sum, s) => sum + s.amount, 0) * 100
          ) / 100;

    // Check sum of splits vs total amount & fix minor float discrepancies
    const splitsSum = sanitizedSplits.reduce((sum, s) => sum + s.amount, 0);
    const diff = Math.round((totalAmount - splitsSum) * 100) / 100;

    if (Math.abs(diff) > 0 && Math.abs(diff) <= 0.05) {
      sanitizedSplits[sanitizedSplits.length - 1].amount =
        Math.round(
          (sanitizedSplits[sanitizedSplits.length - 1].amount + diff) * 100
        ) / 100;
    }

    // Category check
    const category = VALID_CATEGORIES.includes(parsed.category)
      ? parsed.category
      : "other";

    // Split type normalization
    let finalSplitType = parsed.splitType || "equal";
    const amounts = sanitizedSplits.map((s) => s.amount);
    const allEqual = amounts.length <= 1 || amounts.every((a) => Math.abs(a - amounts[0]) <= 0.05);

    if (!allEqual && finalSplitType === "equal") {
      finalSplitType = "exact";
    }

    return {
      type: "expense_proposal",
      description: (parsed.description || "Expense").trim(),
      amount: totalAmount,
      category,
      date:
        typeof parsed.date === "number" && parsed.date !== 1726000000000
          ? parsed.date
          : Date.now(),
      paidByUserId: validatedPaidBy,
      groupId: validatedGroupId,
      splitType: ["equal", "percentage", "exact"].includes(finalSplitType)
        ? finalSplitType
        : "equal",
      splits: sanitizedSplits,
      reasoning: parsed.reasoning || `Split of $${totalAmount}`,
      confidence:
        typeof parsed.confidence === "number"
          ? Math.max(0, Math.min(1, parsed.confidence))
          : 0.9,
    };
  }

  return {
    type: "clarification_needed",
    question: "Could not parse expense proposal. Please try rephrasing.",
    missingFields: ["all"],
  };
}
