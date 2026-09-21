"use client";

import React from "react";
import { Check, X, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COMPARISONS = [
  {
    feature: "Receipt Item Scanning (OCR)",
    settlo: "100% Free & Unlimited (Gemini Flash 2.5)",
    splitwise: "Locked behind $39.99/yr Pro Subscription",
  },
  {
    feature: "Telegram Bot Integration",
    settlo: "Native 1-tap bot with inline callback buttons",
    splitwise: "Not available",
  },
  {
    feature: "Hinglish & Regional Dialect Parsing",
    settlo: "Native code-mixed slang understanding",
    splitwise: "English / rigid keyword syntax only",
  },
  {
    feature: "Voice Memo Audio Logging",
    settlo: "Direct audio transcription & expense commit",
    splitwise: "Not available",
  },
  {
    feature: "Multi-Currency Global Support",
    settlo: "20+ Currencies (₹, $, €, £, د.إ) with live toggle",
    splitwise: "Limited / Rigid base currency changes",
  },
  {
    feature: "Real-Time WebSocket Sync",
    settlo: "Sub-50ms reactive sync via Convex",
    splitwise: "Periodic polling & manual pull-to-refresh",
  },
  {
    feature: "Ads & Aggressive Upsells",
    settlo: "Zero ads, clean privacy-first UI",
    splitwise: "Banner ads & frequent Pro upgrade modals",
  },
];

export function ComparisonMatrix() {
  return (
    <section className="w-full max-w-5xl mx-auto py-16 px-4">
      <div className="text-center space-y-3 mb-12">
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
          Honest Feature Comparison
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
          Why we built Settlo vs. Legacy Splitwise
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
          An objective look at how modern AI and real-time reactive architecture compare to legacy expense trackers.
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-border/60 bg-card/80 dark:bg-card/50 backdrop-blur-xl shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/40">
                <th className="p-4 sm:p-5 font-bold text-foreground">Capability</th>
                <th className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5">
                  ✨ Settlo
                </th>
                <th className="p-4 sm:p-5 font-bold text-muted-foreground">
                  Legacy Splitwise
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {COMPARISONS.map((row, idx) => (
                <tr key={idx} className="hover:bg-muted/20 transition-colors">
                  <td className="p-4 sm:p-5 font-semibold text-foreground">
                    {row.feature}
                  </td>
                  <td className="p-4 sm:p-5 bg-emerald-500/5 font-medium text-emerald-950 dark:text-emerald-300">
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        <Check className="h-3 w-3" />
                      </div>
                      <span>{row.settlo}</span>
                    </div>
                  </td>
                  <td className="p-4 sm:p-5 text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-500">
                        <X className="h-3 w-3" />
                      </div>
                      <span>{row.splitwise}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
