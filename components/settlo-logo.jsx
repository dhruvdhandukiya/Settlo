"use client";

import React from "react";

export function SettloLogo({ className = "", showText = true, size = "default" }) {
  const iconSize = size === "large" ? "h-9 w-9" : size === "small" ? "h-6 w-6" : "h-7 w-7";
  const textSize = size === "large" ? "text-2xl" : size === "small" ? "text-lg" : "text-xl";

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Modern Gradient Icon Glyph */}
      <div className={`relative ${iconSize} flex items-center justify-center shrink-0`}>
        <svg
          viewBox="0 0 36 36"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_2px_10px_rgba(16,185,129,0.3)]"
        >
          <defs>
            <linearGradient id="settlo-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="50%" stopColor="#059669" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>
            <linearGradient id="settlo-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#34D399" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>

          {/* Background Rounded Shield / Tile */}
          <rect width="36" height="36" rx="10" fill="#0F172A" />
          
          {/* Outer Ring Border */}
          <rect
            x="0.5"
            y="0.5"
            width="35"
            height="35"
            rx="9.5"
            stroke="rgba(16,185,129,0.3)"
            strokeWidth="1"
          />

          {/* Interlocking Dynamic Split S Curves */}
          <path
            d="M24 12C24 10.3431 22.6569 9 21 9H14C11.7909 9 10 10.7909 10 13C10 15.2091 11.7909 17 14 17H22C24.2091 17 26 18.7909 26 21C26 23.2091 24.2091 25 22 25H14C12.3431 25 11 23.6569 11 22"
            stroke="url(#settlo-grad-1)"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Glowing Split Equilibrium Dots */}
          <circle cx="10.5" cy="13" r="1.75" fill="#34D399" />
          <circle cx="25.5" cy="21" r="1.75" fill="#10B981" />
          
          {/* Subtle Split Divider Notch */}
          <line
            x1="13"
            y1="17"
            x2="23"
            y2="17"
            stroke="#10B981"
            strokeWidth="1.5"
            strokeDasharray="2 2"
            opacity="0.8"
          />
        </svg>
      </div>

      {/* Brand Typography */}
      {showText && (
        <div className="flex items-baseline tracking-tight">
          <span className={`${textSize} font-black tracking-tight text-slate-900 dark:text-white`}>
            Settlo
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 ml-0.5 inline-block" />
        </div>
      )}
    </div>
  );
}
