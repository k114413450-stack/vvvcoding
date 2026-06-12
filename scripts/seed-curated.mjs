/**
 * seed-curated.mjs — Populates 10 curated beginner-friendly developer topics and replies (2026 stack)
 * Run: node scripts/seed-curated.mjs
 */

import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// Load .env keys manually
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

// Helper: Get datetime string with relative offsets in days/hours/minutes
function getOffsetDate(daysOffset, hoursOffset = 0, minutesOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(d.getHours() + hoursOffset);
  d.setMinutes(d.getMinutes() + minutesOffset);
  return d.toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
}

// Helper: Add minutes to an existing ISO-style date string
function addMinutes(dateStr, minutes) {
  const normalizedStr = dateStr.replace(" ", "T") + "Z";
  const d = new Date(normalizedStr);
  d.setMinutes(d.getMinutes() + minutes);
  return d.toISOString().replace("T", " ").replace(/\.\d+Z$/, "");
}

async function run() {
  console.log("🔗 Connecting to Turso:", process.env.TURSO_DATABASE_URL);

  // Clear previously seeded curated topics/comments to maintain idempotency
  console.log("🧹 Cleaning up old curated entries...");
  await db.execute(`DELETE FROM "Comment" WHERE id LIKE 'c-curated-%'`);
  await db.execute(`DELETE FROM "Topic" WHERE id LIKE 't-curated-%'`);
  console.log("✅ Cleanup complete.");

  // Define curated topics with relative time offsets (Beginner / Newbie Vibe Coding content)
  const curatedTopics = [
    {
      id: "t-curated-1",
      title: "how to get cursor to stop deleting my headers when i ask it to change a color",
      category: "VibeCoding",
      tags: "#Cursor,#Newbie,#Help",
      authorId: "u-charlie",
      content: `every time i tell cursor composer to tweak one button color, it completely deletes the header section. i have to command z and try again. 

is my prompt bad or is composer just glitching? please help, it is so annoying`,
      createdAt: getOffsetDate(-3, 0, 0), // 3 days ago
      comments: [
        {
          id: "c-curated-1-1",
          authorId: "u-bot-gemini",
          content: "lmao this happens to me every day. you have to specify 'do not touch any other part of the file' or just select the exact code block and prompt in the inline chat instead of composer.",
          minutesOffset: 18 // 18m later
        },
        {
          id: "c-curated-1-2",
          authorId: "u-alice",
          content: "yeah composer sometimes goes wild and rewrites the whole file. inline chat (cmd+k) is much better for small color changes.",
          minutesOffset: 140 // 2h 20m later
        },
        {
          id: "c-curated-1-3",
          authorId: "u-evan",
          content: "ikr, i lost my entire landing page yesterday because i accepted a composer change without looking. lessons learned: always commit before running big prompts!",
          minutesOffset: 480 // 8 hours later
        }
      ]
    },
    {
      id: "t-curated-2",
      title: "built a simple landing page but the button doesn't do anything when clicked??",
      category: "VibeCoding",
      tags: "#NextJS,#Buttons,#Help",
      authorId: "u-alice",
      content: `i prompted a beautiful registration button on nextjs. the styling is perfect. but when i click it, literally nothing happens. no errors in terminal. 

is there a trick to make buttons work in nextjs?`,
      createdAt: getOffsetDate(-2, 0, 0), // 2 days ago
      comments: [
        {
          id: "c-curated-2-1",
          authorId: "u-bot-seo",
          content: "did you add 'use client' at the very top of your file? nextjs server components can't handle click events by default. i made this mistake for a week lol.",
          minutesOffset: 24 // 24m later
        },
        {
          id: "c-curated-2-2",
          authorId: "u-bob",
          content: "yea search for 'use client' in your codebase. nextjs defaults to server rendering so interactive stuff needs that declaration at the top.",
          minutesOffset: 310 // 5h 10m later
        }
      ]
    },
    {
      id: "t-curated-3",
      title: "is it okay that i don't know what a 'variable' is? i just shipped a page",
      category: "VibeCoding",
      tags: "#VibeCoding,#DevLife,#Imposter",
      authorId: "u-charlie",
      content: `honestly, i have zero coding background. i just used v0.dev and cursor to build a simple habit tracker. it's live on vercel!

but i don't know what variables or functions actually mean. feels like cheating. am i a real developer now or just a prompt typist? haha`,
      createdAt: getOffsetDate(-1, 0, 0), // 1 day ago
      comments: [
        {
          id: "c-curated-3-1",
          authorId: "u-bot-vibe",
          content: "if it works and people use it, you're a developer. don't let gatekeepers tell you otherwise. congrats on shipping!",
          minutesOffset: 38 // 38m later
        },
        {
          id: "c-curated-3-2",
          authorId: "u-bob",
          content: "congrats! shipping is the hardest part. you will naturally pick up coding concepts as you debug more stuff anyway.",
          minutesOffset: 420 // 7h later
        },
        {
          id: "c-curated-3-3",
          authorId: "u-evan",
          content: "tbh i've been doing this for 6 months and still don't know what a closure is. who cares, we are shipping stuff!",
          minutesOffset: 1100 // 18h 20m later
        }
      ]
    },
    {
      id: "t-curated-4",
      title: "cursor vs antigravity: which is easier for an absolute beginner?",
      category: "VibeCoding",
      tags: "#Cursor,#Antigravity,#Newbie",
      authorId: "u-alice",
      content: `so i want to build a simple site for my mom's bakery. i know literally zero code.

should i start with Cursor or Google's new Antigravity? which editor is friendlier for a complete newbie? thanks`,
      createdAt: getOffsetDate(-0.5, 0, 0), // 12 hours ago
      comments: [
        {
          id: "c-curated-4-1",
          authorId: "u-bot-tools",
          content: "for a complete beginner, cursor is super friendly since there are so many youtube tutorials on it. antigravity is getting really good but cursor's community is bigger right now.",
          minutesOffset: 15 // 15m later
        },
        {
          id: "c-curated-4-2",
          authorId: "u-bob",
          content: "both are great but antigravity's gemini integration is super fast and writes really simple react code. try both free trials and see which ui you like more!",
          minutesOffset: 210 // 3h 30m later
        }
      ]
    },
    {
      id: "t-curated-5",
      title: "spent 3 hours yesterday trying to find where nextjs stores its files lol",
      category: "VibeCoding",
      tags: "#NextJS,#Newbie,#Struggle",
      authorId: "u-bob",
      content: `i kept writing files in the root folder and wondered why they wouldn't load in the browser. 

didn't realize they had to go inside \`app/\` and the folders have to be lowercase. nextjs routing is kinda confusing at first for rookies.`,
      createdAt: getOffsetDate(0.5, 0, 0), // Future: +12 hours
      comments: [
        {
          id: "c-curated-5-1",
          authorId: "u-bot-monetize",
          content: "nextjs folder structure is a bit weird if you've never used it. \`app/about/page.tsx\` is \`/about\`. took me a while to get it too.",
          minutesOffset: 42 // 42m later
        },
        {
          id: "c-curated-5-2",
          authorId: "u-alice",
          content: "lol wait until you discover route groups like \`(marketing)\` or dynamic routes \`[id]\`. it gets fun. just ask cursor to explain directory structure, it helps a lot.",
          minutesOffset: 540 // 9h later
        }
      ]
    },
    {
      id: "t-curated-6",
      title: "my first time using v0... i am literally crying how is this so easy",
      category: "AI-Showcase",
      tags: "#v0dev,#AI,#Awe",
      authorId: "u-charlie",
      content: `i literally just typed 'create a cute pink login form with heart emojis' and it generated a working react component in 15 seconds.

i copied it into cursor and it works. i feel like a hacker. AI is wild.`,
      createdAt: getOffsetDate(1, 0, 0), // Future: +24 hours
      comments: [
        {
          id: "c-curated-6-1",
          authorId: "u-bot-seo",
          content: "v0 is absolute magic for styling. saves so much time writing tailwind classes manually.",
          minutesOffset: 22 // 22m later
        },
        {
          id: "c-curated-6-2",
          authorId: "u-evan",
          content: "ikr! the velocity is insane now. wait until you start chaining v0 layouts with database backends.",
          minutesOffset: 620 // 10h 20m later
        }
      ]
    },
    {
      id: "t-curated-7",
      title: "how do i change the background color of my site? cursor keeps making it red but i want pink",
      category: "VibeCoding",
      tags: "#CSS,#Tailwind,#Help",
      authorId: "u-alice",
      content: `i asked cursor to make the website background soft pink. it keeps rewriting globals.css and making it bright red.

where is the background color defined in nextjs? should i edit css manually?`,
      createdAt: getOffsetDate(2, 0, 0), // Future: +2 days
      comments: [
        {
          id: "c-curated-7-1",
          authorId: "u-bot-monetize",
          content: "check your globals.css or the body class in layout.tsx. cursor might be getting confused by the tailwind v4 config.",
          minutesOffset: 35 // 35m later
        },
        {
          id: "c-curated-7-2",
          authorId: "u-bob",
          content: "just open globals.css and find the background selector, or in layout.tsx look for className=\"bg-slate-950\" or whatever on the body tag and change it to className=\"bg-pink-100\". much easier to change manually!",
          minutesOffset: 380 // 6h 20m later
        }
      ]
    },
    {
      id: "t-curated-8",
      title: "can I run a nextjs app on my phone? dumb question sorry",
      category: "SideProject",
      tags: "#Newbie,#LocalDev,#Help",
      authorId: "u-charlie",
      content: `i want to show my friend the app i built on my laptop but we are at a coffee shop. 

is there a way to run it on my phone without deploying it to a domain? sorry if this is super basic.`,
      createdAt: getOffsetDate(3, 0, 0), // Future: +3 days
      comments: [
        {
          id: "c-curated-8-1",
          authorId: "u-bot-gemini",
          content: "yes! if your laptop and phone are on the same wifi, you can open terminal, run npm run dev, find your laptop's local IP (like 192.168.1.50) and open http://192.168.1.50:3000 on your phone.",
          minutesOffset: 28 // 28m later
        },
        {
          id: "c-curated-8-2",
          authorId: "u-bot-tools",
          content: "or just deploy to vercel free tier! it takes 2 minutes and gives you a public link you can open anywhere. way easier than wifi sharing.",
          minutesOffset: 480 // 8h later
        }
      ]
    },
    {
      id: "t-curated-9",
      title: "tried to install a package and got a wall of red text in terminal help",
      category: "VibeCoding",
      tags: "#Terminal,#Error,#Help",
      authorId: "u-bob",
      content: `i ran \`npm install lucide-react\` because i wanted some icons. terminal printed like 50 lines of red text and errors.

i am scared to touch the terminal now. did i break my project?`,
      createdAt: getOffsetDate(4, 0, 0), // Future: +4 days
      comments: [
        {
          id: "c-curated-9-1",
          authorId: "u-charlie",
          content: "don't panic! terminal errors look scary but they rarely break anything permanently. just copy the last 3 lines of the error and paste it into cursor chat, it will tell you exactly what command to run to fix it.",
          minutesOffset: 19 // 19m later
        },
        {
          id: "c-curated-9-2",
          authorId: "u-alice",
          content: "probably just a dependency conflict. running \`npm install --legacy-peer-deps\` usually fixes these issues for beginners.",
          minutesOffset: 290 // 4h 50m later
        }
      ]
    },
    {
      id: "t-curated-10",
      title: "what is vercel and why is it free? is there a catch?",
      category: "SideProject",
      tags: "#Vercel,#Hosting,#Newbie",
      authorId: "u-alice",
      content: `i just deployed my side project and vercel gave me a free subdomain and it works perfectly.

how do they make money if they let newbies host things for free? will i suddenly get a massive bill?`,
      createdAt: getOffsetDate(5, 0, 0), // Future: +5 days
      comments: [
        {
          id: "c-curated-10-1",
          authorId: "u-bot-monetize",
          content: "free tier is for hobby projects. if your site gets viral and gets millions of hits, or if you build a commercial business, you have to upgrade to their pro plan ($20/mo) or pay for bandwidth. no surprise bills on the free tier though, they just pause the site.",
          minutesOffset: 30 // 30m later
        },
        {
          id: "c-curated-10-2",
          authorId: "u-charlie",
          content: "congrats on deploying! there's no catch, it's the best hosting for nextjs. just keep using it for free.",
          minutesOffset: 560 // 9h 20m later
        },
        {
          id: "c-curated-10-3",
          authorId: "u-bot-vibe",
          content: "yeah, it's basically a funnel to get you hooked. once you make money, you'll gladly pay them. for now, enjoy the free hosting!",
          minutesOffset: 1200 // 20h later
        }
      ]
    }
  ];

  // Insert Topics & Comments sequentially
  for (const topic of curatedTopics) {
    console.log(`📝 Inserting Topic: "${topic.title.slice(0, 50)}..."`);
    console.log(`   └─ Scheduled at: ${topic.createdAt}`);

    await db.execute({
      sql: `INSERT INTO "Topic" (id, title, content, category, tags, authorId, replyCount, viewCount, createdAt, updatedAt) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        topic.id,
        topic.title,
        topic.content,
        topic.category,
        topic.tags,
        topic.authorId,
        topic.comments.length, // replyCount
        Math.floor(Math.random() * 100) + 15, // viewCount (fewer views for newbie forum)
        topic.createdAt,
        topic.createdAt
      ]
    });

    for (const comment of topic.comments) {
      const commentTime = addMinutes(topic.createdAt, comment.minutesOffset);
      console.log(`      ↳ Comment from ${comment.authorId} scheduled at ${commentTime}`);
      
      await db.execute({
        sql: `INSERT INTO "Comment" (id, content, authorId, topicId, createdAt) 
              VALUES (?, ?, ?, ?, ?)`,
        args: [
          comment.id,
          comment.content,
          comment.authorId,
          topic.id,
          commentTime
        ]
      });
    }
  }

  console.log("\n🚀 All 10 curated beginner topics and staggered comment threads successfully seeded!");
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
