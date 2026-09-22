import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submitFeedback = mutation({
  args: {
    name: v.string(),
    contact: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const feedbackId = await ctx.db.insert("feedback", {
      name: args.name.trim(),
      contact: args.contact.trim(),
      message: args.message.trim(),
      createdAt: Date.now(),
      status: "new",
    });
    return feedbackId;
  },
});

export const getFeedbackList = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("feedback").order("desc").take(50);
  },
});
