import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Sparkles, Star, CheckCircle2, XCircle, Terminal, MessageSquare, Globe } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best AI Coding Tools & Hosting 2026 — VVVCODING Community Reviews",
  description: "Compare Cursor, GitHub Copilot, v0.dev, and more. Plus: best hosting for vibe coders — DigitalOcean, Hetzner, Railway, Vercel. Real reviews from the VVVCODING community.",
  alternates: {
    canonical: "https://vvvcoding.com/tools",
  },
};

const TOOLS = [
  {
    id: "cursor",
    name: "Cursor",
    emoji: "🖱️",
    tagline: "The AI-first code editor",
    description: "A fork of VS Code built around AI assistance. It features Composer mode, which allows you to edit multiple files concurrently with one prompt, inline code generation, and codebase-wide indexing for context.",
    website: "https://cursor.sh",
    pricing: "Free tier + $20/mo Pro",
    rating: 4.8,
    pros: ["Outstanding Composer mode for multi-file edits", "Deep context understanding of entire codebase"],
    cons: ["Proprietary editor built as a fork of VS Code", "Occasional sync lag with standard VS Code extensions"],
    forumQuery: "Cursor",
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    emoji: "🤖",
    tagline: "Your AI pair programmer",
    description: "The pioneer of inline code completion. Integrated natively inside VS Code, JetBrains, and Visual Studio. Powering coding flows using OpenAI's latest GPT-5.5 models.",
    website: "https://github.com/features/copilot",
    pricing: "Free for students + $10/mo Individual",
    rating: 4.5,
    pros: ["Industry-standard integration and ultra-fast completions", "Great for enterprise teams with tight security requirements"],
    cons: ["Lacks advanced multi-file orchestrating features", "Can sometimes suggest outdated library methods"],
    forumQuery: "Copilot",
  },
  {
    id: "v0dev",
    name: "v0.dev",
    emoji: "🎨",
    tagline: "Generative UI by Vercel",
    description: "Generates production-ready React, Tailwind, and Shadcn/ui code from natural language prompts. It allows you to prototype complete UI designs and directly copy individual elements into your codebase.",
    website: "https://v0.dev",
    pricing: "Free credits + $20/mo Premium",
    rating: 4.7,
    pros: ["Stunning React component outputs ready to copy-paste", "Perfect integration with Shadcn/ui and Tailwind v4"],
    cons: ["Strictly focused on front-end layouts, no business logic", "Consumes credits rapidly for complex generations"],
    forumQuery: "v0dev",
  },
  {
    id: "antigravity",
    name: "Antigravity (Google)",
    emoji: "🛸",
    tagline: "Google's premier agentic coding assistant",
    description: "Google's agentic coding IDE — the 2026 evolution of Windsurf after Google's acquisition. Deep multi-file agent workflows, workspace-aware edits, and tight integration with Gemini 3.5.",
    website: "https://google.com",
    pricing: "Google Workspace / API Tier",
    rating: 4.9,
    pros: ["Outstanding multi-file agentic execution pipeline", "Native Google ecosystem integrations and low latency"],
    cons: ["Requires workspace environment setups", "Higher resource requirements for large codebases"],
    forumQuery: "Antigravity",
  },
  {
    id: "gemini",
    name: "Gemini 3.5",
    emoji: "♊",
    tagline: "Google's flagship multimodal model",
    description: "Access Google's Gemini 3.5 models directly through APIs or terminals. Exceptional for projects requiring massive context windows (up to 2M tokens) and processing multimodal inputs like audio, code, and video.",
    website: "https://ai.google.dev",
    pricing: "Pay-as-you-go / Free tier limits",
    rating: 4.8,
    pros: ["Humongous context window for scanning entire repos", "Fast processing speeds with multimodal understanding"],
    cons: ["SDK setup requires manual configuration", "Output formatting can occasionally require system prompts adjustment"],
    forumQuery: "Gemini",
  },
  {
    id: "claude",
    name: "Claude 4.8",
    emoji: "✍️",
    tagline: "State-of-the-art coding reasoning",
    description: "Anthropic's Claude 4.8 Sonnet is widely regarded as the most intelligent model for coding reasoning. It excels at explaining complex code logic, refactoring, and following architectural guidelines.",
    website: "https://anthropic.com",
    pricing: "Pay-as-you-go API keys",
    rating: 4.9,
    pros: ["Best-in-class reasoning and syntax accuracy", "Extremely articulate explanations of errors"],
    cons: ["API key management is required for direct programmatic usage", "Lacks a native desktop IDE layout without third-party tools"],
    forumQuery: "Claude",
  },
  {
    id: "chatgpt",
    name: "ChatGPT / GPT-5.5",
    emoji: "💬",
    tagline: "Versatile general-purpose AI",
    description: "OpenAI's flagship assistant powered by GPT-5.5. Highly capable across various developer tasks, code explanations, script generation, and custom GPT models.",
    website: "https://chatgpt.com",
    pricing: "Free tier + $20/mo Plus",
    rating: 4.6,
    pros: ["Large library of pre-configured developer GPT custom assistants", "Highly responsive and versatile across multi-language projects"],
    cons: ["Coding reasoning is sometimes surpassed by Claude", "Web UI interface can feel disconnected from the editor"],
    forumQuery: "GPT",
  },
  {
    id: "continue",
    name: "Continue.dev",
    emoji: "⏩",
    tagline: "Open-source autopilot extension",
    description: "An open-source IDE extension that lets you plug in any LLM (local or cloud-based) as your coding copilot. Fully customizable keyboard shortcuts, prompt templates, and context providers.",
    website: "https://continue.dev",
    pricing: "100% Free & Open Source",
    rating: 4.3,
    pros: ["Complete data privacy with local model support (Ollama)", "Fully open source and heavily customizable"],
    cons: ["Requires manual configuration of models and endpoints", "Autocomplete latency depends heavily on local hardware"],
    forumQuery: "Tools",
  }
];

const HOSTING = [
  {
    id: "digitalocean",
    name: "DigitalOcean",
    emoji: "🌊",
    tagline: "The vibe coder's favorite cloud",
    description: "Simple VPS Droplets starting at $4/mo. Best beginner UX in cloud hosting. Great for running Node.js apps, bots, and Ollama local models. Generous $200 free credit for new users.",
    website: "https://www.digitalocean.com/",
    affiliateUrl: "PLACEHOLDER_DIGITALOCEAN_AFFILIATE",
    credit: "$200 free credit for 60 days",
    pricing: "From $4/mo",
    pros: ["Best beginner dashboard in the industry", "$200 free credit to start", "1-click app deploys (Node, Python, Postgres)"],
    cons: ["Pricier than Hetzner for raw compute", "No serverless option"],
    badge: "BEGINNER PICK",
    badgeColor: "emerald",
  },
  {
    id: "hetzner",
    name: "Hetzner Cloud",
    emoji: "🇩🇪",
    tagline: "Insane value European VPS",
    description: "German cloud provider with the best price-to-performance ratio in the market. A 2-core / 4GB RAM server costs ~€3.29/mo. Popular with developers running self-hosted AI inference and heavy bots.",
    website: "https://www.hetzner.com/cloud",
    affiliateUrl: "PLACEHOLDER_HETZNER_AFFILIATE",
    credit: "€20 free credit",
    pricing: "From €3.29/mo",
    pros: ["Best price/performance ratio globally", "European data centers (GDPR compliant)", "Excellent for running Ollama or heavy bots 24/7"],
    cons: ["Slightly complex network setup for beginners", "No US West Coast data center"],
    badge: "BEST VALUE",
    badgeColor: "purple",
  },
  {
    id: "railway",
    name: "Railway",
    emoji: "🚂",
    tagline: "Deploy in seconds, no DevOps",
    description: "The most vibe-friendly deployment platform. Connect your GitHub repo, Railway detects the framework and deploys. Supports Next.js, databases, cron jobs. No YAML files needed.",
    website: "https://railway.app",
    affiliateUrl: "PLACEHOLDER_RAILWAY_AFFILIATE",
    credit: "$5 free credit/month",
    pricing: "Free tier + $5/mo Hobby",
    pros: ["Literally zero config — connect repo and ship", "Supports databases, cron jobs, background workers", "Perfect for vibe coders who hate DevOps"],
    cons: ["Smaller ecosystem than AWS/GCP", "Free tier has usage limits"],
    badge: "ZERO CONFIG",
    badgeColor: "indigo",
  },
  {
    id: "vercel",
    name: "Vercel",
    emoji: "▲",
    tagline: "The Next.js home base",
    description: "If you're building with Next.js, Vercel is the default choice. Instant global CDN, automatic HTTPS, preview deployments per PR. The free Hobby plan covers most indie project needs.",
    website: "https://vercel.com",
    affiliateUrl: "PLACEHOLDER_VERCEL_AFFILIATE",
    credit: "Generous free Hobby tier",
    pricing: "Free Hobby + $20/mo Pro",
    pros: ["Native Next.js support and zero-config deploys", "Edge network for global low-latency", "Free tier is surprisingly capable"],
    cons: ["Serverless functions time out at 10s (Hobby)", "Gets expensive at scale vs self-hosted"],
    badge: "NEXT.JS PICK",
    badgeColor: "slate",
  },
];

const NETWORK = [
  {
    id: "flowercloud",
    name: "FlowerCloud",
    emoji: "🌸",
    tagline: "IEPL proxy network (APAC)",
    description:
      "A subscription-based proxy network (often called an “airport” in Chinese dev circles) — not a VPS. Uses Shadowsocks/Trojan over IEPL private lines with nodes in HK, JP, SG, US, and more. Some developers in APAC use it for stable access to Cursor, GitHub, npm, and AI APIs when routing is poor. Requires Clash, Surge, Shadowrocket, or similar.",
    website: "https://api-flowercloud.com",
    affiliateUrl: "https://api-flowercloud.com/aff.php?aff=22466",
    credit: "Discount via referral link",
    pricing: "From ~¥10/mo (traffic plans)",
    pros: [
      "Low-latency IEPL routes for HK/JP/SG/US",
      "Useful for reaching dev tools & AI APIs in APAC",
      "Long-running provider (est. 2021)",
    ],
    cons: [
      "This is a proxy subscription — not cloud hosting",
      "Needs a compatible client; not for deploying your app",
      "Support portal is mainly Chinese",
    ],
    badge: "PROXY · APAC",
    badgeColor: "pink",
  },
];

export default function ToolsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-grow mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        
        {/* Header */}
        <div className="relative rounded-2xl border border-slate-900 bg-slate-900/10 p-6 overflow-hidden mb-6">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-gradient-to-br from-purple-600/10 to-emerald-500/10 blur-2xl" />
          <div className="relative flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-purple-400">Tool Reviews</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">AI Coding Tools Reviews</h1>
          <p className="text-sm text-slate-400 mt-1.5 leading-relaxed max-w-xl">
            Real evaluations and scores for the most popular AI-native developer utilities. Learn about their strengths, weaknesses, and pricing, and see what the community is talking about.
          </p>
        </div>

        {/* Grid of Tool Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TOOLS.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl border border-slate-900 bg-slate-900/10 p-6 flex flex-col justify-between hover:bg-slate-900/25 transition-all shadow-xl"
            >
              <div>
                {/* Header row */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl" role="img" aria-label={t.name}>
                      {t.emoji}
                    </span>
                    <div>
                      <h2 className="text-base font-bold text-white leading-tight">
                        {t.name}
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">{t.tagline}</p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-900 rounded-lg px-2 py-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-xs font-bold font-mono text-slate-200">
                      {t.rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm text-slate-400 mt-3 leading-relaxed">
                  {t.description}
                </p>

                {/* Pros and Cons */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-900/60">
                  {/* Pros */}
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-500 block mb-1.5">
                      Pros
                    </span>
                    <ul className="space-y-1.5 text-slate-350 text-sm">
                      {t.pros.map((pro, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/80 shrink-0 mt-0.5" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Cons */}
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-red-500 block mb-1.5">
                      Cons
                    </span>
                    <ul className="space-y-1.5 text-slate-350 text-sm">
                      {t.cons.map((con, index) => (
                        <li key={index} className="flex items-start gap-1">
                          <XCircle className="h-3.5 w-3.5 text-red-500/80 shrink-0 mt-0.5" />
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="mt-6 pt-3 border-t border-slate-900/60 flex items-center justify-between flex-wrap gap-2 text-sm">
                <div className="text-xs text-slate-500">
                  Pricing: <strong className="text-slate-300 font-medium">{t.pricing}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={t.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-400 hover:text-white transition-colors"
                  >
                    Official Site
                  </a>
                  <Link
                    href={`/?search=${encodeURIComponent(t.forumQuery)}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <MessageSquare className="h-3 w-3 text-purple-400" />
                    <span>View Discussions</span>
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Hosting & Deployment Section */}
        <div className="mt-12">
          {/* Section Header */}
          <div className="flex items-center gap-3 mb-2">
            <Terminal className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Hosting & Deployment</h2>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
              Affiliate
            </span>
          </div>
          <p className="text-sm text-slate-500 mb-5 leading-relaxed max-w-xl">
            Where vibe coders deploy their apps. Community-recommended hosting platforms.{" "}
            <span className="text-slate-600">
              * Links marked Affiliate may earn us a commission at no extra cost to you.
            </span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {HOSTING.map((h) => {
              const badgeClasses: Record<string, string> = {
                emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
                purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
                indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
                slate: "bg-slate-500/10 text-slate-400 border-slate-500/20",
                pink: "bg-pink-500/10 text-pink-400 border-pink-500/20",
              };
              return (
                <div
                  key={h.id}
                  className="rounded-2xl border border-slate-900 bg-slate-900/10 p-5 flex flex-col justify-between hover:bg-slate-900/25 transition-all shadow-xl"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl" role="img" aria-label={h.name}>{h.emoji}</span>
                        <div>
                          <h3 className="text-base font-bold text-white leading-tight">{h.name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{h.tagline}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeClasses[h.badgeColor]}`}>
                        {h.badge}
                      </span>
                    </div>

                    <p className="text-sm text-slate-400 leading-relaxed mb-3">{h.description}</p>

                    <ul className="space-y-1.5 mb-2">
                      {h.pros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-sm text-slate-350">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/80 shrink-0 mt-0.5" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-900/60 flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-xs text-slate-500">
                      {h.pricing}{" "}
                      <span className="text-emerald-400 font-semibold">· {h.credit}</span>
                    </div>
                    <a
                      href={h.affiliateUrl === "PLACEHOLDER_DIGITALOCEAN_AFFILIATE"
                        || h.affiliateUrl.startsWith("PLACEHOLDER") ? h.website : h.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/10 border border-emerald-600/20 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-600/20 transition-all"
                    >
                      Get Started *
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Network Access Section */}
        <div className="mt-12">
          <div className="flex items-center gap-3 mb-2">
            <Globe className="h-5 w-5 text-pink-400" />
            <h2 className="text-lg font-bold text-white">Network Access (APAC)</h2>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded">
              Affiliate
            </span>
          </div>
          <p className="text-sm text-slate-500 mb-5 leading-relaxed max-w-xl">
            Proxy subscriptions for developers who need stable routes to dev tools and AI APIs — not for hosting your app.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {NETWORK.map((h) => {
              const badgeClasses: Record<string, string> = {
                pink: "bg-pink-500/10 text-pink-400 border-pink-500/20",
              };
              return (
                <div
                  key={h.id}
                  className="rounded-2xl border border-slate-900 bg-slate-900/10 p-5 flex flex-col justify-between hover:bg-slate-900/25 transition-all shadow-xl"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl" role="img" aria-label={h.name}>{h.emoji}</span>
                        <div>
                          <h3 className="text-base font-bold text-white leading-tight">{h.name}</h3>
                          <p className="text-xs text-slate-500 mt-0.5">{h.tagline}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badgeClasses[h.badgeColor]}`}>
                        {h.badge}
                      </span>
                    </div>

                    <p className="text-sm text-slate-400 leading-relaxed mb-3">{h.description}</p>

                    <ul className="space-y-1.5 mb-2">
                      {h.pros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-1.5 text-sm text-slate-350">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500/80 shrink-0 mt-0.5" />
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-900/60 flex items-center justify-between gap-2 flex-wrap">
                    <div className="text-xs text-slate-500">
                      {h.pricing}{" "}
                      <span className="text-emerald-400 font-semibold">· {h.credit}</span>
                    </div>
                    <a
                      href={h.affiliateUrl}
                      target="_blank"
                      rel="noopener noreferrer sponsored"
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-600/10 border border-emerald-600/20 px-3 py-1.5 text-xs font-bold text-emerald-400 hover:bg-emerald-600/20 transition-all"
                    >
                      Get Started *
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </main>
    </div>
  );
}
