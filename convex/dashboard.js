import { v } from "convex/values";
import { query } from "./_generated/server";
import { internal } from "./_generated/api";

export const getUserBalances = query({
  handler: async (ctx) => {

    const user = await ctx.runQuery(internal.users.getCurrentUser);
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
        !e.groupId && // 1‑to‑1 only
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

    /* ───────────── 1‑to‑1 settlements (no groupId) ───────────── */
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

    /* build lists for UI */
    const youOweList = [];
    const youAreOwedByList = [];
    for (const [uid, { owed, owing }] of Object.entries(balanceByUser)) {
      const net = owed - owing;
      if (net === 0) continue;
      const counterpart = await ctx.db.get(uid);
      const base = {
        userId: uid,
        name: counterpart?.name ?? "Unknown",
        imageUrl: counterpart?.imageUrl,
        amount: Math.abs(net),
      };
      net > 0 ? youAreOwedByList.push(base) : youOweList.push(base);
    }

    youOweList.sort((a, b) => b.amount - a.amount);
    youAreOwedByList.sort((a, b) => b.amount - a.amount);

    return {
      youOwe,
      youAreOwed,
      totalBalance: youAreOwed - youOwe,
      oweDetails: { youOwe: youOweList, youAreOwedBy: youAreOwedByList },
    };
  },
});

// Comprehensive analytics with dynamic year selection and category breakdown
export const getDashboardAnalytics = query({
  args: {
    year: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) {
      return {
        selectedYear: new Date().getFullYear(),
        availableYears: [new Date().getFullYear()],
        totalSpentThisYear: 0,
        totalSpentThisMonth: 0,
        totalSpentAllTime: 0,
        monthlySpending: [],
        categoryBreakdown: [],
        topCategory: null,
        monthlyAverage: 0,
        totalExpensesCount: 0,
      };
    }

    // 1. Fetch all expenses involving user
    const allExpenses = await ctx.db.query("expenses").collect();
    const userExpenses = allExpenses.filter(
      (expense) =>
        expense.paidByUserId === user._id ||
        expense.splits?.some((split) => split.userId === user._id)
    );

    // 2. Discover all distinct years with activity
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    const yearsSet = new Set([currentYear]);

    userExpenses.forEach((e) => {
      if (typeof e.date === "number") {
        const yr = new Date(e.date).getFullYear();
        if (!isNaN(yr) && yr > 2000 && yr < 2100) {
          yearsSet.add(yr);
        }
      }
    });

    const availableYears = Array.from(yearsSet).sort((a, b) => b - a);

    // Determine target year
    let targetYear = args.year;
    if (!targetYear || !availableYears.includes(targetYear)) {
      targetYear = availableYears.includes(currentYear)
        ? currentYear
        : availableYears[0];
    }

    // 3. Compute breakdown for targetYear and All-Time
    let totalSpentAllTime = 0;
    let totalSpentThisYear = 0;
    let totalSpentThisMonth = 0;

    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const monthlyTotals = Array.from({ length: 12 }, (_, i) => ({
      monthIndex: i,
      monthName: monthNames[i],
      total: 0,
      count: 0,
    }));

    const categoryTotals = {};
    let yearExpensesCount = 0;

    userExpenses.forEach((expense) => {
      // User's personal share in this expense
      const userSplit = expense.splits?.find((s) => s.userId === user._id);
      let myShare = 0;

      if (userSplit) {
        myShare = userSplit.amount;
      } else if (expense.paidByUserId === user._id) {
        const othersSum =
          expense.splits?.reduce((sum, s) => sum + s.amount, 0) || 0;
        myShare = Math.max(0, expense.amount - othersSum);
      }

      totalSpentAllTime += myShare;

      const expDate = new Date(expense.date);
      const expYear = expDate.getFullYear();
      const expMonth = expDate.getMonth();

      if (expYear === targetYear) {
        totalSpentThisYear += myShare;
        yearExpensesCount++;

        if (expMonth >= 0 && expMonth < 12) {
          monthlyTotals[expMonth].total += myShare;
          monthlyTotals[expMonth].count += 1;
        }

        if (targetYear === currentYear && expMonth === currentMonth) {
          totalSpentThisMonth += myShare;
        }

        const cat = expense.category || "other";
        categoryTotals[cat] = (categoryTotals[cat] || 0) + myShare;
      }
    });

    const categoryBreakdown = Object.entries(categoryTotals)
      .map(([categoryId, amount]) => ({
        categoryId,
        amount: Math.round(amount * 100) / 100,
        percentage:
          totalSpentThisYear > 0
            ? Math.round((amount / totalSpentThisYear) * 1000) / 10
            : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    const topCategory =
      categoryBreakdown.length > 0 ? categoryBreakdown[0] : null;

    const divisor =
      targetYear === currentYear ? Math.max(1, currentMonth + 1) : 12;
    const monthlyAverage =
      Math.round((totalSpentThisYear / divisor) * 100) / 100;

    return {
      selectedYear: targetYear,
      availableYears,
      totalSpentThisYear: Math.round(totalSpentThisYear * 100) / 100,
      totalSpentThisMonth: Math.round(totalSpentThisMonth * 100) / 100,
      totalSpentAllTime: Math.round(totalSpentAllTime * 100) / 100,
      monthlySpending: monthlyTotals.map((m) => ({
        ...m,
        total: Math.round(m.total * 100) / 100,
      })),
      categoryBreakdown,
      topCategory,
      monthlyAverage,
      totalExpensesCount: yearExpensesCount,
    };
  },
});

// Get total spent in a year (backward compatible)
export const getTotalSpent = query({
  args: { year: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) return 0;

    const targetYear = args.year || new Date().getFullYear();
    const startOfYear = new Date(targetYear, 0, 1).getTime();
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999).getTime();

    const expenses = await ctx.db
      .query("expenses")
      .withIndex("by_date", (q) =>
        q.gte("date", startOfYear).lte("date", endOfYear)
      )
      .collect();

    const userExpenses = expenses.filter(
      (expense) =>
        expense.paidByUserId === user._id ||
        expense.splits.some((split) => split.userId === user._id)
    );

    let totalSpent = 0;
    userExpenses.forEach((expense) => {
      const userSplit = expense.splits.find(
        (split) => split.userId === user._id
      );
      if (userSplit) {
        totalSpent += userSplit.amount;
      }
    });

    return Math.round(totalSpent * 100) / 100;
  },
});

// Get monthly spending in a year (backward compatible)
export const getMonthlySpending = query({
  args: { year: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) return [];

    const targetYear = args.year || new Date().getFullYear();
    const startOfYear = new Date(targetYear, 0, 1).getTime();
    const endOfYear = new Date(targetYear, 11, 31, 23, 59, 59, 999).getTime();

    const allExpenses = await ctx.db
      .query("expenses")
      .withIndex("by_date", (q) =>
        q.gte("date", startOfYear).lte("date", endOfYear)
      )
      .collect();

    const userExpenses = allExpenses.filter(
      (expense) =>
        expense.paidByUserId === user._id ||
        expense.splits.some((split) => split.userId === user._id)
    );

    const monthlyTotals = {};
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(targetYear, i, 1);
      monthlyTotals[monthDate.getTime()] = 0;
    }

    userExpenses.forEach((expense) => {
      const date = new Date(expense.date);
      const monthStart = new Date(
        date.getFullYear(),
        date.getMonth(),
        1
      ).getTime();

      const userSplit = expense.splits.find(
        (split) => split.userId === user._id
      );
      if (userSplit && monthlyTotals[monthStart] !== undefined) {
        monthlyTotals[monthStart] += userSplit.amount;
      }
    });

    const result = Object.entries(monthlyTotals).map(([month, total]) => ({
      month: parseInt(month),
      total: Math.round(total * 100) / 100,
    }));

    result.sort((a, b) => a.month - b.month);
    return result;
  },
});

// Get groups for the current user
export const getUserGroups = query({
  handler: async (ctx) => {
    const user = await ctx.runQuery(internal.users.getCurrentUser);
    if (!user) return [];

    // Get all groups
    const allGroups = await ctx.db.query("groups").collect();

    // Filter for groups where the user is a member
    const groups = allGroups.filter((group) =>
      group.members.some((member) => member.userId === user._id)
    );

    // Calculate balances for each group
    const enhancedGroups = await Promise.all(
      groups.map(async (group) => {
        // Get all expenses for this group
        const expenses = await ctx.db
          .query("expenses")
          .withIndex("by_group", (q) => q.eq("groupId", group._id))
          .collect();

        let balance = 0;

        expenses.forEach((expense) => {
          if (expense.paidByUserId === user._id) {
            // User paid for others
            expense.splits.forEach((split) => {
              if (split.userId !== user._id && !split.paid) {
                balance += split.amount;
              }
            });
          } else {
            // User owes someone else
            const userSplit = expense.splits.find(
              (split) => split.userId === user._id
            );
            if (userSplit && !userSplit.paid) {
              balance -= userSplit.amount;
            }
          }
        });

        // Apply settlements
        const settlements = await ctx.db
          .query("settlements")
          .filter((q) =>
            q.and(
              q.eq(q.field("groupId"), group._id),
              q.or(
                q.eq(q.field("paidByUserId"), user._id),
                q.eq(q.field("receivedByUserId"), user._id)
              )
            )
          )
          .collect();

        settlements.forEach((settlement) => {
          if (settlement.paidByUserId === user._id) {
            // User paid someone
            balance += settlement.amount;
          } else {
            // Someone paid the user
            balance -= settlement.amount;
          }
        });

        return {
          ...group,
          id: group._id,
          balance,
        };
      })
    );

    return enhancedGroups;
  },
});