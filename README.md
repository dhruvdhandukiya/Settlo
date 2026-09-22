<div align="center">

# 💸 Settlo — The Intelligent Expense Engine

**One intelligent layer for your shared expenses. Split in natural language, voice notes, and instant receipt scans without the friction.**

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=flat&logo=react)](https://react.dev/)
[![Convex Reactive DB](https://img.shields.io/badge/Convex-1.46-orange?style=flat&logo=convex)](https://convex.dev/)
[![Google Gemini AI](https://img.shields.io/badge/Google_Gemini-Multimodal_AI-4285f4?style=flat&logo=google)](https://aistudio.google.com/)
[![Clerk Security](https://img.shields.io/badge/Clerk-Auth_%26_Security-6C47FF?style=flat&logo=clerk)](https://clerk.com/)
[![Three.js](https://img.shields.io/badge/Three.js-3D_WebGL-000000?style=flat&logo=three.js)](https://threejs.org/)
[![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-black?style=flat&logo=vercel)](https://vercel.com/)

---

### 🌐 [Live Production App](https://settlo-app.vercel.app) • 🤖 [Telegram Bot (@my_settlo_bot)](https://t.me/my_settlo_bot)

</div>

---

## 🚀 Key Superpowers & Features

### 1. 🤖 Multimodal AI Natural Language & Hinglish Engine
- **Conversational Parsing**: Type or speak naturally: *"Bhai CCD pe 450 bill aaya, maine pay kiya Alex aur mera 50-50"* or *"Flight tickets 12,000 paid by Alex split with Sam and Jordan"*.
- **Multimodal Receipt OCR**: Snap paper bills or restaurant receipts. Settlo automatically detects line items, tax, tip, and calculates exact per-person splits.
- **Voice Memo Audio Transcription**: Record audio notes on mobile or web and let Gemini parse payers and breakdown math.

### 2. 💳 Hardware-Accelerated 3D WebGL Obsidian Card
- Sleek obsidian metallic credit card built with **Three.js**, custom PBR shaders, dynamic clearcoat, gold EMV chip, and orbiting 3D currency tokens ($ / € / ₹ / £ / د.إ).
- Real-time mouse parallax, responsive viewport sizing, and universal cross-platform rendering across macOS, Windows, iOS, and Android.

### 3. ⚡ Real-Time Reactive Sync (<50ms)
- Built on **Convex reactive subscriptions** over WebSockets.
- Zero manual pull-to-refresh or polling: balances, expenses, and settlements update instantly across all member devices.

### 4. 🌐 Universal Multi-Currency Engine
- Instant 1-tap switching between ₹ INR, $ USD, € EUR, £ GBP, د.إ AED, C$ CAD, ¥ JPY, and more.
- Pixel-perfect vector country flag rendering on all operating systems.

### 5. 🧠 Minimum Cash Flow Debt Simplification
- Built-in graph algorithm that eliminates circular debt loops (e.g. if A owes B ₹500 and B owes C ₹500, Settlo simplifies it so A directly pays C once).

### 6. 💬 24/7 Telegram Bot Companion
- Manage expenses, log quick bills, and check balances on the go directly inside Telegram via `@my_settlo_bot`.

### 7. 📬 Customer Feedback & Inquiries Pipeline
- In-app feedback form connecting visitors and users directly to the Convex backend with instant Telegram alerts to the creator.

---

## 🏗️ Architecture & Tech Stack

```
                               ┌─────────────────────────────┐
                               │   Next.js 15 + React 19     │
                               │   (App Router & SSR Client) │
                               └──────────────┬──────────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    ▼                         ▼                         ▼
        ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
        │     Convex Cloud      │ │   Google Gemini AI    │ │     Clerk Auth        │
        │  Reactive WebSockets  │ │   Multimodal Parser   │ │   Session & Security  │
        │  Database & Functions │ │   (OCR & Audio Audio) │ │   User Identification │
        └───────────┬───────────┘ └───────────────────────┘ └───────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │   Telegram Bot API    │
        │ Webhook State Machine │
        └───────────────────────┘
```

- **Framework**: Next.js 15.5 (App Router), React 19
- **Database & Real-time Backend**: Convex 1.46
- **Artificial Intelligence**: Google Gemini Flash Multimodal API (`@google/generative-ai`)
- **Authentication**: Clerk (`@clerk/nextjs`)
- **3D Graphics**: Three.js (`three`)
- **Styling**: Tailwind CSS & Shadcn UI components
- **Icons & Flags**: Lucide React & FlagCDN Vector Assets
- **Deployment**: Vercel (Frontend & Webhooks) + Convex Cloud (Backend)

---

## 📁 Repository Structure

```
settlo/
├── app/
│   ├── (auth)/                # Clerk Sign-In & Sign-Up routes
│   ├── (main)/
│   │   ├── dashboard/         # Real-time analytics, balances & group ledger
│   │   ├── expenses/new/      # AI Quick Add, Receipt OCR & Manual Form
│   │   ├── contacts/          # Friends, contacts & group management
│   │   ├── groups/[id]/       # Group expense ledger & member settlements
│   │   └── person/[id]/       # 1-on-1 peer settlement view
│   ├── api/
│   │   ├── ai/parse-expense/  # Authenticated Gemini expense parsing
│   │   ├── ai/parse-public/   # Public playground Gemini parser
│   │   ├── feedback/          # Customer inquiry & feedback webhook
│   │   └── telegram/webhook/  # Telegram conversational bot webhook
│   ├── layout.js              # Global providers (Clerk, Convex, Currency)
│   └── page.jsx               # Landing page with 3D Obsidian Hero & Playground
├── components/
│   ├── landing/               # Hero 3D Card, Playground, Bento, Footer
│   ├── ai/                    # Quick Expense Modal, Receipt OCR Scanner
│   ├── telegram/              # Telegram linking & connection modals
│   ├── providers/             # Global Currency Context & State
│   ├── country-flag.jsx       # Cross-platform SVG vector flag component
│   ├── currency-selector.jsx  # Multi-currency dropdown selector
│   └── settlo-logo.jsx        # Custom vector brand logo
├── convex/
│   ├── schema.js              # Database schema (users, expenses, groups, feedback)
│   ├── expenses.js            # Expense creation & split math
│   ├── dashboard.js           # Real-time balance calculations
│   ├── feedback.js            # Inquiry submissions & query handlers
│   └── users.js               # User sync & currency persistence
└── lib/
    ├── ai/expense-parser.js   # Gemini prompt engineering & schema validation
    ├── currency.js            # Currency definitions & formatting logic
    └── telegram/              # Telegram client & bot state machine
```

---

## 🛠️ Getting Started Locally

### 1. Clone the Repository
```bash
git clone https://github.com/dhruvdhandukiya/Settlo.git
cd Settlo
```

### 2. Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 3. Set Up Environment Variables
Copy the template file to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your credentials in `.env.local`:
- **Convex**: Run `npx convex dev` to initialize your Convex cloud database.
- **Clerk**: Create a free project on [clerk.com](https://clerk.com) and copy your publishable & secret keys.
- **Gemini**: Obtain a free API key from [Google AI Studio](https://aistudio.google.com).
- **Telegram (Optional)**: Create a bot with `@BotFather` to enable conversational expense logging.

### 4. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🚢 Deployment

### Deploy to Vercel
1. Push your code to your GitHub repository (`main` branch).
2. Connect your repository on [Vercel](https://vercel.com).
3. Add the environment variables from `.env.local` to the Vercel Project Settings.
4. Deploy!

### Deploy Backend to Convex
```bash
npx convex deploy
```

### Connect Telegram Webhook
```bash
curl "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<YOUR_VERCEL_DOMAIN>/api/telegram/webhook"
```

---

## 📄 License
This project is licensed under the MIT License — feel free to use, customize, and build upon it!

---

<div align="center">
Made with ❤️ for frictionless group expense splitting.
</div>
