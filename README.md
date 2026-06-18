# Content Moderation Pipeline 🛡️

An AI-powered, multi-stage, and explainable content moderation platform built with **Next.js 16**, **React 19**, **Prisma**, **PostgreSQL**, and **Groq Cloud API** (Llama 3.3 70B).

This project demonstrates a production-grade safety architecture designed to filter, queue, and monitor user-generated content across diverse communities (e.g., General, Kids, Adult, Gaming, Educational) using a combination of context-aware AI classification and deterministic platform policy engines.

---

## 📌 Problem Statement

Traditional content moderation suffers from two core issues:
1. **Context-Free Classifications:** Static keyword lists and basic machine learning classifiers cannot distinguish between friendly banter (e.g., gaming trash-talk like *"I'm gonna kill you next round 😂"*) and actual threats (e.g., harassment sent to a minor).
2. **Lack of Explainability:** Moderation actions often take place in a "black box" where users or human moderators have no clarity on why content was flagged, blocked, or routed a certain way.

This repository implements a **multi-stage moderation pipeline** that solves these challenges. It uses an LLM to assess context (surface setting, sender history, thread context) followed by a deterministic database-driven rule engine to assign routing decisions with clear, auditable reasoning.

---

## ✨ Features

* **Dual-Stage Moderation Engine:**
  * **Stage 1 (AI Classifier):** A context-aware Groq-based Llama-3.3-70b model that analyzes content along 7 distinct harm categories, producing confidences, severity scores, and specific text segments that triggered the violation.
  * **Stage 2 (Deterministic Policy Engine):** Enforces platform-specific threshold configurations and custom substring rule matching to route content to `allow`, `review`, or `block` actions.
* **Interactive Policy Editor:** Configures per-platform policies on the fly, with sliders to adjust `Review` and `Auto-block` confidence thresholds for each category.
* **Custom Substring/Keyword Rules:** Allows developers and moderators to write explicit overrides (e.g., blocking sharing of private addresses) that override AI predictions.
* **Human-in-the-Loop Review Workspace:** A dedicated queue where human moderators review borderline content, see full context and model reasoning, and make final decisions.
* **Analytics Dashboard:** Tracks live KPIs including total processed records, auto-blocked/allowed counts, pending review queue size, and AI/human agreement rates.

---

## 🛠️ Tech Stack

* **Frontend Framework:** Next.js 16.2.9 (App Router)
* **UI Libraries:** React 19.2.4 (using Client-side state transitions & dynamic polling)
* **Styles:** Custom Vanilla CSS (Dark Theme, glassmorphism elements, custom layouts)
* **ORM:** Prisma 6.19.3
* **Database:** PostgreSQL (compatible with serverless options like Neon)
* **LLM Engine:** Groq Cloud SDK 1.2.1 (`llama-3.3-70b-versatile` by default)
* **Language:** TypeScript 5

---

## 🏗️ High-Level Architecture

The moderation process follows a sequential request lifecycle:

```mermaid
graph TD
    A[User Content Submission] --> B[POST /api/moderate]
    B --> C[Load Platform Policies & Rules]
    C --> D[Run Groq LLM Classifier]
    D --> E[Apply Deterministic Policies & Thresholds]
    E --> F[Create ContentRecord in Postgres]
    F --> G{Routing Action}
    G -->|auto_allow| H[Allow Content]
    G -->|auto_block| I[Block Content]
    G -->|human_review| J[Route to Queue]
    J --> K[Human Moderator Workspace]
    K --> L[Submit Final Action / Create ReviewOutcome]
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
# Database connection string (e.g., PostgreSQL or Neon)
DATABASE_URL="postgresql://user:password@host:port/dbname?sslmode=require"

# Groq API Key for content classification
GROQ_API_KEY="gsk_your_groq_api_key_here"

# (Optional) Override default classification model
MODERATION_MODEL="llama-3.3-70b-versatile"
```

---

## 🚀 Running Locally

### 1. Prerequisites
Ensure you have Node.js (v18+ recommended) and a PostgreSQL database running.

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup the Database
Sync the Prisma schema to your PostgreSQL database and initialize the tables:
```bash
npx prisma db push
```

### 4. Seed default policies
Seed the default community platforms (General, Kids, Adult, Gaming, Educational) and rules by running:
```bash
# Seeding is done by visiting or sending a POST request to the API:
curl -X POST http://localhost:3000/api/policies/reset
```

### 5. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application dashboard.

---

## 📂 Folder Structure

```
.
├── app/
│   ├── api/                 # Next.js Serverless API routes
│   │   ├── categories/      # Harm categories configuration endpoint
│   │   ├── feedback/        # Fetch human overrides/feedback
│   │   ├── health/          # System dependencies health status
│   │   ├── moderate/        # Core content submission and evaluation endpoint
│   │   ├── policies/        # Platform policy fetch, edit & reset endpoints
│   │   ├── queue/           # Review queue list and decision outcomes
│   │   ├── records/         # Moderation record history logs
│   │   └── stats/           # Dashboard KPIs aggregator
│   ├── dashboard/           # Analytics overview interface
│   ├── moderate/            # Interactive content classification sandbox
│   ├── policies/            # Policy thresholds and custom rules editor
│   ├── queue/               # Review queue entry point (re-exports review page)
│   ├── review/              # Review queue workspace interface
│   ├── globals.css          # Design system variables and app styles
│   └── layout.tsx           # Page wrappers
├── components/              # Reusable React components
│   ├── FlagCard.tsx         # Displays per-category harm detail cards
│   ├── Navbar.tsx           # Application navigation
│   ├── RoutingBadge.tsx     # Colored visual labels for actions and routings
│   └── StatCard.tsx         # Reusable card component for dashboard KPIs
├── lib/                     # Application logic core
│   ├── database/            # Database clients (Prisma Client)
│   ├── groq/                # AI completion clients (Groq SDK)
│   ├── moderation/          # AI classification and harm mapping logic
│   ├── policy-engine/       # Deterministic policy enforcement logic
│   └── api.ts               # Frontend API helper wrapper
├── prisma/
│   └── schema.prisma        # Database relational models
└── package.json             # Core dependency manifest
```

---

## 🔌 API Overview

Detailed documentation is available in `docs/API.md`. Key endpoints:
* `POST /api/moderate`: Accepts content and context; returns AI and policy decisions.
* `GET /api/queue`: Retrieves records marked for human review that lack review outcomes.
* `POST /api/queue/[id]/review`: Logs human review outcomes and records overrides.
* `PUT /api/policies/[id]`: Updates custom thresholds and keyword rules for a specific platform.

---

## 🚢 Deployment

Deploy directly to **Vercel** with a serverless PostgreSQL database (e.g. Neon or Vercel Postgres). Remember to expose the environment variables `DATABASE_URL` and `GROQ_API_KEY` in Vercel settings.

---

## 📝 Future Improvements
* **Role-Based Access Control:** Secure the review queue and policy editors for authorized administrators/moderators.
* **Real-time Queue Updates:** Implement Server-Sent Events (SSE) or WebSockets to display incoming review items in real-time.
* **Multi-Modal Moderation:** Extend classification capabilities to support image, audio, and video inputs.

---
