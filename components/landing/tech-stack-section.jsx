"use client";

import React from "react";
import { Code2, Database, Cpu, MessageSquare, ShieldCheck, Box } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STACK_ITEMS = [
  {
    name: "Next.js 15",
    role: "App Router & Fullstack Frontend",
    description: "Turbopack-powered SSR & client components for instant page loads and seamless routing.",
    icon: Code2,
    badge: "v15.2",
  },
  {
    name: "Convex",
    role: "Reactive Real-Time Backend & DB",
    description: "End-to-end type safety, reactive WebSocket document subscriptions, and zero polling overhead.",
    icon: Database,
    badge: "Reactive DB",
  },
  {
    name: "Google Gemini Flash 2.5",
    role: "Multimodal AI Engine",
    description: "Sub-second OCR vision, direct audio transcription, and structured JSON schema validation.",
    icon: Cpu,
    badge: "Multimodal AI",
  },
  {
    name: "Telegram Bot API",
    role: "Conversational Expense Interface",
    description: "Secure webhook pipeline, interactive callback keyboards, and cross-channel dedup guards.",
    icon: MessageSquare,
    badge: "Bot API",
  },
  {
    name: "Three.js & WebGL",
    role: "Hardware-Accelerated 3D",
    description: "60fps 3D graphics rendering with PBR shaders, dynamic lighting, and mouse gyro parallax.",
    icon: Box,
    badge: "3D WebGL",
  },
  {
    name: "Clerk Authentication",
    role: "Identity & Session Security",
    description: "Multi-factor authentication, secure token exchange, and encrypted user data isolation.",
    icon: ShieldCheck,
    badge: "Security",
  },
];

export function TechStackSection() {
  return (
    <section className="w-full max-w-6xl mx-auto py-16 px-4">
      <div className="text-center space-y-3 mb-12">
        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">
          <Code2 className="h-3.5 w-3.5 mr-1.5" />
          Technical Stack &amp; Architecture
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground">
          Built on a modern, high-performance stack
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">
          Engineered for sub-50ms latency, zero-lag reactive sync, and high AI throughput.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {STACK_ITEMS.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="p-6 rounded-3xl border border-border/60 bg-card/70 dark:bg-card/40 backdrop-blur-xl shadow-md hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/60">
                  {item.badge}
                </span>
              </div>

              <div>
                <h4 className="font-bold text-base text-foreground">{item.name}</h4>
                <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  {item.role}
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
