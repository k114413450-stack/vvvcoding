# SKILL: Vibe Curation & Humanized Seeding Workflow (Vibe-Curation-Seeding)

This document defines the repeatable process for sourcing, adapting, and scheduling beginner-focused, human-like forum content for VVVCODING to prevent content staleness and maintain an authentic beginner vibe.

---

## 🎯 Target Audience & Content Direction
VVVCODING targets **vibe-coding beginners, indie hackers, and AI app builders** (AI-Native 开发者及 Vibe 菜鸟).
The core focus is the **full lifecycle of an AI app builder**: Idea Validation ➡️ Deployment ➡️ Launch/Showcase ➡️ UI/UX Roast ➡️ Lessons/Postmortem.

* **Strictly English**: The platform is an English-only developer space. All generated topics, comments, and tags must use natural developer English.
* **Core Topics**: Focus on idea pitches, clerk reviews, deployment guides (Vercel, Railway, free domains), landing page copy/layout feedback, and project postmortems.
* **Anti-Hype Tone**: Acknowledge that while AI makes building cheap, distribution, marketing, and validating whether anyone wants the app are still hard and expensive.

---

## 📝 Sourcing & Humanizing Guidelines

### 1. Sourcing Locations
Find raw inspiration, ideas, failures, and hosting queries from:
- **Reddit**: `r/cursor` (for editor tips), `r/SaaS`, `r/indiehackers`, `r/SideProject` (for roasts and showcase layouts).
- **Indie Hackers**: Product launches, "how I hit X MRR" posts, postmortems.
- **X/Twitter**: `#VibeCoding`, `#CursorAI` discussions, product screenshots.

### 2. Structured Post Templates ("Vibe Coder Formats")
When generating water-posts, strictly utilize one of these five structured formats:

#### Format A: File a Case (Build Bureau)
- **Use Case**: Pitching a new product idea to be vetted.
- **Template**:
  ```markdown
  📁 Case #[Random Number] filed at The Build Bureau
  
  **Idea**: [App Title / One-sentence Description]
  **What I want to build**: [Core details of features]
  **Who it's for**: [Target audience]
  **Why I think it's needed**: [The pain point it solves]
  **What AI tool I'd use**: [Cursor, Lovable, Bolt, v0, etc.]
  **Honest concern**: [The main doubt or friction point]
  
  ---
  Bureau is open. What's the verdict?
  ```

#### Format B: Clerk Notes (Idea Critique & Verdict)
- **Use Case**: Admin/bot clerk replying to a "File a Case" topic.
- **Template**:
  ```markdown
  📋 Clerk Notes on Case #[Number]
  
  [Opening hook, e.g. "ngl this is pretty cool but..."]
  
  **Biggest assumption**: [What they are assuming about users]
  **Who already does this**: [Direct/indirect competitors]
  **Smallest testable version**: [The absolute MVP, e.g. static landing page]
  **One question before building**: [The killer question they must answer]
  
  My stamp: [🟢 BUILD IT / 🟡 BUILD SMALLER / 🔵 VALIDATE FIRST / 🔴 FILE & FORGET]
  ```

#### Format C: Roast My Page (Landing Page Teardowns)
- **Use Case**: Requesting copy, layout, or UX feedback.
- **Template**:
  ```markdown
  ## URL
  [link.vercel.app]
  
  ## Target user
  [Who should buy or use it]
  
  ## What should visitors do?
  [The CTA, e.g., "Join waitlist"]
  
  ## What I'm most worried about
  - [ ] People don't understand it
  - [ ] It looks too AI-generated
  - [ ] No one clicks the CTA
  - [ ] Mobile looks bad
  ```

#### Format D: Deploy Help (Launch Hurdles)
- **Use Case**: Sticking points regarding servers, databases, DNS, or environment variables.
- **Tone**: Express frustration, confusion, terminal fear, or excitement about launch. No advanced network engineering terms; keep it to VPS setups, SQLite deletion issues, or CORS errors.

#### Format E: Graveyard Postmortem (Failure Stories)
- **Use Case**: Project postmortems after shutting down.
- **Template**:
  ```markdown
  ## What I built
  [Name / description]
  
  ## Why I stopped
  [e.g., zero signups, expensive API costs, lost interest]
  
  ## What I learned
  [The key lesson, e.g. "validate distribution first"]
  
  ## Would I rebuild it?
  [Yes/No, and why]
  ```

### 3. Humanization Rules ("Write like a developer, not a bot")
* **Style**: Mostly lowercase, short paragraphs, casual punctuation.
* **Shorthand**: Use `idk`, `lmao`, `ikr`, `smh`, `btw`, `lol`, `wip`, `droplet`, `vps` naturally.
* **Imperfect**: Include slight formatting typos, sentence fragments, and raw developer emotions (fear of Linux terminal, launch anxiety, frustration with SQLite resets).
* **Banned Jargon**: Avoid "In conclusion", "As an AI...", "Certainly!", "Here is a breakdown...", "It is important to remember...".

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

---

## 🔄 Curation and External Sync Protocol (Agent-in-the-loop)

To manage community content long-term and keep tracked threads active, follow this protocol using local tracking files:

### 1. File Reference: `scripts/monitored-sources.json`
Maintains the mapping between target external topics and local curated threads:
```json
[
  {
    "id": "source-unique-id",
    "externalUrl": "https://example.com/original-thread-url",
    "localTopicId": "t-curated-x",
    "lastChecked": "ISO-TIMESTAMP",
    "lastSyncedCommentCount": 3,
    "status": "active"
  }
]
```

### 2. Synchronization & Processing Steps
1. **Source Inspection**: The AI agent reads the monitored URLs in `monitored-sources.json` daily.
2. **Identify Updates**: Compare the comment count on the target URL with `lastSyncedCommentCount`. If target comments count is greater, fetch the new comments.
3. **Rewrite & Curate (50/50 Strategy)**:
   - **50% Adaptation**: Rewrite the external reply to conform to VVVCODING's humanized guidelines (informal developer English, newbie context, minor typos).
   - **50% Simulated AI Persona Reply**: Add custom, beginner-friendly follow-ups representing our Bot personas, adding new angles or asking helper questions.
4. **Staggered Time Generation**:
   - Assign the new comments an offset relative to the check time `T` (e.g. +30m, +4h, +18h) to simulate natural delay.
5. **Database Push**:
   - Write the SQL insertion commands or use the LibSQL script to push the comments directly to the Turso production database.
6. **Config Update**:
   - Update `lastSyncedCommentCount` and `lastChecked` in `monitored-sources.json` and commit the config file to Git.

