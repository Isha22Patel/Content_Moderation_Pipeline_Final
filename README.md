# 🛡️ Content Moderation Pipeline

An AI-powered, multi-stage content moderation system built with **Next.js 16**, **Prisma**, and **Groq (LLaMA 3.3 70B)**. It classifies user-generated content across 7 harm categories with full context awareness, applies configurable per-platform policies, and routes decisions through an explainable human-in-the-loop review workflow.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| **LLM-Powered Classification** | Uses Groq's LLaMA 3.3 70B (configurable) to analyse content against 7 harm categories with confidence scores and severity levels. |
| **Context-Aware Analysis** | The same text can be flagged differently depending on platform, surface (e.g. gaming lobby vs. DM), author history, and conversation thread. |
| **Per-Platform Policy Engine** | Each platform (General, Gaming, Kids, Educational) has independent category toggles, review thresholds, and auto-block thresholds. |
| **Custom Keyword Rules** | Substring-match rules that override model confidence — useful for zero-tolerance phrases or brand-specific terms. |
| **Human Review Queue** | Borderline content is routed to a reviewer workspace with full AI reasoning, highlighted offending spans, and one-click decisions. |
| **Explainability** | Every decision includes per-flag reasoning, context notes, confidence bars, and a human-readable decision summary. |
| **Feedback Loop** | Human overrides are recorded and surfaced via the `/api/feedback` endpoint, enabling future model fine-tuning. |
| **Dashboard & Analytics** | Real-time stats: total processed, auto-allowed, auto-blocked, pending review, AI/human agreement rate. |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Next.js App (App Router)                 │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────────┐   │
│  │ /moderate │  │/dashboard│  │ /review  │  │  /policies    │   │
│  │  (Submit) │  │ (Stats)  │  │ (Queue)  │  │  (Settings)   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └───────┬───────┘   │
│       │              │             │                │           │
│  ─────┴──────────────┴─────────────┴────────────────┴─────────  │
│                         API Routes (/api/*)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐    │
│  │/moderate │  │ /stats   │  │/queue/*  │  │/policies/*   │    │
│  │(classify)│  │          │  │(review)  │  │(CRUD)        │    │
│  └────┬─────┘  └──────────┘  └──────────┘  └──────────────┘    │
│       │                                                         │
│  ┌────▼──────────────────────────────────────────────────────┐  │
│  │                     Core Engine (lib/)                     │  │
│  │  ┌─────────────┐  ┌────────────────┐  ┌───────────────┐   │  │
│  │  │  Classifier  │  │ Policy Engine  │  │  Groq Client  │   │  │
│  │  │ (LLM calls)  │→│ (thresholds +  │  │  (SDK wrapper) │   │  │
│  │  │              │  │  custom rules) │  │               │   │  │
│  │  └──────────────┘  └────────────────┘  └───────────────┘   │  │
│  └────────────────────────────────────────────────────────────┘  │
│                              │                                  │
│  ┌───────────────────────────▼──────────────────────────────┐   │
│  │              PostgreSQL (via Prisma ORM)                  │   │
│  │  Platforms · CategoryPolicies · CustomRules               │   │
│  │  ContentRecords · ReviewOutcomes                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Moderation Flow

1. **Content submitted** via `POST /api/moderate` with text + context (platform, surface, author history, thread).
2. **Classifier** sends the content + context to Groq LLaMA 3.3 70B with a detailed system prompt. The model returns per-category flags with confidence, severity, segment, and reasoning.
3. **Policy Engine** loads the platform's policy from the database and applies threshold-based decisions:
   - `confidence >= autoActionThreshold` → **auto-block**
   - `confidence >= reviewThreshold` → **human review**
   - `confidence < reviewThreshold` → **auto-allow**
4. **Custom rules** are evaluated next — substring matches override model confidence.
5. The **most severe** per-flag action wins as the aggregate decision.
6. The full record (content, flags, reasoning, decision) is **persisted** to PostgreSQL.
7. If routed to `human_review`, the record appears in the **Review Queue** for a moderator to make the final call.

---

## 🗂️ Project Structure

```
content-moderation-next/
├── app/
│   ├── api/
│   │   ├── categories/route.ts    # GET — list harm categories
│   │   ├── feedback/route.ts      # GET — human override records (for model improvement)
│   │   ├── health/route.ts        # GET — system health check (DB + Groq status)
│   │   ├── moderate/route.ts      # POST — main moderation endpoint
│   │   ├── policies/
│   │   │   ├── route.ts           # GET — list all platform policies
│   │   │   └── [id]/route.ts      # PUT — update a specific platform policy
│   │   ├── queue/route.ts         # GET — pending human review items
│   │   ├── records/route.ts       # GET — all moderation records
│   │   └── stats/route.ts         # GET — dashboard statistics
│   ├── dashboard/page.tsx         # 📊 Real-time analytics dashboard
│   ├── moderate/page.tsx          # 🔍 Content submission + classification UI
│   ├── policies/page.tsx          # ⚙️ Per-platform policy configuration
│   ├── review/page.tsx            # 👥 Human review queue workspace
│   ├── queue/                     # Queue page directory
│   ├── globals.css                # Design system + all component styles
│   ├── layout.tsx                 # Root layout with navbar
│   └── page.tsx                   # Home (redirects to dashboard)
├── components/
│   ├── FlagCard.tsx               # Per-category flag display with confidence bar
│   ├── Navbar.tsx                 # Top navigation bar
│   ├── RoutingBadge.tsx           # Routing/action status badges
│   └── StatCard.tsx               # Dashboard stat card
├── lib/
│   ├── api.ts                     # Client-side API helper (fetch wrappers)
│   ├── database/
│   │   └── prisma.ts              # Prisma client singleton (hot-reload safe)
│   ├── groq/
│   │   └── client.ts              # Groq SDK client initialization
│   ├── moderation/
│   │   ├── classifier.ts          # LLM classification logic + prompt engineering
│   │   └── constants.ts           # Harm category definitions
│   └── policy-engine/
│       └── engine.ts              # Deterministic policy application logic
├── prisma/
│   └── schema.prisma              # Database schema (5 models)
├── vercel.json                    # Vercel deployment configuration
├── package.json
├── tsconfig.json
└── next.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** (bundled with Node.js)
- **PostgreSQL** database (or use [Neon](https://neon.tech) for serverless Postgres)
- **Groq API key** — get one free at [console.groq.com](https://console.groq.com)

### 1. Clone & Install

```bash
git clone <repo-url>
cd content-moderation-next
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file (or set these in your hosting provider):

```env
# Required — PostgreSQL connection string
DATABASE_URL="postgresql://user:password@host:5432/dbname?sslmode=require"

# Required — Groq API key for LLM classification
GROQ_API_KEY="gsk_your_api_key_here"

# Optional — override the default model (default: llama-3.3-70b-versatile)
MODERATION_MODEL="llama-3.3-70b-versatile"
```

### 3. Set Up the Database

```bash
# Generate the Prisma client
npx prisma generate

# Push the schema to your database (creates tables)
npx prisma db push
```

### 4. Seed Default Policies (First Run)

The app auto-seeds default platform policies (General, Gaming, Kids, Educational) on first API call if none exist. You can also reset to defaults from the **Policy Settings** page.

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

---

## 📡 API Reference

All endpoints are under `/api/`. Responses are JSON.

### Moderation

#### `POST /api/moderate`

Classify and moderate a piece of content.

**Request Body:**
```json
{
  "content": "Text to moderate",
  "context": {
    "platformId": "general",
    "surface": "comment section",
    "userHistory": "new account, 0 prior strikes",
    "thread": [
      { "author": "user-a", "text": "Previous message in thread" }
    ]
  }
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `content` | string | ✅ | The text to classify |
| `context.platformId` | string | ✅ | Platform ID (`general`, `gaming`, `kids`, `educational`) |
| `context.surface` | string | ❌ | Where the content appears (e.g. "DM thread", "public post") |
| `context.userHistory` | string | ❌ | Author's moderation history |
| `context.thread` | array | ❌ | Conversation context (oldest first) |

**Response:** Full `ContentRecord` object including flags, reasoning, action, and routing.

---

### Records & Stats

| Endpoint | Method | Description |
|---|---|---|
| `GET /api/records` | GET | All moderation records (newest first) |
| `GET /api/stats` | GET | Aggregate statistics (counts, agreement rate) |
| `GET /api/health` | GET | System health — DB connection, Groq API status, model name |
| `GET /api/categories` | GET | List of all 7 harm categories with labels |

---

### Policies

| Endpoint | Method | Description |
|---|---|---|
| `GET /api/policies` | GET | List all platform policies with thresholds and custom rules |
| `PUT /api/policies/:id` | PUT | Update a platform's thresholds, toggles, and custom rules |
| `POST /api/policies/reset` | POST | Reset all platforms to shipped default policies |

---

### Human Review

| Endpoint | Method | Description |
|---|---|---|
| `GET /api/queue` | GET | Items pending human review |
| `POST /api/queue/:id/review` | POST | Submit a reviewer's decision (`allow`, `review`, or `block`) |
| `GET /api/feedback` | GET | All human overrides (where reviewer disagreed with AI) |

**Review Decision Body:**
```json
{
  "reviewer": "moderator-1",
  "finalAction": "allow",
  "notes": "This is clearly sarcasm between friends."
}
```

---

## 🎯 Harm Categories

The classifier evaluates content against these 7 categories:

| Category | ID | Description |
|---|---|---|
| Hate Speech | `hate_speech` | Content targeting groups based on protected characteristics |
| Harassment | `harassment` | Directed abuse, bullying, or intimidation |
| Spam | `spam` | Unsolicited commercial content, scams, or link farming |
| Misinformation | `misinformation` | Demonstrably false claims presented as fact |
| Graphic Violence | `graphic_violence` | Explicit depictions or glorification of violence |
| Adult Content | `adult_content` | Sexually explicit material |
| Self-Harm | `self_harm` | Content promoting or glorifying self-harm or suicide |

Each flag includes:
- **Confidence** (0.0–1.0) — how certain the model is
- **Severity** (low / medium / high)
- **Segment** — verbatim quote from the content
- **Reasoning** — why the flag was raised

---

## ⚙️ Policy Engine

The policy engine is **deterministic** — given the same classification output and policy configuration, it always produces the same decision.

### Threshold System

Each platform configures two thresholds per category:

```
 0.0          reviewThreshold        autoActionThreshold         1.0
  |               |                         |                    |
  |   AUTO-ALLOW  |     HUMAN REVIEW        |    AUTO-BLOCK      |
  |               |                         |                    |
```

- **Below review threshold** → content is auto-allowed
- **Between thresholds** → content is sent to the human review queue
- **Above auto-action threshold** → content is automatically blocked

### Default Platforms

| Platform | Review ≥ | Auto-Block ≥ | Notes |
|---|---|---|---|
| General | 45% | 85% | Balanced defaults |
| Gaming | 45% | 85% | Relaxed for gaming context |
| Kids | 45% | 85% | Strictest — designed for children's platforms |
| Educational | 45% | 85% | Allows clinical/academic discussion |

### Custom Rules

Keyword rules match substrings (case-insensitive) and **override** model confidence. Useful for:
- Zero-tolerance phrases
- Brand-specific blocked terms
- Regulatory compliance requirements

---

## 🖥️ Pages & UI

### Dashboard (`/dashboard`)
Real-time analytics showing total processed, auto-allowed, auto-blocked, pending review, reviewed, human overrides, and AI/human agreement rate. Includes a table of recent moderation records.

### Submit Content (`/moderate`)
Interactive content submission form with:
- **Quick-load sample scenarios** (self-harm, harassment, gaming banter, spam, misinformation, etc.)
- Platform selector, surface/setting context, author history fields
- **Decision panel** with routing badge, highlighted offending spans, context analysis, and per-category flag cards with confidence bars

### Human Review Queue (`/review`)
Split-pane reviewer workspace:
- **Left**: Queue of pending items with primary flag preview
- **Right**: Full context, AI reasoning, per-category flags, and action buttons (Allow / Keep Under Review / Block)
- Overrides are automatically recorded as feedback for model improvement

### Policy Settings (`/policies`)
Per-platform configuration with:
- Category enable/disable toggles
- Dual-threshold sliders (review + auto-block) per category
- Custom keyword rule management (add/remove)
- Instant save — changes take effect on the next moderation request

---

## 🗄️ Database Schema

The app uses **5 Prisma models** backed by PostgreSQL:

| Model | Purpose |
|---|---|
| `Platform` | Platform definitions (id, name, description) |
| `CategoryPolicy` | Per-platform, per-category threshold configuration |
| `CustomRule` | Keyword-based override rules |
| `ContentRecord` | Full moderation record (content, flags, reasoning, decision) |
| `ReviewOutcome` | Human reviewer decisions linked to content records |

---

## 🌐 Deployment

### Vercel (Recommended)

The project includes a `vercel.json` pre-configured for deployment:

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm install && npx prisma generate && npx prisma db push",
  "framework": "nextjs"
}
```

**Steps:**
1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add environment variables (`DATABASE_URL`, `GROQ_API_KEY`) in Vercel project settings
4. Deploy — Prisma will auto-generate and push the schema during the install step

### Database Hosting

Recommended providers for PostgreSQL:
- **[Neon](https://neon.tech)** — serverless Postgres, generous free tier
- **[Supabase](https://supabase.com)** — managed Postgres with extras
- **[Railway](https://railway.app)** — simple managed Postgres

---

## 🛠️ Development

```bash
# Start dev server with hot reload
npm run dev

# Lint the codebase
npm run lint

# Production build
npm run build

# Start production server
npm start

# Prisma Studio (visual database browser)
npx prisma studio
```

---

## 📦 Tech Stack

| Technology | Purpose |
|---|---|
| [Next.js 16](https://nextjs.org) | Full-stack React framework (App Router) |
| [React 19](https://react.dev) | UI library |
| [Prisma](https://prisma.io) | Type-safe database ORM |
| [PostgreSQL](https://postgresql.org) | Relational database |
| [Groq SDK](https://console.groq.com) | LLM inference API (LLaMA 3.3 70B) |
| [TypeScript](https://typescriptlang.org) | Type safety across the stack |

---

## 📄 License

This project is private. See the repository settings for access details.
