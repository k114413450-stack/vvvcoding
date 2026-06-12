# SKILL: Vibe Curation & Humanized Seeding Workflow (Vibe-Curation-Seeding)

This document defines the repeatable process for sourcing, adapting, and scheduling beginner-focused, human-like forum content for VVVCODING to prevent content staleness and maintain an authentic beginner vibe.

---

## 🎯 Target Audience & Content Direction
VVVCODING targets **vibe-coding beginners and newbies** (Vibe 菜鸟). 
* **Strictly English**: The platform targets an English-speaking developer base. All curated posts, tags, and comments must be strictly in natural developer English.
* **UI Translation**: The UI translation buttons are disabled/removed to keep the English context clean.
* **DO NOT** use highly advanced technical topics (e.g., complex SQL joins, advanced prompt caching configurations, legal corporate structuring).
* **DO** focus on beginner friction points: basic editor controls, folder layouts, simple CSS changes, terminal fear, HTML/JS logic bugs, and motivational/casual developer chats.
* **Ratio**: 20% Simple Beginner Value (tips, basic prompt setups) and 80% Casual Beginner Chat (rants, frustrations, awe, memes).

---

## 📝 Sourcing & Humanizing Guidelines

### 1. Sourcing Locations
Find raw inspiration from:
- Reddit: `r/cursor`, `r/nextjs` (filtering by beginner questions), `r/indiehackers`
- X/Twitter: `#VibeCoding`, `#CursorAI`
- Community Forums: Cursor/Windsurf community support boards, Vercel v0 showcase comments.

### 2. Humanization Rules ("Write like a human, not a bot")
* **Style**: Mostly lowercase, short paragraphs, casual punctuation.
* **Slang & Acronyms**: Use internet shorthand naturally (`idk`, `lmao`, `ikr`, `smh`, `btw`, `lol`, `wip`).
* **Imperfect**: Include minor typos, sentence fragments, and raw emotional expressions (e.g., "i literally want to cry", "help me please").
* **No Bot Jargon**: Banned phrases include "Certainly!", "In conclusion", "As an AI...", "Here is a breakdown of...".

---

## ⏱️ Timeline & Staggered Scheduling Rules

To simulate realistic user behavior, comment intervals must be highly irregular, ranging from minutes to over 24 hours.

### 1. Topic Spacing
Spread new topics across past and future dates (e.g., Topic 1 at `T - 3 days`, Topic 5 at `T - 12 hours`, Topic 6 at `T + 12 hours`, Topic 10 at `T + 5 days`).

### 2. Comment Staggering (The "Irregular timeline" formula)
For any topic posted at time `T`, schedule its comments with highly randomized, wide-spanning offsets:
* **Comment 1 (Fast reply)**: `T + 15 to 45 minutes` (simulate an active user online).
* **Comment 2 (Delayed reply)**: `T + 2 to 6 hours` (simulate a user checking the site during lunch/after work).
* **Comment 3 (Late reply)**: `T + 10 to 24 hours` (simulate a next-day response from another timezone).

Because the frontend filters topics and comments by `createdAt <= Date.now()`, future-dated topics and comments remain hidden and will organically unlock themselves over time.

---

## 🛠️ Seeding execution
1. Define the curated data array in `scripts/seed-curated.mjs`.
2. Clean up previous curated IDs (e.g., deleting topics starting with `t-curated-` and comments starting with `c-curated-`).
3. Run the script:
   ```bash
   node scripts/seed-curated.mjs
   ```
4. Verify compiling:
   ```bash
   npm run build
   ```
5. Deploy to Vercel:
   ```bash
   vercel --prod --yes
   ```
