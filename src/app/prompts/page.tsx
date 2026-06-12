import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { db } from "@/lib/db";
import { Sparkles, Copy, Terminal, Compass, ArrowRight, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI Prompt Templates — VVVCODING",
  description: "Copy-ready prompt templates for Claude, GPT-4o, and Gemini. For Next.js, Tailwind, Prisma, Stripe, and more.",
  alternates: {
    canonical: "https://vvvcoding.com/prompts",
  },
};

interface Props {
  searchParams: Promise<{ category?: string }>;
}

export default async function PromptsPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const selectedCategory = resolvedSearchParams?.category || "All";

  const categories = [
    { name: "All", label: "All Prompts" },
    { name: "Coding", label: "Coding" },
    { name: "Debug", label: "Debug" },
    { name: "Architecture", label: "Architecture" },
    { name: "UI", label: "UI" },
    { name: "API", label: "API" },
    { name: "Other", label: "Other" },
  ];

  const prompts = await db.prompt.findMany({
    where: selectedCategory && selectedCategory !== "All" ? { category: selectedCategory } : {},
    include: { author: true },
    orderBy: [
      { copyCount: "desc" },
      { createdAt: "desc" }
    ],
  });

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case "Coding":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Debug":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      case "Architecture":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "UI":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      case "API":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getTierBadgeStyle = (tier: string) => {
    switch (tier) {
      case "Vibe Master":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "Prompt Wizard":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "No-code Explorer":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          
          {/* Main Prompts List */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Page Header Header */}
            <div className="relative rounded-2xl border border-slate-900 bg-slate-900/10 p-6 overflow-hidden">
              <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-gradient-to-br from-purple-600/10 to-emerald-500/10 blur-2xl" />
              <div className="relative flex items-center gap-2 mb-2">
                <Terminal className="h-5 w-5 text-purple-400" />
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400">Prompts Database</span>
              </div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight">AI Prompt Templates</h1>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-xl">
                Copy-ready, structured prompt templates designed to keep AI coding assistants like Claude, GPT, and Gemini focused and high-performing.
              </p>
            </div>

            {/* Category Navigation Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex flex-wrap gap-1">
                {categories.map((cat) => {
                  const isActive = selectedCategory === cat.name;
                  const href = cat.name === "All" ? "/prompts" : `/prompts?category=${cat.name}`;
                  return (
                    <Link
                      key={cat.name}
                      href={href}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all ${
                        isActive
                          ? "bg-slate-900 border-slate-700 text-white shadow"
                          : "border-transparent text-slate-400 hover:text-slate-200"
                      }`}
                    >
                      {cat.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* List of Prompts */}
            {prompts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-850 p-12 text-center bg-slate-900/10">
                <Compass className="h-10 w-10 text-slate-500 mb-3" />
                <h3 className="text-sm font-semibold text-slate-300">No prompts found</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Select another category or check back later!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prompts.map((p) => (
                  <div
                    key={p.id}
                    className="group rounded-2xl border border-slate-900 bg-slate-900/10 p-5 hover:bg-slate-900/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Row: category & copy count */}
                      <div className="flex items-center justify-between mb-3">
                        <span
                          className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${getCategoryStyle(
                            p.category
                          )}`}
                        >
                          {p.category}
                        </span>
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono">
                          <Copy className="h-3 w-3" />
                          <span>{p.copyCount} copies</span>
                        </div>
                      </div>

                      {/* Title */}
                      <Link
                        href={`/prompts/${p.id}`}
                        className="block text-slate-100 font-bold text-sm group-hover:text-purple-400 transition-colors leading-snug"
                      >
                        {p.title}
                      </Link>

                      {/* Use case */}
                      <p className="text-slate-400 text-xs mt-2 line-clamp-2 leading-relaxed">
                        {p.useCase}
                      </p>

                      {/* Model Tags */}
                      <div className="mt-3 flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500">Target Models:</span>
                        <span className="text-[10px] font-medium bg-slate-950 border border-slate-850 px-1.5 py-0.5 rounded text-slate-300">
                          {p.model}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Author & Action Button */}
                    <div className="mt-5 pt-3 border-t border-slate-900/60 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <img
                          src={p.author.avatarUrl}
                          alt={p.author.username}
                          className="h-5 w-5 rounded-full border border-slate-800 object-cover"
                        />
                        <span className="text-[10px] text-slate-400 truncate max-w-[80px]">
                          {p.author.username}
                        </span>
                      </div>
                      
                      <Link
                        href={`/prompts/${p.id}`}
                        className="flex items-center gap-1 text-[10px] font-bold text-purple-400 group-hover:text-purple-300 transition-colors"
                      >
                        <span>View & Copy</span>
                        <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            
            {/* Sidebar community card */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/15 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Prompt Engineering
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                A structured prompt tells the AI how to act, what rules to follow, and what libraries to use. Avoid generic instructions and use templates to get 10x cleaner code.
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-500">
                <li className="flex items-center gap-1.5"><span className="text-emerald-400">→</span> Role & constraints set</li>
                <li className="flex items-center gap-1.5"><span className="text-purple-400">→</span> Input validation defined</li>
                <li className="flex items-center gap-1.5"><span className="text-indigo-400">→</span> Avoid code hallucinations</li>
              </ul>
            </div>

            {/* Quick tips */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/15 p-5 text-xs">
              <h3 className="font-bold text-slate-350 mb-2 uppercase tracking-wider text-[10px]">
                Copying Tips
              </h3>
              <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
                <li>Paste prompts in Composer mode</li>
                <li>Add your database models</li>
                <li>Verify generated file routes</li>
              </ul>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
