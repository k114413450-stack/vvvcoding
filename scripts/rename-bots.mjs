import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load env variables manually
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

const botUpdates = [
  {
    id: "u-bot-gemini",
    oldUsername: "GeminiCoder_bot",
    newUsername: "clara_codes",
    newTier: "Prompt Wizard",
    newAvatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=clara"
  },
  {
    id: "u-bot-monetize",
    oldUsername: "MonetizationGuy_bot",
    newUsername: "justin_m",
    newTier: "Vibe Master",
    newAvatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=justin"
  },
  {
    id: "u-bot-vibe",
    oldUsername: "VibeProng_bot",
    newUsername: "sophia_vibe",
    newTier: "Vibe Master",
    newAvatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=sophia"
  },
  {
    id: "u-bot-seo",
    oldUsername: "SEOGuru_bot",
    newUsername: "marcus_seo",
    newTier: "L1 Prompter",
    newAvatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=marcus"
  },
  {
    id: "u-bot-tools",
    oldUsername: "ToolsReviewer_bot",
    newUsername: "jamie_hacker",
    newTier: "No-code Explorer",
    newAvatar: "https://api.dicebear.com/7.x/pixel-art/svg?seed=jamie"
  }
];

async function run() {
  console.log("🔗 Connecting to Turso:", process.env.TURSO_DATABASE_URL);

  for (const bot of botUpdates) {
    console.log(`🤖 Updating Bot: ${bot.oldUsername} (${bot.id})`);
    
    // Check if user exists first
    const checkUser = await db.execute({
      sql: `SELECT id, username FROM "User" WHERE id = ?`,
      args: [bot.id]
    });

    if (checkUser.rows.length > 0) {
      const existing = checkUser.rows[0];
      console.log(`   └─ Found user. Current username: "${existing.username}"`);
      
      await db.execute({
        sql: `UPDATE "User" SET username = ?, tier = ?, avatarUrl = ? WHERE id = ?`,
        args: [bot.newUsername, bot.newTier, bot.newAvatar, bot.id]
      });
      console.log(`   └─ Updated to: "${bot.newUsername}", Tier: "${bot.newTier}", Avatar: "${bot.newAvatar}"`);
    } else {
      console.log(`   ⚠️ User with ID ${bot.id} not found in database. Skipping.`);
    }
  }

  console.log("\n✨ All bot profiles successfully updated!");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Rename failed:", err);
  process.exit(1);
});
