"use client";

import React, { useState } from "react";
import { GitMerge } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DebtGraphVisualizer() {
  const [isSimplified, setIsSimplified] = useState(true);

  return (
    <section className="w-full max-w-5xl mx-auto py-12 px-4">
      <div className="rounded-3xl border border-border/60 bg-gradient-to-b from-card via-card/70 to-muted/20 p-6 sm:p-10 backdrop-blur-xl shadow-xl space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs">
              <GitMerge className="h-3 w-3 mr-1" />
              Minimum-Cash-Flow Directed Graph Algorithm
            </Badge>
            <h3 className="text-xl sm:text-2xl font-bold text-foreground">
              How Settlo simplifies messy group debts
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
              In a trip with 4 friends, unoptimized calculations lead to endless criss-cross transfers. Settlo mathematically reduces total payments.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-muted/60 p-1 rounded-2xl border border-border/50 self-start sm:self-center">
            <button
              onClick={() => setIsSimplified(false)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                !isSimplified
                  ? "bg-background text-foreground shadow-sm border border-border/60"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Without Settlo (6 Transfers)
            </button>
            <button
              onClick={() => setIsSimplified(true)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isSimplified
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              With Settlo (2 Transfers) ✨
            </button>
          </div>
        </div>

        {/* Visual Graph Demonstration */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500 text-white font-black text-lg mx-auto flex items-center justify-center shadow-md shadow-emerald-500/20">
              A
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">Alex (Paid Villa)</div>
              <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                +₹9,000 Net Positive
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border/60 bg-card text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-sky-500 text-white font-black text-lg mx-auto flex items-center justify-center shadow-md">
              S
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">Sam</div>
              <div className="text-xs text-red-500 font-semibold mt-0.5">
                -₹3,000 Net Owed
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border/60 bg-card text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-purple-500 text-white font-black text-lg mx-auto flex items-center justify-center shadow-md">
              J
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">Jordan</div>
              <div className="text-xs text-red-500 font-semibold mt-0.5">
                -₹3,000 Net Owed
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl border border-border/60 bg-card text-center space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-amber-500 text-white font-black text-lg mx-auto flex items-center justify-center shadow-md">
              T
            </div>
            <div>
              <div className="font-bold text-sm text-foreground">Taylor</div>
              <div className="text-xs text-red-500 font-semibold mt-0.5">
                -₹3,000 Net Owed
              </div>
            </div>
          </div>
        </div>

        {/* Transfer Paths State */}
        <div className="p-4 rounded-2xl border border-border/60 bg-background/80 space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Resulting Transaction Graph:</span>
            <span className={isSimplified ? "text-emerald-600 font-bold" : "text-amber-600 font-bold"}>
              {isSimplified ? "2 Direct Payments (Optimized)" : "6 Messy Circular Payments"}
            </span>
          </div>

          {isSimplified ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                <span className="font-semibold text-foreground">Sam &amp; Jordan ➔ Alex</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">₹3,000 each</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                <span className="font-semibold text-foreground">Taylor ➔ Alex</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">₹3,000</span>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div className="p-2.5 rounded-lg border border-border bg-muted/30">Sam ➔ Jordan ₹1,000</div>
              <div className="p-2.5 rounded-lg border border-border bg-muted/30">Jordan ➔ Taylor ₹1,500</div>
              <div className="p-2.5 rounded-lg border border-border bg-muted/30">Taylor ➔ Sam ₹500</div>
              <div className="p-2.5 rounded-lg border border-border bg-muted/30">Sam ➔ Alex ₹2,500</div>
              <div className="p-2.5 rounded-lg border border-border bg-muted/30">Taylor ➔ Alex ₹4,000</div>
              <div className="p-2.5 rounded-lg border border-border bg-muted/30">Jordan ➔ Alex ₹2,500</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
