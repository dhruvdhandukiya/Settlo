"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Bot, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingCta() {
  return (
    <section className="w-full max-w-5xl mx-auto py-16 px-4">
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-950 p-8 sm:p-14 text-white text-center shadow-2xl relative overflow-hidden space-y-6">
        <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-xs font-semibold text-emerald-100">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Stop calculating. Start settling.</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-2xl mx-auto">
          Split expenses with zero hassle today
        </h2>

        <p className="text-sm sm:text-base text-emerald-100/90 max-w-xl mx-auto leading-relaxed">
          Launch Settlo right in your browser or connect with Telegram to start logging shared expenses in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto bg-white text-emerald-950 hover:bg-emerald-50 font-bold shadow-lg gap-2 text-sm rounded-2xl h-12 px-6"
          >
            <Link href="/dashboard">
              <span>Open Settlo Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>

          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto border-white/30 bg-white/10 hover:bg-white/20 text-white font-semibold gap-2 text-sm rounded-2xl h-12 px-6 backdrop-blur-md"
          >
            <Link href="/dashboard?telegram=open">
              <Bot className="h-4 w-4" />
              <span>Connect on Telegram</span>
            </Link>
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 pt-4 text-xs text-emerald-100/80">
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
            100% Free Forever
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
            No Credit Card Needed
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />
            20+ Global Currencies
          </span>
        </div>
      </div>
    </section>
  );
}
