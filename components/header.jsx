"use client";

import React, { useState } from "react";
import { Button } from "./ui/button";
import { LayoutDashboard, Sparkles, Send } from "lucide-react";
import Link from "next/link";
import { SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useStoreUser } from "@/hooks/use-store-user";
import { BarLoader } from "react-spinners";
import { Authenticated, Unauthenticated } from "convex/react";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { QuickExpenseModal } from "@/components/ai/quick-expense-modal";
import { TelegramConnectModal } from "@/components/telegram/telegram-connect-modal";
import { CurrencySelector } from "@/components/currency-selector";

import { SettloLogo } from "@/components/settlo-logo";

export default function Header() {
  const { isLoading } = useStoreUser();
  const path = usePathname();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full border-b bg-white/95 dark:bg-slate-950/95 backdrop-blur z-50 supports-[backdrop-filter]:bg-white/70 dark:supports-[backdrop-filter]:bg-slate-950/70">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <SettloLogo size="default" />
        </Link>

        {path === "/" && (
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition"
            >
              How It Works
            </a>
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition"
            >
              Features
            </a>
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          <CurrencySelector />

          <Authenticated>
            <Link href="/dashboard">
              <Button
                variant="outline"
                className="hidden md:inline-flex items-center gap-2 hover:text-emerald-600 hover:border-emerald-600 transition text-xs font-semibold rounded-xl"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Button>
              <Button variant="ghost" className="md:hidden w-9 h-9 p-0">
                <LayoutDashboard className="h-4 w-4" />
              </Button>
            </Link>

            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9",
                  userButtonPopoverCard: "shadow-xl",
                  userPreviewMainIdentifier: "font-semibold",
                },
              }}
              afterSignOutUrl="/"
            />

            <QuickExpenseModal
              open={isAiModalOpen}
              onOpenChange={setIsAiModalOpen}
            />
          </Authenticated>

          <Unauthenticated>
            <SignInButton mode="modal">
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white border-none rounded-xl text-xs sm:text-sm font-semibold shadow-sm px-4">
                Get Started
              </Button>
            </SignInButton>
          </Unauthenticated>
        </div>
      </nav>
      {isLoading && <BarLoader width={"100%"} color="#36d7b7" />}
    </header>
  );
}
