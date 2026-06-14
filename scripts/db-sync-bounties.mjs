/**
 * scripts/db-sync-bounties.mjs
 * Creates the "Bounty" table in Turso and seeds the initial 12 bounties.
 * Run: node scripts/db-sync-bounties.mjs
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

async function run() {
  console.log("🔗 Connecting to Turso:", process.env.TURSO_DATABASE_URL);

  console.log("\n📐 Step 1: Creating 'Bounty' table in Turso if not exists...");
  await db.execute(`
    CREATE TABLE IF NOT EXISTS "Bounty" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "description" TEXT NOT NULL,
      "budgetMin" INTEGER NOT NULL,
      "budgetMax" INTEGER NOT NULL,
      "currency" TEXT NOT NULL DEFAULT 'USD',
      "category" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'OPEN',
      "sourceType" TEXT NOT NULL,
      "sourceUrl" TEXT,
      "contactMethod" TEXT NOT NULL,
      "contactValue" TEXT NOT NULL,
      "estimatedDays" INTEGER NOT NULL DEFAULT 3,
      "expiresAt" DATETIME,
      "isCurated" BOOLEAN NOT NULL DEFAULT 1,
      "authorId" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      CONSTRAINT "Bounty_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );
  `);
  console.log("✅ 'Bounty' table verified/created.");

  console.log("\n🧹 Step 2: Cleaning up existing bounties from Turso...");
  await db.execute(`DELETE FROM "Bounty"`);
  console.log("✅ Cleanup complete.");

  console.log("\n🌱 Step 3: Seeding 12 bounties to Turso...");
  const now = Date.now();
  const bounties = [
    {
      id: "b-1",
      title: "Sync Shopify 'Box' and 'Single Bottle' Inventory",
      description: "We sell wine in boxes of 6 and single bottles. If someone buys a single bottle, the box inventory doesn't update. Need a script or simple webhook listener that reduces the box inventory by 1/6 when a single is sold, or vice versa, to avoid overselling.",
      budgetMin: 100,
      budgetMax: 200,
      currency: "USD",
      category: "Shopify",
      status: "OPEN",
      sourceType: "Reddit",
      sourceUrl: "https://www.reddit.com/r/shopify/comments/example1",
      contactMethod: "Link",
      contactValue: "https://www.reddit.com/r/shopify/comments/example1",
      estimatedDays: 2,
      isCurated: 1,
      expiresAt: new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "b-2",
      title: "Chrome Extension to Export LinkedIn Profile to Custom JSON",
      description: "Looking for a simple Chrome extension where I can click a button on a LinkedIn profile page and it grabs the name, current title, company, and location, and downloads it as a formatted JSON or CSV. Needs to be lightweight.",
      budgetMin: 80,
      budgetMax: 150,
      currency: "USD",
      category: "Chrome Extension",
      status: "OPEN",
      sourceType: "Reddit",
      sourceUrl: "https://www.reddit.com/r/SideProject/comments/example2",
      contactMethod: "Link",
      contactValue: "https://www.reddit.com/r/SideProject/comments/example2",
      estimatedDays: 2,
      isCurated: 1,
      expiresAt: new Date(now + 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "b-3",
      title: "Airtable to Webflow Sync Automation Script",
      description: "Need a script that fires via Make/Integromat or direct webhook when a row status in Airtable is marked as 'Approved'. It should immediately create or update the item in Webflow CMS. Need someone to write the code logic for handling multi-reference fields.",
      budgetMin: 50,
      budgetMax: 100,
      currency: "USD",
      category: "Automation Script",
      status: "CLAIMED",
      sourceType: "IndieHackers",
      sourceUrl: "https://www.indiehackers.com/post/example3",
      contactMethod: "Link",
      contactValue: "https://www.indiehackers.com/post/example3",
      estimatedDays: 1,
      isCurated: 1,
      expiresAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "b-4",
      title: "Web Scraper for Local Gym Schedules and Classes",
      description: "I need a Python scraper that runs daily to extract class names, instructors, and timetables from 12 local gym sites. The gyms use Mindbody or custom HTML tables. The scraper should output a unified JSON format.",
      budgetMin: 150,
      budgetMax: 250,
      currency: "USD",
      category: "Web Scraper",
      status: "OPEN",
      sourceType: "Reddit",
      sourceUrl: "https://www.reddit.com/r/scrapy/comments/example4",
      contactMethod: "Link",
      contactValue: "https://www.reddit.com/r/scrapy/comments/example4",
      estimatedDays: 3,
      isCurated: 1,
      expiresAt: new Date(now + 45 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "b-5",
      title: "Stripe Failed Payment Notification Discord Bot",
      description: "Simple bot that listens to Stripe webhook 'invoice.payment_failed' and posts a message in our private Discord channel with the customer name, amount, and invoice link. Built with Node.js/Discord.js.",
      budgetMin: 70,
      budgetMax: 120,
      currency: "USD",
      category: "Discord / Slack Bot",
      status: "OPEN",
      sourceType: "IndieHackers",
      sourceUrl: "https://www.indiehackers.com/post/example5",
      contactMethod: "Link",
      contactValue: "https://www.indiehackers.com/post/example5",
      estimatedDays: 1,
      isCurated: 1,
      expiresAt: new Date(now + 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "b-6",
      title: "Notion CRM Client Billing Integration",
      description: "Looking to connect Notion database with Lemon Squeezy invoices. When a new project is created in Notion, it should generate a custom checkout URL for the client using Lemon Squeezy API and paste it back into Notion.",
      budgetMin: 100,
      budgetMax: 180,
      currency: "USD",
      category: "Notion / Airtable Tool",
      status: "OPEN",
      sourceType: "Internal",
      contactMethod: "Email",
      contactValue: "support@vvvcoding.com",
      estimatedDays: 2,
      isCurated: 0,
      expiresAt: new Date(now + 60 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "b-7",
      title: "Landing Page Pricing Toggle Widget",
      description: "Need a beautiful React component for a Framer/NextJS pricing toggle (Monthly vs Annual). Needs to show discount percentages and have smooth micro-animations. Just the widget frontend, no checkout logic.",
      budgetMin: 50,
      budgetMax: 80,
      currency: "USD",
      category: "Landing Page",
      status: "CLAIMED",
      sourceType: "IndieHackers",
      sourceUrl: "https://www.indiehackers.com/post/example7",
      contactMethod: "Link",
      contactValue: "https://www.indiehackers.com/post/example7",
      estimatedDays: 1,
      isCurated: 1,
      expiresAt: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "b-8",
      title: "Data Cleanup: Bulk CSV Email Verification Script",
      description: "Write a script that takes a list of 10k emails from a CSV file, performs syntax checks and MX record verification, and outputs a cleaned CSV with valid addresses. Must run fast using multithreading.",
      budgetMin: 60,
      budgetMax: 100,
      currency: "USD",
      category: "Data Cleanup",
      status: "OPEN",
      sourceType: "IndieHackers",
      sourceUrl: "https://www.indiehackers.com/post/example8",
      contactMethod: "Link",
      contactValue: "https://www.indiehackers.com/post/example8",
      estimatedDays: 1,
      isCurated: 1,
      expiresAt: new Date(now + 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "b-9",
      title: "Google Sheets to Telegram Broadcasting Tool",
      description: "I want a script bounded to Google Sheets. When I write a message in a row and check a box, it should broadcast that text message to a specific Telegram Channel using a Telegram bot token.",
      budgetMin: 80,
      budgetMax: 120,
      currency: "USD",
      category: "Discord / Slack Bot",
      status: "OPEN",
      sourceType: "Reddit",
      sourceUrl: "https://www.reddit.com/r/googleappsapi/comments/example9",
      contactMethod: "Link",
      contactValue: "https://www.reddit.com/r/googleappsapi/comments/example9",
      estimatedDays: 2,
      isCurated: 1,
      expiresAt: new Date(now + 25 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "b-10",
      title: "AI-Powered PDF Invoice Parser to JSON",
      description: "Create a Node.js script that runs PDF invoices through Gemini 3.5 Flash API with structured JSON output schemas, capturing merchant, items, totals, and tax. Needs to process about 200 PDFs in under 2 minutes.",
      budgetMin: 150,
      budgetMax: 300,
      currency: "USD",
      category: "AI Tool",
      status: "OPEN",
      sourceType: "Reddit",
      sourceUrl: "https://www.reddit.com/r/solopreneur/comments/example10",
      contactMethod: "Link",
      contactValue: "https://www.reddit.com/r/solopreneur/comments/example10",
      estimatedDays: 2,
      isCurated: 1,
      expiresAt: new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "b-11",
      title: "Framer Custom Carousel Slider with SwiperJS",
      description: "Integrate SwiperJS into a Framer project as a custom React component. The slider must be fully responsive, support touch swipe on mobile, and allow customization of slide delay in the Framer properties panel.",
      budgetMin: 70,
      budgetMax: 110,
      currency: "USD",
      category: "Landing Page",
      status: "OPEN",
      sourceType: "IndieHackers",
      sourceUrl: "https://www.indiehackers.com/post/example11",
      contactMethod: "Link",
      contactValue: "https://www.indiehackers.com/post/example11",
      estimatedDays: 1,
      isCurated: 1,
      expiresAt: new Date(now + 12 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "b-12",
      title: "Custom CSV Importer for Postgres DB",
      description: "Need a CLI script that takes arbitrary CSVs of users and automatically normalizes, matches headers, and loads them into a Postgres database with proper upserts. Written in Python or JS.",
      budgetMin: 120,
      budgetMax: 200,
      currency: "USD",
      category: "Internal Tool",
      status: "OPEN",
      sourceType: "Reddit",
      sourceUrl: "https://www.reddit.com/r/postgres/comments/example12",
      contactMethod: "Link",
      contactValue: "https://www.reddit.com/r/postgres/comments/example12",
      estimatedDays: 2,
      isCurated: 1,
      expiresAt: new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(),
    }
  ];

  const insertSql = `
    INSERT OR REPLACE INTO "Bounty" (
      id, title, description, budgetMin, budgetMax, currency, category, status, 
      sourceType, sourceUrl, contactMethod, contactValue, estimatedDays, expiresAt, 
      isCurated, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  for (const b of bounties) {
    const timeStr = new Date(now).toISOString();
    await db.execute({
      sql: insertSql,
      args: [
        b.id, b.title, b.description, b.budgetMin, b.budgetMax, b.currency, b.category, b.status,
        b.sourceType, b.sourceUrl ?? null, b.contactMethod, b.contactValue, b.estimatedDays, b.expiresAt ?? null,
        b.isCurated, timeStr, timeStr
      ]
    });
    console.log(`  ✓ Curated Bounty: ${b.title}`);
  }

  // Verify
  const countRes = await db.execute(`SELECT COUNT(*) as cnt FROM "Bounty"`);
  console.log(`\n🎉 Total bounties in Turso: ${countRes.rows[0].cnt}`);
  
  db.close();
}

run().catch((e) => {
  console.error("❌ Synchronization failed:", e);
  process.exit(1);
});
