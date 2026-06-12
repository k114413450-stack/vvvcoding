import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import { db } from "@/lib/db";
import { ArrowLeft, Clock, Copy, Shield, Sparkles, Terminal } from "lucide-react";
import type { Metadata } from "next";
import PromptDetailClient from "./PromptDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

// Generate dynamic metadata for each prompt page (for Google)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const prompt = await db.prompt.findUnique({
    where: { id },
  });

  if (!prompt) {
    return { title: "Prompt Not Found — vvvcoding.com" };
  }

  return {
    title: `${prompt.title} — VVVCODING`,
    description: prompt.useCase,
    openGraph: {
      title: prompt.title,
      description: prompt.useCase,
      url: `https://vvvcoding.com/prompts/${prompt.id}`,
      siteName: "VVVCODING",
    },
    alternates: {
      canonical: `https://vvvcoding.com/prompts/${prompt.id}`,
    },
  };
}

export default async function PromptDetailPage({ params }: Props) {
  const { id } = await params;

  const prompt = await db.prompt.findUnique({
    where: { id },
    include: { author: true },
  });

  if (!prompt) {
    notFound();
  }

  // Split target models into structured tools for HowTo JSON-LD
  const targetTools = prompt.model.split(",").map((t) => ({
    "@type": "HowToTool",
    "name": t.trim(),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": prompt.title,
    "description": prompt.useCase,
    "tool": targetTools,
    "step": [
      {
        "@type": "HowToStep",
        "text": prompt.template,
      },
    ],
  };

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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-grow mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        
        {/* Back Link */}
        <Link
          href="/prompts"
          className="group inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to prompts
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          
          {/* Main Content Card */}
          <div className="lg:col-span-3 space-y-6">
            <article className="rounded-2xl border border-slate-900 bg-slate-900/10 p-6 shadow-2xl">
              
              {/* Header Meta Info */}
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={prompt.author.avatarUrl}
                  alt={prompt.author.username}
                  className="h-10 w-10 rounded-full border border-slate-800 bg-slate-900 object-cover"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-200">
                      {prompt.author.username}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${getTierBadgeStyle(
                        prompt.author.tier
                      )}`}
                    >
                      {prompt.author.tier}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>Posted on {new Date(prompt.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-xl font-bold text-white leading-tight mb-3">
                {prompt.title}
              </h1>

              {/* Category, tags, models */}
              <div className="flex items-center flex-wrap gap-1.5 mb-6">
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold border ${getCategoryStyle(
                    prompt.category
                  )}`}
                >
                  {prompt.category}
                </span>
                {prompt.tags.split(",").map(
                  (tag) =>
                    tag.trim() && (
                      <span
                        key={tag}
                        className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-[10px] font-semibold text-slate-400"
                      >
                        {tag.trim()}
                      </span>
                    )
                )}
              </div>

              {/* Use Case */}
              <div className="bg-slate-900/30 border border-slate-900/60 rounded-xl p-4 mb-6">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block mb-1">Use Case</span>
                <p className="text-slate-350 text-xs leading-relaxed font-sans">
                  {prompt.useCase}
                </p>
              </div>

              {/* Template Body */}
              <div className="border-t border-slate-900 pt-6">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Terminal className="h-4 w-4 text-purple-400" />
                    <span>Prompt Template</span>
                  </span>
                </div>

                <div className="relative rounded-xl border border-slate-850 bg-slate-950/80 p-4 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {prompt.template}
                </div>

                {/* Client Side Copy Button & PATCH Endpoint execution */}
                <div className="mt-4">
                  <PromptDetailClient id={prompt.id} template={prompt.template} />
                </div>
              </div>

              {/* Effect Note */}
              {prompt.effectNote && (
                <div className="mt-6 border-t border-slate-900 pt-6">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Effect & Tips
                  </span>
                  <p className="text-slate-400 text-xs leading-relaxed whitespace-pre-line font-sans">
                    {prompt.effectNote}
                  </p>
                </div>
              )}
            </article>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            
            {/* Stats Card */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/15 p-5 text-xs text-slate-400 space-y-3 shadow-lg">
              <h3 className="font-bold text-slate-350 uppercase tracking-wider text-[10px] border-b border-slate-850 pb-2">
                Prompt Stats
              </h3>
              <div className="flex justify-between">
                <span>Copy count:</span>
                <span className="font-semibold text-slate-200">{prompt.copyCount} copies</span>
              </div>
              <div className="flex justify-between">
                <span>Target Model:</span>
                <span className="font-semibold text-slate-200">{prompt.model}</span>
              </div>
              <div className="flex justify-between">
                <span>Created:</span>
                <span className="font-semibold text-slate-200">
                  {new Date(prompt.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Author details card */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/15 p-5 text-center shadow-lg">
              <img
                src={prompt.author.avatarUrl}
                alt={prompt.author.username}
                className="h-14 w-14 rounded-full border border-slate-850 bg-slate-900 object-cover mx-auto mb-3"
              />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Author
              </p>
              <h4 className="text-sm font-bold text-white mt-0.5">
                {prompt.author.username}
              </h4>
              <span
                className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded border mt-2 ${getTierBadgeStyle(
                  prompt.author.tier
                )}`}
              >
                {prompt.author.tier}
              </span>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
