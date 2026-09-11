import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

const BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || "my_settlo_bot";

function generateRandomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function getAuthenticatedUser(ctx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    return null;
  }
  const user = await ctx.db
    .query("users")
    .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.tokenIdentifier))
    .first();
  return user || null;
}

// 1. Generate unique 1-tap linking code and deep-link for the logged-in web user
export const generateTelegramLinkingCode = mutation({
  args: {
    botUsername: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("Must be signed in to connect Telegram");
    }

    const existingSession = await ctx.db
      .query("telegram_sessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    const code = generateRandomCode();
    const now = Date.now();

    if (existingSession) {
      await ctx.db.patch(existingSession._id, {
        linkingCode: code,
        lastInteraction: now,
      });
    } else {
      await ctx.db.insert("telegram_sessions", {
        chatId: user.telegramChatId || "",
        userId: user._id,
        linkingCode: code,
        status: user.telegramChatId ? "idle" : "unlinked",
        lastInteraction: now,
      });
    }

    const botUser =
      args.botUsername ||
      process.env.TELEGRAM_BOT_USERNAME ||
      process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ||
      "my_settlo_bot";
    const cleanBotUsername = botUser.replace("@", "").trim();
    const telegramDeepLink = `https://t.me/${cleanBotUsername}?start=${code}`;

    return {
      code,
      telegramDeepLink,
      botUsername: cleanBotUsername,
      isConnected: !!user.telegramChatId,
      telegramChatId: user.telegramChatId || null,
      telegramUsername: user.telegramUsername || null,
    };
  },
});

// 2. Query Telegram connection status for web dashboard
export const getTelegramStatus = query({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      return {
        isConnected: false,
        telegramChatId: null,
        telegramUsername: null,
        linkingCode: null,
      };
    }

    const session = await ctx.db
      .query("telegram_sessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return {
      isConnected: !!user.telegramChatId,
      telegramChatId: user.telegramChatId || null,
      telegramUsername: user.telegramUsername || null,
      linkingCode: session?.linkingCode || null,
      userName: user.name,
    };
  },
});

// 3. Unlink Telegram account
export const unlinkTelegram = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getAuthenticatedUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(user._id, {
      telegramChatId: undefined,
      telegramUsername: undefined,
    });

    const session = await ctx.db
      .query("telegram_sessions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (session) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

// 4. Link Telegram chat ID with code (called by webhook when user starts bot)
export const linkTelegramByCode = mutation({
  args: {
    chatId: v.string(),
    code: v.string(),
    username: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const cleanCode = args.code.trim().toUpperCase();

    const session = await ctx.db
      .query("telegram_sessions")
      .withIndex("by_linking_code", (q) => q.eq("linkingCode", cleanCode))
      .first();

    if (!session || !session.userId) {
      return {
        success: false,
        error: "Invalid or expired linking code. Please click 'Connect on Telegram' in Settlo Web to generate a new code.",
      };
    }

    const user = await ctx.db.get(session.userId);
    if (!user) {
      return {
        success: false,
        error: "Settlo user account not found.",
      };
    }

    // Update user record with Telegram info
    await ctx.db.patch(user._id, {
      telegramChatId: args.chatId,
      telegramUsername: args.username || undefined,
    });

    // Update session state
    await ctx.db.patch(session._id, {
      chatId: args.chatId,
      status: "idle",
      linkingCode: undefined,
      lastInteraction: Date.now(),
    });

    return {
      success: true,
      userName: user.name,
      userId: user._id,
    };
  },
});

// 5. Get user and session by Telegram Chat ID (called by webhook & polling)
export const getUserByTelegramChatId = query({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_telegram_chat", (q) => q.eq("telegramChatId", args.chatId))
      .first();

    let session = await ctx.db
      .query("telegram_sessions")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .first();

    if (!user && !session) {
      return null;
    }

    return {
      user: user
        ? {
            id: user._id,
            _id: user._id,
            name: user.name,
            email: user.email,
            telegramChatId: user.telegramChatId,
            telegramUsername: user.telegramUsername,
            currency: user.currency || "INR",
          }
        : null,
      session: session
        ? {
            _id: session._id,
            chatId: session.chatId,
            userId: session.userId,
            status: session.status,
            pendingExpense: session.pendingExpense || null,
            conversationHistory: session.conversationHistory || [],
            lastInteraction: session.lastInteraction,
          }
        : null,
    };
  },
});

// 5b. Get complete contacts and groups context for an authenticated Telegram user
export const getTelegramUserContext = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { user: null, contacts: [], groups: [] };

    // All registered users (excluding current user)
    const allUsers = await ctx.db.query("users").collect();
    const contacts = allUsers
      .filter((u) => u._id !== args.userId)
      .map((u) => ({
        id: u._id,
        _id: u._id,
        name: u.name || u.email?.split("@")[0] || "User",
        email: u.email,
      }));

    // Groups where user is a member
    const allGroups = await ctx.db.query("groups").collect();
    const groups = allGroups
      .filter((g) => g.members.some((m) => m.userId === args.userId))
      .map((g) => ({
        id: g._id,
        _id: g._id,
        name: g.name,
        members: g.members,
      }));

    return {
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency || "INR",
      },
      contacts,
      groups,
    };
  },
});

// 5c. Resolve or automatically create contact users by name/ID for smooth splits
export const resolveOrCreateParticipants = mutation({
  args: {
    participants: v.array(v.string()),
    currentUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const allUsers = await ctx.db.query("users").collect();
    const resolved = [];

    for (const raw of args.participants) {
      const clean = (raw || "").trim();
      if (!clean) continue;

      // 1. Direct ID match
      const exact = allUsers.find((u) => u._id === clean);
      if (exact) {
        resolved.push({
          id: exact._id,
          _id: exact._id,
          name: exact.name,
          email: exact.email,
        });
        continue;
      }

      // 2. Name match (case-insensitive)
      const cleanLower = clean.toLowerCase();
      const nameMatch = allUsers.find((u) => {
        const uName = (u.name || "").toLowerCase();
        const uFirst = uName.split(" ")[0];
        return (
          uName === cleanLower ||
          uFirst === cleanLower ||
          cleanLower.includes(uFirst) ||
          uName.includes(cleanLower)
        );
      });

      if (nameMatch) {
        resolved.push({
          id: nameMatch._id,
          _id: nameMatch._id,
          name: nameMatch.name,
          email: nameMatch.email,
        });
        continue;
      }

      // 3. Auto-create contact user if they don't exist yet
      const safeName = clean.charAt(0).toUpperCase() + clean.slice(1);
      const safeSlug = clean.toLowerCase().replace(/[^a-z0-9]/g, "");
      const newUserId = await ctx.db.insert("users", {
        name: safeName,
        email: `${safeSlug || "friend"}@contact.settlo.app`,
        tokenIdentifier: `contact_${safeSlug || "friend"}_${Date.now()}`,
      });

      resolved.push({
        id: newUserId,
        _id: newUserId,
        name: safeName,
        email: `${safeSlug || "friend"}@contact.settlo.app`,
      });
    }

    return resolved;
  },
});

// 6. Save pending expense proposal & conversation history in Telegram session
export const savePendingExpenseSession = mutation({
  args: {
    chatId: v.string(),
    pendingExpense: v.optional(v.any()),
    status: v.optional(v.string()),
    conversationHistory: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("telegram_sessions")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .first();

    const patchData = {
      lastInteraction: Date.now(),
    };
    if (args.pendingExpense !== undefined) patchData.pendingExpense = args.pendingExpense;
    if (args.status !== undefined) patchData.status = args.status;
    if (args.conversationHistory !== undefined)
      patchData.conversationHistory = args.conversationHistory;

    if (session) {
      await ctx.db.patch(session._id, patchData);
    } else {
      await ctx.db.insert("telegram_sessions", {
        chatId: args.chatId,
        status: args.status || "idle",
        pendingExpense: args.pendingExpense || null,
        conversationHistory: args.conversationHistory || [],
        lastInteraction: Date.now(),
      });
    }

    return { success: true };
  },
});

// 7. Clear pending expense & conversation history in Telegram session
export const clearPendingExpenseSession = mutation({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("telegram_sessions")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        pendingExpense: null,
        conversationHistory: [],
        status: "idle",
        lastInteraction: Date.now(),
      });
    }

    return { success: true };
  },
});

// 8. Cross-channel Deduplication check
export const checkRecentDuplicateExpense = query({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    description: v.string(),
    windowMinutes: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const windowMs = (args.windowMinutes || 10) * 60 * 1000;
    const sinceTime = Date.now() - windowMs;

    const recentExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_date", (q) => q.gte("date", sinceTime))
      .collect();

    const duplicate = recentExpenses.find((e) => {
      const isRelatedUser =
        e.paidByUserId === args.userId || e.createdBy === args.userId;
      if (!isRelatedUser) return false;

      const amountMatch = Math.abs(e.amount - args.amount) < 0.01;
      const descMatch =
        e.description.toLowerCase().trim() ===
        args.description.toLowerCase().trim();

      return amountMatch && descMatch;
    });

    if (duplicate) {
      return {
        isDuplicate: true,
        existingExpense: {
          id: duplicate._id,
          description: duplicate.description,
          amount: duplicate.amount,
          date: duplicate.date,
        },
      };
    }

    return { isDuplicate: false, existingExpense: null };
  },
});

// 9. Create expense directly from Telegram confirmation
export const createExpenseFromTelegram = mutation({
  args: {
    chatId: v.string(),
    userId: v.id("users"),
    expense: v.object({
      description: v.string(),
      amount: v.number(),
      category: v.optional(v.string()),
      date: v.optional(v.number()),
      paidByUserId: v.id("users"),
      splitType: v.string(),
      splits: v.array(
        v.object({
          userId: v.id("users"),
          amount: v.number(),
          paid: v.boolean(),
        })
      ),
      groupId: v.optional(v.id("groups")),
    }),
  },
  handler: async (ctx, args) => {
    // Verify splits add up
    const totalSplits = args.expense.splits.reduce(
      (sum, s) => sum + s.amount,
      0
    );
    if (Math.abs(totalSplits - args.expense.amount) > 0.05) {
      throw new Error("Splits do not equal total amount");
    }

    // Insert expense
    const expenseId = await ctx.db.insert("expenses", {
      description: args.expense.description,
      amount: args.expense.amount,
      category: args.expense.category || "other",
      date: args.expense.date || Date.now(),
      paidByUserId: args.expense.paidByUserId,
      splitType: args.expense.splitType,
      splits: args.expense.splits,
      groupId: args.expense.groupId,
      createdBy: args.userId,
    });

    // Clear session pending status
    const session = await ctx.db
      .query("telegram_sessions")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        pendingExpense: null,
        status: "idle",
        lastInteraction: Date.now(),
      });
    }

    return {
      success: true,
      expenseId,
    };
  },
});

// 10. Get balances for Telegram user
export const getTelegramUserBalances = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) {
      return {
        youOwe: 0,
        youAreOwed: 0,
        totalBalance: 0,
        oweDetails: { youOwe: [], youAreOwedBy: [] },
      };
    }

    const expenses = (await ctx.db.query("expenses").collect()).filter(
      (e) =>
        !e.groupId &&
        (e.paidByUserId === user._id ||
          e.splits.some((s) => s.userId === user._id))
    );

    let youOwe = 0;
    let youAreOwed = 0;
    const balanceByUser = {};

    for (const e of expenses) {
      const isPayer = e.paidByUserId === user._id;
      const mySplit = e.splits.find((s) => s.userId === user._id);

      if (isPayer) {
        for (const s of e.splits) {
          if (s.userId === user._id || s.paid) continue;
          youAreOwed += s.amount;
          (balanceByUser[s.userId] ??= { owed: 0, owing: 0 }).owed += s.amount;
        }
      } else if (mySplit && !mySplit.paid) {
        youOwe += mySplit.amount;
        (balanceByUser[e.paidByUserId] ??= { owed: 0, owing: 0 }).owing +=
          mySplit.amount;
      }
    }

    const settlements = (await ctx.db.query("settlements").collect()).filter(
      (s) =>
        !s.groupId &&
        (s.paidByUserId === user._id || s.receivedByUserId === user._id)
    );

    for (const s of settlements) {
      if (s.paidByUserId === user._id) {
        youOwe -= s.amount;
        (balanceByUser[s.receivedByUserId] ??= { owed: 0, owing: 0 }).owing -=
          s.amount;
      } else {
        youAreOwed -= s.amount;
        (balanceByUser[s.paidByUserId] ??= { owed: 0, owing: 0 }).owed -=
          s.amount;
      }
    }

    const allUsers = await ctx.db.query("users").collect();
    const userMap = new Map(allUsers.map((u) => [u._id, u.name || "User"]));

    const youOweList = [];
    const youAreOwedByList = [];

    for (const [otherUserId, b] of Object.entries(balanceByUser)) {
      const net = b.owed - b.owing;
      const name = userMap.get(otherUserId) || "Someone";
      if (net > 0) {
        youAreOwedByList.push({ userId: otherUserId, name, amount: net });
      } else if (net < 0) {
        youOweList.push({ userId: otherUserId, name, amount: Math.abs(net) });
      }
    }

    const totalBalance = youAreOwed - youOwe;

    return {
      youOwe,
      youAreOwed,
      totalBalance,
      oweDetails: {
        youOwe: youOweList,
        youAreOwedBy: youAreOwedByList,
      },
    };
  },
});

