"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, Bot, Sparkles, Mic, Camera, Zap, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Hero3DCard = dynamic(
  () => import("@/components/landing/hero-3d-card").then((m) => m.Hero3DCard),
  { ssr: false }
);

import { InteractivePlayground } from "@/components/landing/interactive-playground";
import { TelegramShowcase } from "@/components/landing/telegram-showcase";
import { BentoFeatures } from "@/components/landing/bento-features";
import { DebtGraphVisualizer } from "@/components/landing/debt-graph-visualizer";
import { ComparisonMatrix } from "@/components/landing/comparison-matrix";
import { TechStackSection } from "@/components/landing/tech-stack-section";
import { FaqSection } from "@/components/landing/faq-section";
import { LandingCta } from "@/components/landing/landing-cta";
import { LandingFooter } from "@/components/landing/landing-footer";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen pt-4 overflow-x-hidden bg-background text-foreground">
      {/* ───── Hero Section: Obsidian 3D Grid ───── */}
      <section className="relative pt-8 pb-14 px-4 sm:px-6 lg:px-8 border-b border-border/40">
        {/* Subtle dot matrix grid background */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.07] pointer-events-none -z-10"
          style={{
            backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Bold Typography & Value Hook */}
          <div className="lg:col-span-6 space-y-6 text-left">
            {/* Top Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>THE INTELLIGENT EXPENSE ENGINE</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tighter text-foreground leading-[0.95]">
              Money,
              <br />
              <span className="text-emerald-600 dark:text-emerald-400">settled.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-lg">
              One intelligent layer for your shared expenses. Split in Hinglish, voice notes, or directly inside Telegram without the friction.
            </p>

            {/* Dual CTAs (Real working links, no fake waitlists) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Button
                asChild
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm h-12 px-6 rounded-2xl shadow-lg shadow-emerald-600/20 gap-2 cursor-pointer"
              >
                <Link href="/dashboard">
                  <span>Launch Web App</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-border/80 hover:bg-muted/80 text-foreground font-semibold text-sm h-12 px-6 rounded-2xl gap-2 backdrop-blur-md cursor-pointer"
              >
                <Link href="/dashboard?telegram=open">
                  <Bot className="h-4 w-4 text-sky-500" />
                  <span>Connect Telegram Bot ↗</span>
                </Link>
              </Button>
            </div>

            {/* Honest Status Note (Zero fake avatars/fake waitlists) */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1 font-medium">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              <span>100% Free &amp; Open Beta • Zero ads • No credit card required</span>
            </div>
          </div>

          {/* Right Column: Real Three.js 3D WebGL Card Canvas */}
          <div className="lg:col-span-6 relative">
            <Hero3DCard />
          </div>
        </div>

        {/* ───── 3 Bottom Capability Feature Cards (as seen in design) ───── */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mt-12 pt-8 border-t border-border/40">
          <div className="p-4 rounded-2xl bg-card/60 dark:bg-card/30 border border-border/60 backdrop-blur-md flex items-start gap-3.5 hover:border-emerald-500/30 transition-all">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Zap className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Instantly smart</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Every transaction understood with Gemini multimodal AI.
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-card/60 dark:bg-card/30 border border-border/60 backdrop-blur-md flex items-start gap-3.5 hover:border-emerald-500/30 transition-all">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <Mic className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Just say it</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Record a voice memo in plain English or Hinglish.
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-card/60 dark:bg-card/30 border border-border/60 backdrop-blur-md flex items-start gap-3.5 hover:border-emerald-500/30 transition-all">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Camera className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-bold text-foreground">Point &amp; settle</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                Scan. Split. Done. Zero math headaches.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ───── Live Interactive AI Split Playground ───── */}
      <section className="py-12 px-4">
        <InteractivePlayground />
      </section>

      {/* ───── Telegram Bot 24/7 Companion Showcase ───── */}
      <section className="py-12 px-4 bg-muted/10 border-y border-border/40">
        <TelegramShowcase />
      </section>

      {/* ───── Technical Bento Grid ───── */}
      <BentoFeatures />

      {/* ───── Debt Graph Algorithm Visualizer ───── */}
      <DebtGraphVisualizer />

      {/* ───── Honest Feature Comparison Matrix ───── */}
      <ComparisonMatrix />

      {/* ───── Tech Stack & Architecture Transparency ───── */}
      <TechStackSection />

      {/* ───── Frequently Asked Questions ───── */}
      <FaqSection />

      {/* ───── Call to Action ───── */}
      <LandingCta />

      {/* ───── Modern Footer ───── */}
      <LandingFooter />
    </div>
  );
}
