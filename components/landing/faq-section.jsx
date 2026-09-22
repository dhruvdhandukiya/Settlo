"use client";

import React, { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FAQS = [
  {
    q: "Is Settlo really 100% free to use?",
    a: "Yes. All core features—including unlimited AI receipt scanning (OCR), Hinglish expense parsing, voice memo logging, group debt simplification, and Telegram bot integration—are completely free with zero subscription paywalls or hidden charges.",
  },
  {
    q: "How does the Telegram Bot keep my expenses private?",
    a: "The Settlo bot only receives messages sent directly to it in your private 1-on-1 chat or when explicitly linked. We do not read your other Telegram chats. Linking takes 2 seconds using a secure one-time 6-digit pairing code.",
  },
  {
    q: "Can I log expenses in Hinglish or informal slang?",
    a: "Absolutely! Our Gemini-powered AI engine was explicitly tuned to understand Indian English, Hinglish, and colloquial phrasing (e.g. 'Bhai CCD pe 450 bill aaya, maine pay kiya Alex aur mera aadha aadha split kar'). It automatically extracts payer, amount, items, and splits.",
  },
  {
    q: "How does Multi-Currency work for international trips?",
    a: "Settlo supports worldwide currencies including ₹ INR, $ USD, € EUR, £ GBP, AED, $ CAD, ¥ JPY, and more. You can switch your preferred display currency anytime in 1 tap from the top navigation header.",
  },
  {
    q: "What makes the real-time sync faster than other apps?",
    a: "Unlike legacy apps that rely on periodic background polling or require manual pull-to-refresh, Settlo is built on Convex reactive WebSocket subscriptions. The moment a friend logs an expense or confirms a settlement, balances across all devices update within 50 milliseconds.",
  },
  {
    q: "How does debt simplification work?",
    a: "Settlo uses a Minimum-Cash-Flow graph algorithm. If Person A owes Person B ₹500, and Person B owes Person C ₹500, the system collapses the loop so Person A pays Person C directly in one single transaction.",
  },
];

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState(0);

  return (
    <section className="w-full max-w-4xl mx-auto py-16 px-4">
      <div className="text-center space-y-3 mb-12">
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
          <HelpCircle className="h-3.5 w-3.5 mr-1.5" />
          Frequently Asked Questions
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
          Everything you need to know
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
          Honest answers to common questions about privacy, features, and how Settlo works.
        </p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIdx === idx;
          return (
            <div
              key={idx}
              className="rounded-2xl border border-border/60 bg-card/80 dark:bg-card/40 backdrop-blur-xl overflow-hidden transition-all"
            >
              <button
                onClick={() => setOpenIdx(isOpen ? null : idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform duration-200 text-muted-foreground ${
                    isOpen ? "rotate-180 text-emerald-500" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-5 sm:px-5 sm:pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-3">
                  {faq.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
