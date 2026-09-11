import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    name: v.string(),
    email: v.string(),
    tokenIdentifier: v.string(),
    imageUrl: v.optional(v.string()),
    telegramChatId: v.optional(v.string()),
    telegramUsername: v.optional(v.string()),
    currency: v.optional(v.string()), // e.g. "INR", "USD", "EUR", etc.
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_email", ["email"])
    .index("by_telegram_chat", ["telegramChatId"])
    .searchIndex("search_name", { searchField: "name" })
    .searchIndex("search_email", { searchField: "email" }),

  // Telegram Sessions & Conversational State Engine
  telegram_sessions: defineTable({
    chatId: v.string(),
    userId: v.optional(v.id("users")),
    linkingCode: v.optional(v.string()),
    status: v.string(), // "unlinked" | "idle" | "awaiting_confirmation" | "awaiting_split" | "awaiting_clarification"
    pendingExpense: v.optional(v.any()),
    conversationHistory: v.optional(v.any()),
    lastInteraction: v.number(),
  })
    .index("by_chat_id", ["chatId"])
    .index("by_linking_code", ["linkingCode"])
    .index("by_user", ["userId"]),

  // Expenses
  expenses: defineTable({
    description: v.string(),
    amount: v.number(),
    category: v.optional(v.string()),
    currency: v.optional(v.string()), // e.g. "INR", "USD", "EUR"
    date: v.number(), // timestamp
    paidByUserId: v.id("users"), // Reference to users table
    splitType: v.string(), // "equal", "percentage", "exact"
    splits: v.array(
      v.object({
        userId: v.id("users"), // Reference to users table
        amount: v.number(), // amount owed by this user
        paid: v.boolean(),
      })
    ),
    groupId: v.optional(v.id("groups")), // null for one-on-one expenses
    createdBy: v.id("users"), // Reference to users table
  })
    .index("by_group", ["groupId"])
    .index("by_user_and_group", ["paidByUserId", "groupId"])
    .index("by_date", ["date"]),

  // Settlements
  settlements: defineTable({
    amount: v.number(),
    note: v.optional(v.string()),
    currency: v.optional(v.string()),
    date: v.number(), // timestamp
    paidByUserId: v.id("users"), // Reference to users table
    receivedByUserId: v.id("users"), // Reference to users table
    groupId: v.optional(v.id("groups")), // null for one-on-one settlements
    relatedExpenseIds: v.optional(v.array(v.id("expenses"))), // Which expenses this settlement covers
    createdBy: v.id("users"), // Reference to users table
  })
    .index("by_group", ["groupId"])
    .index("by_user_and_group", ["paidByUserId", "groupId"])
    .index("by_receiver_and_group", ["receivedByUserId", "groupId"])
    .index("by_date", ["date"]),

  // Groups
  groups: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    createdBy: v.id("users"), // Reference to users table
    members: v.array(
      v.object({
        userId: v.id("users"), // Reference to users table
        role: v.string(), // "admin" or "member"
        joinedAt: v.number(),
      })
    ),
  }),
});
