/**
 * seed-prompts.mjs
 * 用 @libsql/client 直接在 Turso 建 Prompt 表 + 灌入 15 条高质量种子数据
 * 运行: node scripts/seed-prompts.mjs
 */

import { createClient } from "@libsql/client";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// 读取 .env（简单 key=value 解析）
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, "../.env");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)="?([^"]*)"?\s*$/);
  if (m) process.env[m[1]] = m[2];
}

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error("❌ TURSO_DATABASE_URL 或 TURSO_AUTH_TOKEN 未设置！");
  process.exit(1);
}

console.log("🔗 连接 Turso:", TURSO_DATABASE_URL);

const db = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

async function run() {
  console.log("\n📐 Step 1: 在 Turso 建 Prompt 表...");
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS "Prompt" (
      "id"         TEXT NOT NULL PRIMARY KEY,
      "title"      TEXT NOT NULL,
      "useCase"    TEXT NOT NULL,
      "model"      TEXT NOT NULL,
      "template"   TEXT NOT NULL,
      "effectNote" TEXT NOT NULL,
      "category"   TEXT NOT NULL,
      "tags"       TEXT NOT NULL,
      "authorId"   TEXT NOT NULL,
      "copyCount"  INTEGER NOT NULL DEFAULT 0,
      "likeCount"  INTEGER NOT NULL DEFAULT 0,
      "createdAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt"  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY ("authorId") REFERENCES "User"("id")
    );
  `);
  console.log("✅ Prompt 表创建成功");

  console.log("\n🧹 Step 2: 清理旧 Prompt 数据...");
  await db.execute('DELETE FROM "Prompt"');
  console.log("✅ 清理旧数据完成");

  console.log("\n🌱 Step 3: 插入 15 条高质量种子 Prompts...");
  const prompts = [
    {
      id: "p-1",
      title: "Fix Tailwind responsive layout issues",
      useCase: "Fix alignment, wrapping, and overflow issues across different breakpoints in Tailwind CSS.",
      model: "Claude 4.8, GPT-5.5",
      template: "Analyze the following HTML/React component and its Tailwind CSS classes. It has a layout bug where elements wrap incorrectly, overlap, or overflow specifically on medium (md) and mobile screens. Please identify the root cause of the responsive issue (e.g., rigid widths, missing flex-wrap, incorrect grid columns, or conflicts between responsive prefixes) and provide the corrected code block. Do not rewrite unaffected parent elements. Provide a 2-sentence explanation of what utility class was causing the bug.",
      effectNote: "Very effective at debugging grid/flex layouts on mobile screens.",
      category: "Debug",
      tags: "#Tailwind,#CSS,#Debug,#Responsive",
      authorId: "u-bot-seo"
    },
    {
      id: "p-2",
      title: "Generate Prisma CRUD operations with TypeScript",
      useCase: "Automatically generate safe, TypeScript-typed CRUD functions for a given Prisma schema model.",
      model: "Claude 4.8, GPT-5.5",
      template: "You are an expert Backend Engineer. Given the following Prisma model definition: [paste model here], generate a complete TypeScript service file containing CRUD functions (create, findById, findMany with pagination, update, delete). Ensure that: 1. Input parameters are strictly typed using Prisma's generated types (e.g., Prisma.UserCreateInput). 2. Errors are handled gracefully with try/catch blocks and returned as structured error objects. 3. Code follows the single responsibility principle and matches the Next.js App Router API directory style.",
      effectNote: "Generates boilerplate services quickly.",
      category: "Coding",
      tags: "#Prisma,#TypeScript,#CRUD,#Backend",
      authorId: "u-bob"
    },
    {
      id: "p-3",
      title: "Review my code for security vulnerabilities",
      useCase: "Perform a security inspection on code snippets to detect SQL injections, XSS, and authorization bypasses.",
      model: "Claude 4.8, GPT-5.5",
      template: "You are a professional security auditor. Perform a thorough static application security testing (SAST) review on the following code snippet: [paste code]. Specifically look for: 1. SQL Injection / NoSQL Injection. 2. Cross-Site Scripting (XSS). 3. Broken Object Level Authorization (BOLA/IDOR). 4. Insecure direct object references. 5. Lack of input sanitization or rate limiting. For each vulnerability found, explain the severity, the threat vector, and provide the secure refactored code block.",
      effectNote: "Provides a good sanity check before merging to master.",
      category: "Debug",
      tags: "#Security,#Audit,#CodeReview",
      authorId: "u-alice"
    },
    {
      id: "p-4",
      title: "Design a REST API schema for feature",
      useCase: "Generate clean API schemas, HTTP methods, response shapes, and database relationship guidelines for a new feature.",
      model: "Claude 4.8, GPT-5.5, Gemini 3.5",
      template: "You are a Senior Systems Architect. I need to design a RESTful API for a new feature: [describe feature, e.g., e-commerce shopping cart]. Please provide: 1. The list of endpoints with correct HTTP methods (GET, POST, PUT, DELETE). 2. Request body structure (JSON) and query parameters with type descriptions. 3. Success and error response payloads (JSON) including status codes (200, 201, 400, 401, 404, 500). 4. Recommendations for Prisma database models and foreign keys to support this API.",
      effectNote: "Excellent for mapping out side projects.",
      category: "Architecture",
      tags: "#API,#Architecture,#REST,#Design",
      authorId: "u-charlie"
    },
    {
      id: "p-5",
      title: "Write a Next.js Server Action with error handling",
      useCase: "Generate clean, type-safe Next.js Server Actions with Zod validation and structured result states.",
      model: "Claude 4.8, GPT-5.5",
      template: "Write a Next.js Server Action in TypeScript for handling [describe action, e.g., user profile updates]. The action must: 1. Validate incoming data using a Zod schema. 2. Perform authentication verification (assume a helper getSession() is available). 3. Perform database operations using Prisma. 4. Handle all exceptions and return a consistent response object: { success: true, data: ... } or { success: false, error: 'User-friendly message', validationErrors: [...] }. 5. Call revalidatePath or revalidateTag to refresh cache where appropriate. Provide the full file code.",
      effectNote: "Consistent actions template that avoids React 19 form errors.",
      category: "Coding",
      tags: "#NextJS,#ServerActions,#Zod,#Prisma",
      authorId: "u-evan"
    },
    {
      id: "p-6",
      title: "Convert this UI description to Tailwind classes",
      useCase: "Translate copy or design requirements into structured HTML/React with semantic tags and Tailwind styling.",
      model: "Claude 4.8, GPT-5.5, Gemini 3.5",
      template: "Translate the following design description into a clean, modern, responsive HTML/React component styled entirely with Tailwind CSS: [describe UI, e.g., premium pricing tier card grid]. Requirements: 1. Use semantic HTML (article, section, nav, etc.). 2. Apply a cohesive color scheme (like slate/zinc dark theme with rich violet gradients). 3. Ensure hover animations, transitions, and active button scaling are implemented for micro-interactions. 4. Ensure it is fully responsive (mobile-first, md, lg breakpoints). Output only the complete code block.",
      effectNote: "Great for quick front-end landing sections.",
      category: "UI",
      tags: "#Tailwind,#UI,#UX,#React",
      authorId: "u-dana"
    },
    {
      id: "p-7",
      title: "Debug this React useEffect infinite loop",
      useCase: "Analyze react dependency arrays and state setters that cause rendering loops, and resolve them.",
      model: "Claude 4.8, GPT-5.5",
      template: "Analyze this React component which is causing an infinite rendering loop: [paste component]. Identify: 1. Which state change inside the useEffect hook is triggering the re-render. 2. What dependencies in the dependency array are unstable (e.g., object references, inline functions, array arrays). 3. Provide the corrected component using refactored handlers, useCallback, useMemo, or setting state conditionally to avoid loops.",
      effectNote: "Saves hours of troubleshooting React state loops.",
      category: "Debug",
      tags: "#React,#useEffect,#Debug,#InfiniteLoop",
      authorId: "u-bob"
    },
    {
      id: "p-8",
      title: "Write unit tests for this function",
      useCase: "Generate Vitest/Jest unit tests covering success, boundary, and error cases with mocked dependencies.",
      model: "Claude 4.8, GPT-5.5",
      template: "You are a Quality Assurance Engineer. Write a comprehensive suite of unit tests using Vitest (or Jest) for the following function: [paste function]. The test suite must cover: 1. Happy path cases with typical inputs. 2. Edge cases (null, empty strings, boundary limits, empty arrays). 3. Error handling cases where inputs are invalid. 4. Mocking external imports or database clients if any. Use descriptive test titles (e.g., 'should throw an error when ID is empty') and clean assertions.",
      effectNote: "Speeds up unit testing coverage tremendously.",
      category: "Coding",
      tags: "#Testing,#Vitest,#Jest,#QA",
      authorId: "u-evan"
    },
    {
      id: "p-9",
      title: "Optimize this SQL/Prisma query for performance",
      useCase: "Identify N+1 queries, missing indexes, and unoptimized join operations to speed up database queries.",
      model: "Claude 4.8, GPT-5.5",
      template: "Analyze the following database query or Prisma client call: [paste query/code]. The query is currently slow in production under high loads. Please: 1. Identify bottlenecks such as N+1 query patterns, missing index fields, or unnecessary selecting of large fields (like text bodies). 2. Provide the optimized Prisma query using select/include filters, pagination, or raw SQL. 3. Suggest exactly which SQL indexes (CREATE INDEX commands) should be added to the schema.",
      effectNote: "Crucial for scaling applications when data sizes grow.",
      category: "Architecture",
      tags: "#SQL,#Prisma,#Performance,#Database",
      authorId: "u-charlie"
    },
    {
      id: "p-10",
      title: "Generate a complete landing page component",
      useCase: "Produce a high-conversion SaaS landing page with hero, features, testimonials, and FAQ sections.",
      model: "Claude 4.8, GPT-5.5",
      template: "You are a Growth Marketer and Front-end Developer. Write a complete React landing page component for: [describe SaaS, e.g., AI resume builder]. The page should include: 1. A hero section with a bold value proposition, call-to-action button, and subtle background glow. 2. A 3-column features grid with elegant icons. 3. A social proof testimonial slider/section. 4. A clean accordion-style FAQ section. Use Tailwind CSS with dark mode elements and interactive transitions. Provide the code for the entire file.",
      effectNote: "Creates stunning initial templates for marketing pages.",
      category: "UI",
      tags: "#LandingPage,#SaaS,#Tailwind,#React",
      authorId: "u-dana"
    },
    {
      id: "p-11",
      title: "Explain this error message like I'm 5",
      useCase: "Deconstruct complex compilation, runtime, or bundler error messages into layman explanations and steps to fix.",
      model: "Claude 4.8, GPT-5.5, Gemini 3.5",
      template: "Here is an error message from my console: [paste error message]. Please explain it to me like I am 5 years old: 1. What does the error actually mean in plain, non-jargon language? 2. Why did it happen (the typical root causes)? 3. What are the concrete, step-by-step instructions to troubleshoot and fix it in my codebase? Keep it friendly, simple, and avoid overly technical terms until the final fix steps.",
      effectNote: "Perfect when hit by obscure bundler or framework errors.",
      category: "Debug",
      tags: "#ExplainLikeIm5,#Error,#Debug,#Troubleshooting",
      authorId: "u-charlie"
    },
    {
      id: "p-12",
      title: "Create a Stripe webhook handler in Next.js",
      useCase: "Implement a secure Next.js API Route / Server Action to handle Stripe customer subscriptions and payments.",
      model: "Claude 4.8, GPT-5.5",
      template: "Write a complete Next.js App Router Route Handler (route.ts) for Stripe webhooks. The handler should: 1. Verify the signature securely using the stripe library and STRIPE_WEBHOOK_SECRET. 2. Handle these specific event types: checkout.session.completed, invoice.payment_succeeded, customer.subscription.deleted. 3. Update the database using Prisma to set the user's tier, subscription status, and stripe client details. 4. Log events cleanly and return proper HTTP status codes. Provide the complete code block.",
      effectNote: "Robust webhook template that works out of the box.",
      category: "API",
      tags: "#Stripe,#Webhooks,#API,#NextJS",
      authorId: "u-bot-seo"
    },
    {
      id: "p-13",
      title: "Write a system prompt for a coding assistant",
      useCase: "Design a customized system instructions file that controls the behavior, formatting, and stack choices of an LLM.",
      model: "Claude 4.8, GPT-5.5",
      template: "I want to create a `.cursorrules` or system prompt for my project. The tech stack is: [describe stack, e.g., Next.js 15, Tailwind v4, Prisma, SQLite]. Write a highly detailed system instruction that forces the assistant to: 1. Adopt a specific coding persona (e.g., senior staff engineer). 2. Avoid deprecated APIs and follow recent conventions. 3. Format code output cleanly without truncated snippets. 4. Maintain a clean codebase structure. Make it concise but comprehensive enough for the LLM to follow blindly.",
      effectNote: "Great for keeping AI assistants aligned with project rules.",
      category: "Coding",
      tags: "#SystemPrompt,#Cursorrules,#LLM,#AI",
      authorId: "u-evan"
    },
    {
      id: "p-14",
      title: "Review and improve this prompt template",
      useCase: "Optimize an existing prompt template by adding variables, constraints, and structural guidance for better AI responses.",
      model: "Claude 4.8, GPT-5.5",
      template: "Analyze the following prompt template: [paste template]. I want to make it produce more consistent, structured, and high-quality results. Please: 1. Identify potential areas of ambiguity or where the AI might deviate. 2. Suggest structural changes (e.g., Markdown headers, XML tags, few-shot examples). 3. Provide the improved version of the prompt template, clearly showing placeholders for variables like [input_code] or [language].",
      effectNote: "Helps refine prompts before automating them in apps.",
      category: "Other",
      tags: "#PromptEngineering,#Optimization,#AI",
      authorId: "u-bob"
    },
    {
      id: "p-15",
      title: "Generate realistic seed data for testing",
      useCase: "Generate JavaScript or Python scripts to generate bulk mock data using libraries or SQL scripts.",
      model: "Claude 4.8, GPT-5.5, Gemini 3.5",
      template: "Generate a Node.js seed script (`seed.js`) that populates a database with realistic, high-quality mock data for the following models: [describe models, e.g., User, Product, Order]. The script must: 1. Generate at least 10 entries per model with relations mapped correctly. 2. Use realistic names, emails, dates, and amounts (avoid simple 'test1', 'test2' strings). 3. Use standard Node.js imports and handle client initialization. Explain how to run it.",
      effectNote: "Saves a lot of manual testing preparation.",
      category: "Coding",
      tags: "#Seed,#Testing,#MockData,#Database",
      authorId: "u-alice"
    }
  ];

  for (const p of prompts) {
    await db.execute({
      sql: `INSERT INTO "Prompt" (id, title, useCase, model, template, effectNote, category, tags, authorId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [p.id, p.title, p.useCase, p.model, p.template, p.effectNote, p.category, p.tags, p.authorId],
    });
    console.log(`  ✓ Prompt: ${p.title}`);
  }

  // 验证
  console.log("\n🔍 Step 4: 验证数据...");
  const promptCount = await db.execute(`SELECT COUNT(*) as n FROM "Prompt"`);
  console.log(`  Prompt 数量: ${promptCount.rows[0].n}`);

  console.log("\n🎉 Turso Prompt 数据初始化完成！");
  db.close();
}

run().catch((e) => {
  console.error("❌ 种子脚本出错:", e);
  process.exit(1);
});
