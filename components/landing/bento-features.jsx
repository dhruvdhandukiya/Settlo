"use client";

import React from "react";
import { Sparkles, Camera, GitMerge, Globe2, Zap, CheckCircle2 } from "lucide-react";
import { CountryFlag } from "@/components/country-flag";

export function BentoFeatures() {
  return (
    <section className="w-full max-w-6xl mx-auto py-16 px-4">
      <div className="text-center space-y-3 mb-12">
        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-foreground">
          Built for precision, speed &amp; zero friction
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
          Every layer of Settlo was engineered to eliminate manual spreadsheets, awkward bill calculations and paywalls.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Gemini Multimodal Parser */}
        <div className="lg:col-span-2 rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card/80 to-emerald-500/5 p-6 sm:p-8 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">
            <Sparkles className="h-4 w-4" />
            <span>AI Multimodal Engine</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
            Multimodal OCR, Voice Memos &amp; Hinglish Slang
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xl mb-6">
            Powered by Google Gemini with structured JSON output schema enforcement. Understands messy paper receipts, regional dialects, and complex uneven splits.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 text-xs space-y-1">
              <div className="font-semibold text-foreground">🎙️ Direct Audio</div>
              <div className="text-muted-foreground text-[11px]">Voice memos parsed natively without manual typing.</div>
            </div>
            <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 text-xs space-y-1">
              <div className="font-semibold text-foreground">📸 Vision OCR</div>
              <div className="text-muted-foreground text-[11px]">Multi-item receipt breakdown &amp; tax detection.</div>
            </div>
            <div className="p-3 rounded-2xl bg-muted/40 border border-border/50 text-xs space-y-1">
              <div className="font-semibold text-foreground">🇮🇳 Hinglish Slang</div>
              <div className="text-muted-foreground text-[11px]">"CCD ka bill aadha aadha split kar" just works.</div>
            </div>
          </div>
        </div>

        {/* Card 2: Vision OCR Receipt Scanning */}
        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card/80 to-purple-500/5 p-6 sm:p-8 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-3">
              <Camera className="h-4 w-4" />
              <span>Vision OCR Scanner</span>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Itemized Receipt OCR
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Snap paper bills or restaurant receipts. Settlo automatically detects line items, tax, tip, and calculates exact per-person splits.
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-xs font-mono text-purple-900 dark:text-purple-300">
            🧾 1-click camera scan &amp; item breakdown
          </div>
        </div>

        {/* Card 3: Minimum Cash Flow Graph Simplification */}
        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card/80 to-amber-500/5 p-6 sm:p-8 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-3">
              <GitMerge className="h-4 w-4" />
              <span>Graph Algorithm</span>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Smart Debt Simplification
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Eliminates circular debt loops. If A owes B ₹500 and B owes C ₹500, Settlo simplifies it so A directly pays C once.
            </p>
          </div>

          <div className="flex items-center justify-between text-xs p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 font-medium text-amber-800 dark:text-amber-300">
            <span>6 Multi-transfers</span>
            <span>➔</span>
            <strong className="text-emerald-600 dark:text-emerald-400">2 Direct Payments</strong>
          </div>
        </div>

        {/* Card 4: 20+ Currencies */}
        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card/80 to-purple-500/5 p-6 sm:p-8 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-3">
              <Globe2 className="h-4 w-4" />
              <span>Multi-Currency Engine</span>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Global Currencies
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Instant 1-tap switching between ₹ INR, $ USD, € EUR, £ GBP, AED, $ CAD, ¥ JPY with localized formatting and persistence.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 text-xs font-mono">
            {[
              { code: "INR", label: "₹ INR" },
              { code: "USD", label: "$ USD" },
              { code: "EUR", label: "€ EUR" },
              { code: "GBP", label: "£ GBP" },
              { code: "AED", label: "AED" },
            ].map((c, i) => (
              <span key={i} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted/60 border border-border/50 text-foreground">
                <CountryFlag code={c.code} className="w-3.5 h-2.5 rounded-[2px]" />
                <span>{c.label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Card 5: Real-Time Sync (<50ms) */}
        <div className="rounded-3xl border border-border/60 bg-gradient-to-br from-card via-card/80 to-emerald-500/5 p-6 sm:p-8 backdrop-blur-xl shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-3">
              <Zap className="h-4 w-4" />
              <span>Reactive Database</span>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              Real-Time WebSocket Sync
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Built on Convex reactive subscriptions. Zero polling or manual pull-to-refresh. Balances update across all devices under 50ms.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            <CheckCircle2 className="h-4 w-4" />
            <span>Instant live sync across web &amp; Telegram</span>
          </div>
        </div>
      </div>
    </section>
  );
}
