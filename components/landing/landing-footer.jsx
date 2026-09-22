"use client";

import React from "react";
import Link from "next/link";
import { Globe } from "lucide-react";
import { useCurrency } from "@/components/providers/currency-context";
import { SettloLogo } from "@/components/settlo-logo";

export function LandingFooter() {
  const { currency, currencySymbol } = useCurrency();

  return (
    <footer className="w-full border-t border-border/60 bg-muted/20 py-12 px-4 mt-12 text-xs text-muted-foreground">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-8 mb-8">
        <div className="space-y-3">
          <SettloLogo size="default" />
          <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
            The multimodal AI expense engine for trips, roommates, and groups.
          </p>
          <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
            <Globe className="h-3.5 w-3.5 text-emerald-500" />
            <span>Active Currency: <strong className="text-foreground">{currency} ({currencySymbol})</strong></span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="font-bold text-foreground text-xs uppercase tracking-wider">Features</div>
          <ul className="space-y-1.5 text-xs">
            <li>
              <Link href="/expenses/new" className="hover:text-foreground transition">
                AI Quick Add
              </Link>
            </li>
            <li>
              <Link href="/expenses/new" className="hover:text-foreground transition">
                Receipt OCR Scanner
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-foreground transition">
                Real-Time Balances
              </Link>
            </li>
            <li>
              <Link href="/contacts" className="hover:text-foreground transition">
                Group Settlements
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="max-w-6xl mx-auto pt-6 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px]">
        <div>
          © {new Date().getFullYear()} Settlo. Built for frictionless group expense splitting.
        </div>
      </div>
    </footer>
  );
}
