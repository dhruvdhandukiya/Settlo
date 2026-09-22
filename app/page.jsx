"use client";

import React from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const Hero3DCard = dynamic(
  () => import("@/components/landing/hero-3d-card").then((m) => m.Hero3DCard),
  {
    ssr: false,
    loading: () => (
      <div className="relative w-full min-h-[440px] h-[440px] sm:h-[480px] lg:h-[520px] flex items-center justify-center select-none">
        <div className="w-[300px] sm:w-[340px] h-[185px] sm:h-[205px] rounded-3xl bg-slate-900/90 border border-emerald-500/30 shadow-2xl p-6 flex flex-col justify-between backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">TOTAL BALANCE</span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-black text-white">$8,420.51</div>
            <div className="text-[11px] text-emerald-400/80 font-medium">+₹3,200.00 from Alex • Settled in real-time</div>
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>•••• 4829</span>
            <div className="flex items-center gap-1">
              <span className="font-bold text-white text-xs">Settlo</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </div>
          </div>
        </div>
      </div>
    ),
  }
);

import { InteractivePlayground } from "@/components/landing/interactive-playground";
import { BentoFeatures } from "@/components/landing/bento-features";
import { DebtGraphVisualizer } from "@/components/landing/debt-graph-visualizer";
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
              One intelligent layer for your shared expenses. Split in natural language, voice notes, and instant receipt scans without the friction.
            </p>

            {/* Primary Action */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                asChild
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm h-12 px-7 rounded-2xl shadow-lg shadow-emerald-600/20 gap-2 cursor-pointer transition-all hover:scale-[1.02]"
              >
                <Link href="/dashboard">
                  <span>Launch Web App</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Right Column: Real Three.js 3D WebGL Card Canvas */}
          <div className="lg:col-span-6 relative">
            <Hero3DCard />
          </div>
        </div>
      </section>

      {/* ───── Live Interactive AI Split Playground (How It Works) ───── */}
      <section id="how-it-works" className="py-12 px-4 scroll-mt-20">
        <InteractivePlayground />
      </section>

      {/* ───── Technical Bento Grid (Features) ───── */}
      <section id="features" className="scroll-mt-20">
        <BentoFeatures />
      </section>

      {/* ───── Debt Graph Algorithm Visualizer ───── */}
      <DebtGraphVisualizer />

      {/* ───── Frequently Asked Questions ───── */}
      <FaqSection />

      {/* ───── Call to Action ───── */}
      <LandingCta />

      {/* ───── Modern Footer ───── */}
      <LandingFooter />
    </div>
  );
}
