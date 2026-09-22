"use client";

import React, { useState } from "react";
import { CheckCircle2, Receipt, Split, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/components/providers/currency-context";

const SAMPLE_PROMPTS = [
  {
    id: "ccd",
    label: "☕ CCD Coffee (Hinglish)",
    text: "Bhai CCD pe 450 bill aaya, maine pay kiya Alex aur mera 50-50",
    description: "CCD Cafe Coffee",
    amount: 450,
    payer: "You",
    category: "Food & Drink",
    splits: [
      { name: "You", amount: 225, isPayer: true, status: "Payer" },
      { name: "Alex", amount: 225, isPayer: false, status: "Owes You" },
    ],
  },
  {
    id: "goa",
    label: "🏖️ Goa Trip Villa (4 Friends)",
    text: "Goa Airbnb 12,000 paid by Alex, 4 people equal split with Sam, Jordan, and Taylor",
    description: "Goa Airbnb Villa Stay",
    amount: 12000,
    payer: "Alex",
    category: "Trips & Stays",
    splits: [
      { name: "Alex", amount: 3000, isPayer: true, status: "Paid Total" },
      { name: "Sam", amount: 3000, isPayer: false, status: "Owes Alex" },
      { name: "Jordan", amount: 3000, isPayer: false, status: "Owes Alex" },
      { name: "Taylor", amount: 3000, isPayer: false, status: "Owes Alex" },
    ],
  },
  {
    id: "pizza",
    label: "🍕 Pizza Night (Exact Split)",
    text: "Pizza party 60 dollars, Jordan owes 35 and I owe 25",
    description: "Pizza Party Delivery",
    amount: 60,
    payer: "You",
    category: "Food & Drink",
    splits: [
      { name: "You", amount: 25, isPayer: true, status: "Payer" },
      { name: "Jordan", amount: 35, isPayer: false, status: "Owes You" },
    ],
  },
  {
    id: "uber",
    label: "🚖 Airport Uber (Third Party Payer)",
    text: "Uber ride 800 paid by Sam, me and Taylor owe 400 each",
    description: "Airport Cab Ride",
    amount: 800,
    payer: "Sam",
    category: "Transportation",
    splits: [
      { name: "Sam", amount: 0, isPayer: true, status: "Paid Total" },
      { name: "You", amount: 400, isPayer: false, status: "You Owe Sam" },
      { name: "Taylor", amount: 400, isPayer: false, status: "Owes Sam" },
    ],
  },
];

function parseExpensePromptClient(rawText) {
  const text = (rawText || "").trim();
  if (!text) return SAMPLE_PROMPTS[0];

  const lower = text.toLowerCase();

  // 1. Direct or fuzzy match with preset samples
  for (const sample of SAMPLE_PROMPTS) {
    if (
      lower === sample.text.toLowerCase() ||
      (sample.id === "ccd" && (lower.includes("ccd") || lower.includes("bhai ccd"))) ||
      (sample.id === "goa" && (lower.includes("goa") || lower.includes("airbnb"))) ||
      (sample.id === "pizza" && (lower.includes("pizza") || lower.includes("jordan owes"))) ||
      (sample.id === "uber" && (lower.includes("uber") || (lower.includes("sam") && lower.includes("airport"))))
    ) {
      return {
        id: sample.id,
        label: sample.label,
        text: text,
        description: sample.description,
        amount: sample.amount,
        payer: sample.payer,
        category: sample.category,
        splits: sample.splits,
      };
    }
  }

  // 2. Intelligent Natural Language Fallback
  // Extract amount
  const amtMatches = text.match(/(?:(?:total|amount|bill|rs\.?|inr|usd|\$|€|£|₹|paid)\s*[:=]?\s*)?(\d{1,3}(?:,\d{3})*(?:\.\d+)?|\d+(?:\.\d+)?)/gi);
  let totalAmount = 500;
  if (amtMatches && amtMatches.length > 0) {
    // Pick the last or largest numeric token
    const nums = amtMatches
      .map((m) => {
        const cleaned = m.replace(/[^0-9.]/g, "");
        return parseFloat(cleaned);
      })
      .filter((n) => !isNaN(n) && n > 0);
    if (nums.length > 0) {
      totalAmount = nums[nums.length - 1];
    }
  }

  // Extract Payer
  let payer = "You";
  const payerAfter = text.match(/(?:paid by|pay kiya|paid)\s+([A-Za-z]+)/i);
  const payerBefore = text.match(/([A-Za-z]+)\s+(?:ne pay kiya|paid|ne diya)/i);

  if (payerBefore && !/^(me|i|maine|who|we|total|amount)$/i.test(payerBefore[1])) {
    payer = payerBefore[1].charAt(0).toUpperCase() + payerBefore[1].slice(1);
  } else if (payerAfter && !/^(me|i|maine|who|we|total|amount)$/i.test(payerAfter[1])) {
    payer = payerAfter[1].charAt(0).toUpperCase() + payerAfter[1].slice(1);
  }

  // Category & Description
  let category = "General";
  let description = "Shared Expense";
  if (/flight|plane|airline|indigo|air india/i.test(lower)) {
    category = "Transportation";
    description = "Flight Ticket Booking";
  } else if (/coffee|ccd|cafe|starbucks|tea|chai/i.test(lower)) {
    category = "Food & Drink";
    description = "Coffee & Cafe Meetup";
  } else if (/dinner|lunch|food|pizza|burger|biryani|restaurant|zomato|swiggy/i.test(lower)) {
    category = "Food & Drink";
    description = "Dining & Food Split";
  } else if (/uber|cab|ola|auto|petrol|fuel|taxi/i.test(lower)) {
    category = "Transportation";
    description = "Cab & Travel Ride";
  } else if (/goa|villa|airbnb|hotel|resort|trip|vacation|trek/i.test(lower)) {
    category = "Trips & Stays";
    description = "Trip & Accommodation";
  } else if (/rent|wifi|electricity|groceries|milk|maid|cook/i.test(lower)) {
    category = "Housing & Utilities";
    description = "Household Shared Expense";
  } else if (/movie|tickets|party|club|drinks|beer|gaming/i.test(lower)) {
    category = "Entertainment";
    description = "Outing & Entertainment";
  }

  // Stop words to never treat as participant names
  const STOP_WORDS = new Set([
    "total", "amount", "paid", "kiya", "split", "between", "with", "and", "aur",
    "for", "book", "ticket", "flight", "cab", "hotel", "villa", "dinner", "food",
    "pizza", "uber", "chai", "bill", "rupees", "rs", "inr", "bucks", "equal",
    "each", "50-50", "people", "friends", "everyone", "us", "all", "mera", "meri",
    "mere", "aap", "tum", "ne", "pe", "ka", "ki", "ke", "gaya", "aaya", "hai",
  ]);

  // Extract Participants
  let participants = [];
  const betweenMatch = text.match(/(?:between|with|among|and|aur)\s+([^,.;]+)/i);
  if (betweenMatch) {
    const rawCandidates = betweenMatch[1]
      .split(/[,&]|\band\b|\baur\b|\bwith\b/i)
      .map((s) => s.trim().replace(/[^A-Za-z]/g, ""))
      .filter((s) => s.length > 1 && !STOP_WORDS.has(s.toLowerCase()));

    rawCandidates.forEach((cand) => {
      const formatted = cand.charAt(0).toUpperCase() + cand.slice(1).toLowerCase();
      if (!participants.includes(formatted)) {
        participants.push(formatted);
      }
    });
  }

  // Ensure payer is included
  if (payer && !participants.includes(payer)) {
    participants.unshift(payer);
  }

  // If only 1 person found and payer is You, add Friend
  if (participants.length === 1 && payer === "You") {
    participants.push("Friend");
  }

  const perPerson = Math.round((totalAmount / participants.length) * 100) / 100;
  const splits = participants.map((name) => {
    const isPayer = name.toLowerCase() === payer.toLowerCase();
    return {
      name,
      amount: perPerson,
      isPayer,
      status: isPayer
        ? "Paid Total"
        : payer === "You"
        ? "Owes You"
        : name === "You"
        ? `You Owe ${payer}`
        : `Owes ${payer}`,
    };
  });

  return {
    id: "parsed",
    label: "Custom Prompt",
    text: text,
    description,
    amount: totalAmount,
    payer,
    category,
    splits,
  };
}

export function InteractivePlayground() {
  const [selectedPrompt, setSelectedPrompt] = useState(SAMPLE_PROMPTS[0]);
  const [customText, setCustomText] = useState(SAMPLE_PROMPTS[0].text);
  const [isParsing, setIsParsing] = useState(false);
  const { formatAmount } = useCurrency();

  const handleSelectSample = (sample) => {
    setSelectedPrompt(sample);
    setCustomText(sample.text);
    setIsParsing(true);
    setTimeout(() => {
      setIsParsing(false);
    }, 200);
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customText.trim()) return;
    setIsParsing(true);

    try {
      // 1. Call public Gemini AI endpoint
      const response = await fetch("/api/ai/parse-public", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: customText }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data && Array.isArray(result.data.splits)) {
          setSelectedPrompt({
            id: "ai-parsed",
            label: "AI Parsed",
            text: customText,
            description: result.data.description || "Shared Expense",
            amount: result.data.amount,
            payer: result.data.payer || "You",
            category: result.data.category || "General",
            splits: result.data.splits,
          });
          setIsParsing(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Public AI parse failed, using client parser:", err);
    }

    // 2. Fallback to client parser
    const fallbackResult = parseExpensePromptClient(customText);
    setSelectedPrompt(fallbackResult);
    setIsParsing(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-border/60 bg-card/80 dark:bg-card/50 backdrop-blur-xl shadow-2xl p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header - Cleaned up without badges */}

      {/* Preset Prompt Chips */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Click any sample prompt to test:
        </label>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_PROMPTS.map((sample) => {
            const isSelected = selectedPrompt.id === sample.id;
            return (
              <button
                key={sample.id}
                onClick={() => handleSelectSample(sample)}
                className={`text-xs px-3 py-2 rounded-xl font-medium border transition-all text-left cursor-pointer ${
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-sm ring-2 ring-primary/20 scale-[1.02]"
                    : "bg-muted/40 hover:bg-muted/80 text-muted-foreground hover:text-foreground border-border/60"
                }`}
              >
                {sample.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Text Input Simulation */}
      <form onSubmit={handleCustomSubmit} className="relative">
        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Type or modify an expense prompt (e.g., 'Dinner 60 with Alex, I paid')..."
          className="w-full px-4 py-3.5 pr-28 rounded-2xl border border-border/80 bg-background/90 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 transition shadow-inner font-mono text-xs sm:text-sm"
        />
        <Button
          type="submit"
          size="sm"
          disabled={isParsing}
          className="absolute right-1.5 top-1.5 bottom-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs gap-1.5 px-3 cursor-pointer"
        >
          {isParsing ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="h-3.5 w-3.5" />
          )}
          <span>{isParsing ? "Parsing..." : "Parse AI"}</span>
        </Button>
      </form>

      {/* Parsed Result Card Visualizer */}
      <div className="relative rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent p-4 sm:p-6 space-y-4">
        {isParsing && (
          <div className="absolute inset-0 bg-background/70 backdrop-blur-sm rounded-2xl flex items-center justify-center z-20 transition-all">
            <div className="flex items-center gap-2 text-sm font-medium text-emerald-600 dark:text-emerald-400">
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>Resolving splits &amp; payer...</span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">
                {selectedPrompt.description}
              </div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span>Paid by: <strong className="text-foreground">{selectedPrompt.payer}</strong></span>
                <span>•</span>
                <span className="capitalize">{selectedPrompt.category}</span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatAmount(selectedPrompt.amount)}
            </div>
            <div className="text-[11px] text-muted-foreground">Total Expense Amount</div>
          </div>
        </div>

        {/* Calculated Splits Grid */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1">
              <Split className="h-3.5 w-3.5" />
              Calculated Split Breakdown
            </span>
            <span>{selectedPrompt.splits.length} participants</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {selectedPrompt.splits.map((split, i) => (
              <div
                key={i}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                  split.isPayer
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-200"
                    : "bg-background/80 border-border/60 text-foreground"
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted text-xs font-bold">
                    {split.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-semibold">{split.name}</div>
                    <div className="text-[10px] text-muted-foreground">
                      {split.status || (split.isPayer ? "Payer" : "Owes")}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold">
                    {formatAmount(split.amount)}
                  </div>
                  {split.isPayer ? (
                    <span className="inline-flex items-center text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-3 w-3 mr-0.5" /> Paid
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      Owes
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
