"use client";

import React, { useState } from "react";
import { Sparkles, CheckCircle2, Receipt, Split, RefreshCw, Send, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/components/providers/currency-context";

const SAMPLE_PROMPTS = [
  {
    id: "ccd",
    label: "☕ CCD Coffee (Hinglish)",
    text: "Bhai CCD pe 450 bill aaya, maine pay kiya Alex aur mera 50-50",
    description: "CCD Cafe Coffee",
    amount: 450,
    payer: "You",
    category: "foodDrink",
    splits: [
      { name: "You", amount: 225, isPayer: true },
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
    category: "trips",
    splits: [
      { name: "Alex", amount: 3000, isPayer: true },
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
    category: "foodDrink",
    splits: [
      { name: "You", amount: 25, isPayer: true },
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
    category: "transportation",
    splits: [
      { name: "Sam", amount: 0, isPayer: true, status: "Paid Total" },
      { name: "You", amount: 400, isPayer: false, status: "You Owe Sam" },
      { name: "Taylor", amount: 400, isPayer: false, status: "Owes Sam" },
    ],
  },
];

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
    }, 300);
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customText.trim()) return;
    setIsParsing(true);
    setTimeout(() => {
      const amtMatch = customText.match(/(\d+[\d,.]*)/);
      const parsedAmt = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, "")) : 500;
      setSelectedPrompt({
        id: "custom",
        label: "Custom Prompt",
        text: customText,
        description: customText.slice(0, 24) || "Expense",
        amount: parsedAmt,
        payer: "You",
        category: "other",
        splits: [
          { name: "You", amount: parsedAmt / 2, isPayer: true },
          { name: "Friend", amount: parsedAmt / 2, isPayer: false, status: "Owes You" },
        ],
      });
      setIsParsing(false);
    }, 350);
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl border border-border/60 bg-card/80 dark:bg-card/50 backdrop-blur-xl shadow-2xl p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
              <Sparkles className="h-3 w-3 mr-1" />
              Live Interactive AI Sandbox
            </Badge>
            <span className="text-xs text-muted-foreground">Test in real-time</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold mt-1 text-foreground">
            Test natural language, Hinglish &amp; exact splits
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Gemini Flash 2.5 Active
          </span>
        </div>
      </div>

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
          className="absolute right-1.5 top-1.5 bottom-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs gap-1.5 px-3"
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
              <span>Gemini parser resolving splits &amp; payer...</span>
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
