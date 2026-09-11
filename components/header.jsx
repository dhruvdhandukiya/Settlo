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

export default function Header() {
  const { isLoading } = useStoreUser();
  const path = usePathname();
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);

  return (
    <header className="fixed top-0 w-full border-b bg-white/95 backdrop-blur z-50 supports-[backdrop-filter]:bg-white/60">
      <nav className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src={"/logos/logo.png"}
            alt="Settlo Logo"
            width={200}
            height={400}
            className="h-22 w-auto object-contain"
          />
        </Link>

        {path === "/" && (
          <div className="hidden md:flex items-center gap-6">
            <Link
              href="#features"
              className="text-sm font-medium hover:text-green-600 transition"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium hover:text-green-600 transition"
            >
              How It Works
            </Link>
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-3">
          <CurrencySelector />

          <Authenticated>
            <Button
              variant="outline"
              onClick={() => setIsTelegramModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 border-sky-500/30 text-sky-700 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/30 transition text-xs font-semibold"
            >
              <Send className="h-3.5 w-3.5 text-sky-600" />
              Telegram Bot
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsTelegramModalOpen(true)}
              className="sm:hidden w-9 h-9 p-0 text-sky-600"
              title="Telegram Bot"
            >
              <Send className="h-4 w-4" />
            </Button>

            <Link href="/dashboard">
              <Button
                variant="outline"
                className="hidden md:inline-flex items-center gap-2 hover:text-green-600 hover:border-green-600 transition"
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

            <TelegramConnectModal
              open={isTelegramModalOpen}
              onOpenChange={setIsTelegramModalOpen}
            />
          </Authenticated>

          <Unauthenticated>
            <SignInButton>
              <Button variant="ghost">Sign In</Button>
            </SignInButton>

            <SignUpButton>
              <Button className="bg-green-600 hover:bg-green-700 border-none">
                Get Started
              </Button>
            </SignUpButton>
          </Unauthenticated>
        </div>
      </nav>
      {isLoading && <BarLoader width={"100%"} color="#36d7b7" />}
    </header>
  );
}
