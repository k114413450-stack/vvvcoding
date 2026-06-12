import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Sparkles, Star, CheckCircle2, XCircle, Terminal, MessageSquare } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best AI Coding Tools 2026 — Community Reviews | VVVCODING",
  description: "Compare Cursor, GitHub Copilot, v0.dev, Windsurf, and more. Real reviews from AI-native developers. Updated by the VVVCODING community.",
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
    description: "The pioneer of inline code completion. Integrated natively inside VS Code, JetBrains, and Visual Studio. Excellent for boilerplate generation, quick API suggestions, and inline chat.",
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
    id: "windsurf",
    name: "Windsurf",
    emoji: "🏄",
    tagline: "The agentic IDE by Codeium",
    description: "An AI-powered editor featuring a collaborative agent environment. It is designed to work in synergy with the developer, performing multi-file operations while constantly adjusting based on user input.",
    website: "https://codeium.com/windsurf",
    pricing: "Free tier + $15/mo Pro",
    rating: 4.6,
    pros: ["Fluid collaborative flows between human and agent", "Powerful autocomplete using Codeium's proprietary models"],
    cons: ["Fewer community extensions compared to raw VS Code", "Interface changes can take time to get used to"],
    forumQuery: "Windsurf",
  },
  {
    id: "gemini",
    name: "Gemini CLI & API",
    emoji: "♊",
    tagline: "Google's flagship multimodal model",
    description: "Access Google's Gemini models directly through APIs or terminals. Exceptional for projects requiring massive context windows (up to 2M tokens) and processing multimodal inputs like audio, code, and video.",
    website: "https://ai.google.dev",
    pricing: "Pay-as-you-go / Free tier limits",
    rating: 4.4,
    pros: ["Humongous context window for scanning entire repos", "Fast processing speeds with multimodal understanding"],
    cons: ["SDK setup requires manual configuration", "Output formatting can occasionally require system prompts adjustment"],
    forumQuery: "Gemini",
  },
  {
    id: "claude",
    name: "Claude (via API)",
    emoji: "✍️",
    tagline: "State-of-the-art coding reasoning",
    description: "Anthropic's Claude 3.5 Sonnet is widely regarded as the most intelligent model for coding reasoning. It excels at explaining complex code logic, refactoring, and following architectural guidelines.",
    website: "https://anthropic.com",
    pricing: "Pay-as-you-go API keys",
    rating: 4.9,
    pros: ["Best-in-class reasoning and syntax accuracy", "Extremely articulate explanations of errors"],
    cons: ["API key management is required for direct programmatic usage", "Lacks a native desktop IDE layout without third-party tools"],
    forumQuery: "Claude",
  },
  {
    id: "chatgpt",
    name: "ChatGPT / GPT-4o",
    emoji: "💬",
    tagline: "Versatile general-purpose AI",
    description: "OpenAI's flagship assistant. Highly capable across various developer tasks, code explanations, script generation, and general programming Q&A. Supports custom GPT assistants for specific developer ecosystems.",
    website: "https://chatgpt.com",
    pricing: "Free tier + $20/mo Plus",
    rating: 4.5,
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
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">Tool Reviews</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">AI Coding Tools Reviews</h1>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-xl">
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
                      <p className="text-[10px] text-slate-500 mt-0.5">{t.tagline}</p>
                    </div>
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-1 bg-slate-950 border border-slate-900 rounded-lg px-2 py-1">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    <span className="text-[10px] font-bold font-mono text-slate-200">
                      {t.rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-400 mt-3 leading-relaxed">
                  {t.description}
                </p>

                {/* Pros and Cons */}
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-slate-900/60">
                  {/* Pros */}
                  <div>
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-500 block mb-1.5">
                      Pros
                    </span>
                    <ul className="space-y-1 text-slate-350 text-[11px]">
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
                    <span className="text-[9px] font-extrabold uppercase tracking-wider text-red-500 block mb-1.5">
                      Cons
                    </span>
                    <ul className="space-y-1 text-slate-350 text-[11px]">
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
              <div className="mt-6 pt-3 border-t border-slate-900/60 flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="text-[10px] text-slate-500">
                  Pricing: <strong className="text-slate-300 font-medium">{t.pricing}</strong>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={t.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-slate-400 hover:text-white transition-colors"
                  >
                    Official Site
                  </a>
                  <Link
                    href={`/?search=${encodeURIComponent(t.forumQuery)}`}
                    className="inline-flex items-center gap-1 rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-[10px] font-semibold text-slate-200 hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <MessageSquare className="h-3 w-3 text-purple-400" />
                    <span>View Discussions</span>
                  </Link>
                </div>
              </div>

            </div>
          ))}
        </div>

      </main>
    </div>
  );
}
