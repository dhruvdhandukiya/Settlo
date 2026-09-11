"use client";

import React, { useState } from "react";
import { useCurrency } from "@/components/providers/currency-context";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ChevronDown, Globe, Search } from "lucide-react";

export function CurrencySelector({ className = "" }) {
  const { currency, currencyDetails, setCurrency, allCurrencies } = useCurrency();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCurrencies = allCurrencies.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.symbol.toLowerCase().includes(q)
    );
  });

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-9 px-2.5 rounded-xl border-border/80 bg-background/80 backdrop-blur-sm hover:bg-muted/60 text-xs font-semibold gap-1.5 shadow-sm transition-all ${className}`}
          title="Change Currency"
        >
          <span className="text-base leading-none">{currencyDetails.flag}</span>
          <span className="font-bold text-foreground">{currencyDetails.symbol}</span>
          <span className="text-muted-foreground text-[11px] font-mono hidden sm:inline">
            {currencyDetails.code}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground opacity-70 ml-0.5" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-72 p-2 rounded-2xl shadow-xl border bg-popover/95 backdrop-blur-md"
      >
        <div className="space-y-2">
          {/* Header & Search */}
          <div className="px-2 pt-1 pb-0.5 flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1.5 text-foreground">
              <Globe className="h-3.5 w-3.5 text-sky-500" />
              Select Currency
            </span>
            <span className="text-[10px] text-muted-foreground font-normal">
              Worldwide (20+)
            </span>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search currency, symbol, or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs rounded-lg border bg-muted/30 focus-visible:ring-1"
            />
          </div>

          {/* Currencies List */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 pr-1 text-xs">
            {filteredCurrencies.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                No currency found for "{search}"
              </div>
            ) : (
              filteredCurrencies.map((c) => {
                const isSelected = c.code === currency;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setCurrency(c.code);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl transition-colors text-left ${
                      isSelected
                        ? "bg-sky-500/15 text-sky-700 dark:text-sky-300 font-semibold"
                        : "hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-lg leading-none shrink-0">
                        {c.flag}
                      </span>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs">{c.code}</span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            ({c.symbol})
                          </span>
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">
                          {c.name}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
