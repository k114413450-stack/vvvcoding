/**
 * drip-curator.mjs — Drips 14 days of beginner-focused forum posts and comments
 * Goal: 20-40 daily actions (10 topics + ~20 replies per day = 30 actions/day)
 * All future posts will remain hidden and unlock dynamically hour-by-hour.
 * Run: node scripts/drip-curator.mjs
 */

import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env configuration
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)="?([^"]*)"?\s*$/);
  if (m) process.env[m[1]] = m[2];
}

const db = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// User IDs (both real-looking tester profiles and bots)
const AUTHORS = ["u-alice", "u-bob", "u-charlie", "u-evan", "u-dana"];
const BOTS = ["u-bot-gemini", "u-bot-monetize", "u-bot-vibe", "u-bot-seo", "u-bot-tools"];

// Beginner Pain Points Matrices for realistic post generation
const SUBJECTS = ["cursor composer", "antigravity editor", "v0 by vercel", "github copilot", "nextjs", "tailwind css", "npm", "vercel", "prisma & sqlite"];

const TITLES_TEMPLATES = [
  // Category 1: Editor quirks / overrides
  "how to stop {editor} from deleting my code when changing a color??",
  "{editor} keeps overwriting my whole component instead of editing it...",
  "stupid question: does anyone else get annoyed when {editor} rewrites everything?",
  "is it just me or does {editor} composer get confused on large css files?",
  
  // Category 2: Next.js routing / interactive UI
  "my button onClick does absolutely nothing when i tap it? no errors help",
  "useState is throwing a weird error in nextjs app router... what did i do?",
  "how does page routing work if i have two folders with the same name?",
  "nextjs directory layout is so confusing compared to normal html/js",

  // Category 3: Styling struggles
  "my landing page card wraps weirdly on phone screen, how to fix?",
  "how to center a div using tailwind in 2026? cursor keeps failing",
  "floating navbar is overlapping my main text on mobile view",
  "how do i make the background soft cream instead of default slate?",

  // Category 4: Newbie motivation / thoughts
  "shipped my first mini saas using vibe coding! literally crying lol",
  "vibe coding is making me feel like a hacker but i don't know syntax",
  "am i a real programmer if i only write prompts and don't type syntax?",
  "got my first user signup today!! $0 mrr but feels amazing",

  // Category 5: Terminal / NPM errors
  "got a giant wall of red text in my terminal after running npm install...",
  "terminal says 'permission denied' when trying to run dev server??",
  "prisma generate is throwing an error and my tables are gone help",
  "is it safe to type npm install commands from the internet? scared to break it"
];

const CONTENTS_TEMPLATES = [
  "i was trying to modify my {target} but the AI completely wiped out the surrounding code. i had to cmd+z like 10 times. any settings to fix this behavior?",
  "i generated this beautiful {target} component on v0 and copied it into my project. the design is perfect but none of the clicks work. do i need client components for this?",
  "just shipped a basic {target} and it is live on vercel! i know zero javascript and it took me only 3 hours. is coding actually dead for beginners?",
  "my terminal is full of red warnings saying something about peer dependencies when trying to install {target}. i don't want to break my local dev. help please!",
  "every time i ask the editor to change the style of my {target}, it makes it look like a website from 2005. is my prompt too vague or does it just struggle with design?",
  "stupid beginner question: where does {target} save my data when using sqlite? i checked the directory but can't find a file. sorry if this is dumb!"
];

const COMMENTS_TEMPLATES = [
  "lmao i had this exact same issue yesterday. you probably forgot to add 'use client' at the top of the file.",
  "congrats on shipping! the first launch is always the most exciting. keep going!",
  "for styling issues, try selecting the exact block in cursor and doing cmd+k instead of composer. composer gets too greedy.",
  "npm warnings look scary but you can usually ignore them, or try adding --legacy-peer-deps at the end of the command.",
  "sqlite databases are saved in a local file (usually prisma/dev.db). you can open it with a db browser tool.",
  "same here, i have been vibe coding for a month and still don't understand how react props work. if it runs, it runs!",
  "vercel hosting makes deploying so addictive. no catching, it just works.",
  "try adding 'do not modify any other code' to your system prompt. that stopped my composer from deleting layout headers.",
  "dont panic! terminal errors look worse than they are. just copy the error and paste it directly into cursor chat."
];

// Helper: Pick a random element from an array
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Generate a randomized ISO date string
function getFutureOffsetDate(baseDate, hoursOffset, minutesOffset) {
  const d = new Date(baseDate);
  d.setHours(d.getHours() + hoursOffset);
  d.setMinutes(d.getMinutes() + minutesOffset);
  return d.toISOString();
}

async function run() {
  console.log("🔗 Connecting to Turso database...");
  
  // Wipe out previously seeded drip data to avoid conflicts on re-run
  console.log("🧹 Cleaning up old drip-curated topics and comments...");
  await db.execute(`DELETE FROM "Comment" WHERE id LIKE 'c-drip-%'`);
  await db.execute(`DELETE FROM "Topic" WHERE id LIKE 't-drip-%'`);
  console.log("✅ Cleanup complete.");

  const categories = ["VibeCoding", "SideProject", "AI-Showcase", "Monetization"];
  const tagsList = ["#Newbie,#Help", "#Cursor,#Help", "#DevLife,#Rookie", "#NextJS,#Help", "#v0dev,#Awe", "#CSS,#Help", "#Terminal,#Error"];

  const startDate = new Date(); // Start from right now
  let topicIdCounter = 1;
  let commentIdCounter = 1;

  console.log("\n📦 Generating 14-day drip content (10 topics/day)...");

  for (let day = 0; day < 14; day++) {
    console.log(`\n📅 Generating Day ${day + 1}...`);

    for (let tNum = 0; tNum < 10; tNum++) {
      // Pick random parameters
      const editor = pickRandom(["cursor", "antigravity", "v0", "copilot"]);
      const subject = pickRandom(SUBJECTS);
      
      // Generate realistic titles and contents
      let title = pickRandom(TITLES_TEMPLATES)
        .replace("{editor}", editor)
        .replace("{editor}", editor); // double replace if needed
      
      let content = pickRandom(CONTENTS_TEMPLATES).replace("{target}", subject);
      
      const category = pickRandom(categories);
      const tags = pickRandom(tagsList);
      const authorId = pickRandom(AUTHORS); // Topics posted by user accounts

      // Distribute topics across the 24 hours of that day
      // Day 0 topics start from current hour, Day 1 starts 24h later, etc.
      const hourOffset = day * 24 + tNum * 2.2 + (Math.random() * 0.8);
      const minuteOffset = Math.floor(Math.random() * 60);
      const createdAt = getFutureOffsetDate(startDate, hourOffset, minuteOffset);

      const topicId = `t-drip-${day}-${tNum}`;
      const repliesCount = Math.floor(Math.random() * 3) + 1; // 1 to 3 replies

      await db.execute({
        sql: `INSERT INTO "Topic" (id, title, content, category, tags, authorId, replyCount, viewCount, createdAt, updatedAt) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [
          topicId,
          title,
          content,
          category,
          tags,
          authorId,
          repliesCount,
          Math.floor(Math.random() * 80) + 10,
          createdAt,
          createdAt
        ]
      });

      // Generate staggered comments for this topic
      let lastCommentTimeOffset = Math.floor(Math.random() * 30) + 15; // first comment after 15-45m

      for (let r = 0; r < repliesCount; r++) {
        const commentId = `c-drip-${day}-${tNum}-${r}`;
        const commentAuthor = pickRandom(BOTS); // Comments populated by bot personas
        const commentContent = pickRandom(COMMENTS_TEMPLATES);
        
        // Stagger comment times:
        // Reply 1: +15-45 mins
        // Reply 2: +2 to 6 hours later
        // Reply 3: +8 to 20 hours later
        if (r === 1) {
          lastCommentTimeOffset += Math.floor(Math.random() * 240) + 120; // +2 to 6 hours
        } else if (r === 2) {
          lastCommentTimeOffset += Math.floor(Math.random() * 720) + 480; // +8 to 20 hours
        }

        const commentCreatedAt = getFutureOffsetDate(createdAt, 0, lastCommentTimeOffset);

        await db.execute({
          sql: `INSERT INTO "Comment" (id, content, authorId, topicId, createdAt) 
                VALUES (?, ?, ?, ?, ?)`,
          args: [
            commentId,
            commentContent,
            commentAuthor,
            topicId,
            commentCreatedAt
          ]
        });
      }
      
      topicIdCounter++;
    }
  }

  console.log(`\n🚀 Successfully seeded 140 topics and staggered comment threads spread across the next 14 days!`);
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
