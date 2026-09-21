"use client";

import React, { useState } from "react";
import { Send, Mic, Camera, Check, Bot, Sparkles, MessageSquare, Volume2, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MODES = [
  {
    id: "hinglish",
    icon: MessageSquare,
    title: "Hinglish & Slang Chat",
    subtitle: "Text naturally like you talk to your friends",
    userMessage: "Bhai CCD pe 450 bill aaya, maine pay kiya Alex aur mera aadha aadha split kar",
    mediaType: "text",
    botReply: {
      title: "Expense Parsed by Settlo AI",
      item: "CCD Cafe",
      total: "₹450.00",
      category: "foodDrink",
      paidBy: "You",
      splits: [
        { name: "You", amount: "₹225.00", status: "✅ (Payer)" },
        { name: "Alex", amount: "₹225.00", status: "⏳ (Owes You)" },
      ],
    },
  },
  {
    id: "voice",
    icon: Mic,
    title: "Voice Memo Audio",
    subtitle: "Record a 5-second audio note while leaving the venue",
    userMessage: "Voice memo (0:05)",
    mediaType: "voice",
    audioDuration: "0:05",
    transcript: '"Dinner at Taj 1200 rupees, paid by me, Alex and Sam share equal"',
    botReply: {
      title: "Audio Transcribed & Parsed",
      item: "Dinner at Taj",
      total: "₹1,200.00",
      category: "foodDrink",
      paidBy: "You",
      splits: [
        { name: "You", amount: "₹400.00", status: "✅ (Payer)" },
        { name: "Alex", amount: "₹400.00", status: "⏳ (Owes You)" },
        { name: "Sam", amount: "₹400.00", status: "⏳ (Owes You)" },
      ],
    },
  },
  {
    id: "receipt",
    icon: Camera,
    title: "Receipt Photo OCR",
    subtitle: "Snap any printed restaurant bill or digital screenshot",
    userMessage: "Photo (1 receipt attached)",
    mediaType: "photo",
    photoCaption: "🧾 Taj_Resort_Bill.jpg (₹18,000.00)",
    botReply: {
      title: "Receipt OCR Analyzed (4 Line Items)",
      item: "Taj Resort & Dining",
      total: "₹18,000.00",
      category: "trips",
      paidBy: "You",
      splits: [
        { name: "You", amount: "₹6,000.00", status: "✅ (Payer)" },
        { name: "Alex", amount: "₹6,000.00", status: "⏳ (Owes You)" },
        { name: "Sam", amount: "₹6,000.00", status: "⏳ (Owes You)" },
      ],
    },
  },
];

export function TelegramShowcase() {
  const [activeMode, setActiveMode] = useState(MODES[0]);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const handleModeChange = (mode) => {
    setActiveMode(mode);
    setIsConfirmed(false);
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      <div className="text-center space-y-3 mb-10">
        <Badge variant="outline" className="bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20">
          <Bot className="h-3.5 w-3.5 mr-1.5" />
          Native Telegram AI Bot Companion
        </Badge>
        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          Log expenses anywhere, anytime — right inside Telegram
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base max-w-2xl mx-auto">
          No need to open a web browser while paying at the checkout. Text in English or Hinglish, send a voice memo, or snap a photo of the bill.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Interactive Tabs */}
        <div className="lg:col-span-5 space-y-3">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isSelected = activeMode.id === mode.id;
            return (
              <div
                key={mode.id}
                onClick={() => handleModeChange(mode)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? "bg-sky-500/10 border-sky-500/40 shadow-[0_8px_30px_rgb(14,165,233,0.12)] scale-[1.02]"
                    : "bg-card/60 hover:bg-card/90 border-border/60 text-muted-foreground"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold transition-all ${
                      isSelected
                        ? "bg-sky-500 text-white shadow-md shadow-sky-500/30"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4
                      className={`text-sm font-bold transition-colors ${
                        isSelected ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {mode.title}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {mode.subtitle}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="p-4 rounded-2xl bg-muted/30 border border-border/40 text-xs space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-foreground">
              <Shield className="h-4 w-4 text-emerald-500" />
              1-Tap Deep Link Pairing
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Connect your account securely in 2 seconds with a 6-digit code. Zero passwords or bank logins required.
            </p>
          </div>
        </div>

        {/* Right Mobile Phone Simulation */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-sm rounded-[36px] border-[6px] border-border bg-slate-950 p-3 shadow-2xl relative overflow-hidden">
            <div className="w-28 h-4 bg-border rounded-b-xl mx-auto mb-2" />

            {/* Telegram Header */}
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-slate-900/90 rounded-t-2xl">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-white font-bold text-xs shadow-md">
                  <Bot className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1">
                    Settlo Expense Bot
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  </div>
                  <div className="text-[10px] text-slate-400">@my_settlo_bot • bot</div>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] bg-sky-500/10 text-sky-400 border-sky-500/30">
                Verified
              </Badge>
            </div>

            {/* Chat Body */}
            <div className="p-3 space-y-3 min-h-[340px] bg-gradient-to-b from-slate-950 to-slate-900/90 text-xs text-white flex flex-col justify-end">
              {/* User Message Bubble */}
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-sky-600 px-3.5 py-2.5 text-white shadow-md space-y-1">
                  {activeMode.mediaType === "voice" && (
                    <div className="flex items-center gap-2 bg-sky-700/60 px-2 py-1 rounded-lg">
                      <Volume2 className="h-4 w-4 animate-pulse" />
                      <div className="flex-1 flex items-center gap-0.5">
                        <span className="h-2 w-1 bg-white rounded-full" />
                        <span className="h-4 w-1 bg-white rounded-full" />
                        <span className="h-3 w-1 bg-white rounded-full" />
                        <span className="h-5 w-1 bg-white rounded-full" />
                        <span className="h-2 w-1 bg-white rounded-full" />
                        <span className="h-4 w-1 bg-white rounded-full" />
                        <span className="h-1 w-1 bg-white rounded-full" />
                      </div>
                      <span className="text-[10px] opacity-80">{activeMode.audioDuration}</span>
                    </div>
                  )}

                  {activeMode.mediaType === "photo" && (
                    <div className="flex items-center gap-1.5 bg-sky-700/60 px-2 py-1.5 rounded-lg text-[11px]">
                      <Camera className="h-3.5 w-3.5" />
                      <span>{activeMode.photoCaption}</span>
                    </div>
                  )}

                  <div className="text-xs leading-relaxed">{activeMode.userMessage}</div>
                  <div className="text-[9px] text-sky-200 text-right">10:42 AM ✓✓</div>
                </div>
              </div>

              {/* Bot Response Bubble */}
              <div className="flex justify-start">
                <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-slate-800/90 border border-white/10 p-3 text-slate-100 shadow-lg space-y-2">
                  <div className="flex items-center gap-1.5 text-sky-400 font-bold text-[11px]">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{activeMode.botReply.title}</span>
                  </div>

                  <div className="border-t border-white/10 pt-1.5 space-y-1 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-400">📌 Description:</span>
                      <span className="font-semibold text-white">{activeMode.botReply.item}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">💰 Total:</span>
                      <span className="font-bold text-emerald-400">{activeMode.botReply.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">💳 Paid By:</span>
                      <span className="text-white">{activeMode.botReply.paidBy}</span>
                    </div>
                  </div>

                  {/* Splits */}
                  <div className="bg-slate-900/80 rounded-lg p-2 space-y-1 text-[10px]">
                    <div className="font-semibold text-slate-400">📊 Split Breakdown:</div>
                    {activeMode.botReply.splits.map((s, idx) => (
                      <div key={idx} className="flex justify-between text-slate-300">
                        <span>• {s.name}: {s.amount}</span>
                        <span>{s.status}</span>
                      </div>
                    ))}
                  </div>

                  {/* Interactive Inline Buttons */}
                  {isConfirmed ? (
                    <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-center text-[11px] font-semibold flex items-center justify-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                      <span>Saved to Settlo Web &amp; Balances Updated!</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      <button
                        onClick={() => setIsConfirmed(true)}
                        className="py-1.5 px-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow cursor-pointer active:scale-95"
                      >
                        Confirm 💾
                      </button>
                      <button
                        onClick={() => setIsConfirmed(false)}
                        className="py-1.5 px-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium text-[11px] transition cursor-pointer"
                      >
                        Cancel ❌
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Simulated Chat Input Bar */}
            <div className="p-2 border-t border-white/10 bg-slate-900 flex items-center gap-2 rounded-b-2xl">
              <input
                disabled
                placeholder="Message @my_settlo_bot..."
                className="bg-slate-800 text-slate-400 text-xs px-3 py-1.5 rounded-full flex-1 outline-none"
              />
              <div className="h-7 w-7 rounded-full bg-sky-500 flex items-center justify-center text-white">
                <Send className="h-3.5 w-3.5" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
