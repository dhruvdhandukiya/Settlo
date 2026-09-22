// convex/contacts.js
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/* ──────────────────────────────────────────────────────────────────────────
   1. getAllContacts – 1‑to‑1 expense contacts + groups
   ──────────────────────────────────────────────────────────────────────── */
export const getAllContacts = query({
  handler: async (ctx) => {
    // Use the centralized getCurrentUser instead of duplicating auth logic
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);
    if (!currentUser) {
      return { users: [], groups: [] };
    }

    // 1. Groups where current user is a member
    const allGroups = await ctx.db.query("groups").collect();
    const userGroups = allGroups
      .filter((g) => g.members?.some((m) => m.userId === currentUser._id))
      .map((g) => ({
        id: g._id,
        name: g.name,
        description: g.description,
        memberCount: g.members?.length || 0,
        type: "group",
      }));

    // 2. Collect IDs of all related users (from shared groups + shared expenses)
    const relatedUserIds = new Set();

    // From groups
    allGroups
      .filter((g) => g.members?.some((m) => m.userId === currentUser._id))
      .forEach((g) => {
        g.members?.forEach((m) => {
          if (m.userId !== currentUser._id) {
            relatedUserIds.add(m.userId);
          }
        });
      });

    // From expenses
    const allExpenses = await ctx.db.query("expenses").collect();
    allExpenses.forEach((exp) => {
      const isUserInvolved =
        exp.paidByUserId === currentUser._id ||
        (exp.splits || []).some((s) => s.userId === currentUser._id);

      if (isUserInvolved) {
        if (exp.paidByUserId && exp.paidByUserId !== currentUser._id) {
          relatedUserIds.add(exp.paidByUserId);
        }
        (exp.splits || []).forEach((s) => {
          if (s.userId && s.userId !== currentUser._id) {
            relatedUserIds.add(s.userId);
          }
        });
      }
    });

    // 3. Fetch only related users
    const contactUserPromises = Array.from(relatedUserIds).map((id) =>
      ctx.db.get(id)
    );
    const resolvedUsers = (await Promise.all(contactUserPromises)).filter(
      Boolean
    );

    const contactUsers = resolvedUsers.map((u) => ({
      id: u._id,
      name: u.name || u.email?.split("@")[0] || "User",
      email: u.email,
      imageUrl: u.imageUrl,
      type: "user",
    }));

    /* sort alphabetically */
    contactUsers.sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));
    userGroups.sort((a, b) => (a?.name || "").localeCompare(b?.name || ""));

    return { users: contactUsers, groups: userGroups };
  },
});

/* ──────────────────────────────────────────────────────────────────────────
   2. createGroup – create a new group
   ──────────────────────────────────────────────────────────────────────── */
export const createGroup = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    members: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    // Use the centralized getCurrentUser instead of duplicating auth logic
    const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

    if (!args.name.trim()) throw new Error("Group name cannot be empty");

    const uniqueMembers = new Set(args.members);
    uniqueMembers.add(currentUser._id); // ensure creator

    // Validate that all member users exist
    for (const id of uniqueMembers) {
      if (!(await ctx.db.get(id)))
        throw new Error(`User with ID ${id} not found`);
    }

    return await ctx.db.insert("groups", {
      name: args.name.trim(),
      description: args.description?.trim() ?? "",
      createdBy: currentUser._id,
      members: [...uniqueMembers].map((id) => ({
        userId: id,
        role: id === currentUser._id ? "admin" : "member",
        joinedAt: Date.now(),
      })),
    });
  },
});