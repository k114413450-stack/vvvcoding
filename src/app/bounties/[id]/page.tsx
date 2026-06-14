import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { db } from "@/lib/db";
import {
  ArrowLeft,
  DollarSign,
  Clock,
  ExternalLink,
  ShieldAlert,
  Terminal,
  MessageSquare,
  User,
  Compass,
} from "lucide-react";
import type { Metadata } from "next";

interface Params {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  const bounty = await db.bounty.findUnique({ where: { id } });

  return {
    title: bounty ? `${bounty.title} — VibeBounty Request` : "Bounty Details",
    description: bounty ? bounty.description.substring(0, 150) : "VibeBounty details.",
  };
}

export default async function BountyDetailPage({ params }: Params) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const bounty = await db.bounty.findUnique({
    where: { id },
    include: {
      author: true,
    },
  });

  if (!bounty) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200">
        <Navbar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center">
          <Compass className="h-12 w-12 text-slate-600 mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Bounty Not Found</h1>
          <p className="text-sm text-slate-500 mb-6">
            The requested micro-bounty could not be found or has been removed.
          </p>
          <Link
            href="/bounties"
            className="rounded-xl border border-slate-800 bg-slate-900 px-5 py-2.5 text-xs text-slate-350 hover:bg-slate-800 transition-colors"
          >
            Back to Bounties
          </Link>
        </main>
      </div>
    );
  }

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "OPEN":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "CLAIMED":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "EXPIRED":
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/20";
    }
  };

  const getSourceBadgeStyle = (source: string) => {
    switch (source) {
      case "Reddit":
        return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      case "IndieHackers":
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      default:
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
    }
  };

  const getTechRecommendations = (category: string) => {
    switch (category) {
      case "Shopify":
        return ["Shopify Webhooks / REST API", "Node.js (Next.js) or Python", "Serverless Functions (Vercel/AWS)"];
      case "Chrome Extension":
        return ["Manifest V3", "Vanilla JS / React", "Chrome Extension API (chrome.tabs, chrome.storage)"];
      case "Automation Script":
        return ["Node.js or Python", "Make.com (Integromat) webhook triggers", "Third-party SDK integrations"];
      case "Web Scraper":
        return ["Python (BeautifulSoup, Scrapy, Playwright)", "Node.js (Puppeteer, Cheerio)", "JSON / CSV parser libraries"];
      case "Discord / Slack Bot":
        return ["Discord.js or Slack Bolt SDK", "Node.js / TypeScript", "Railway or Render host deployable"];
      case "Landing Page":
        return ["React / Next.js", "Tailwind CSS v4", "Framer integrations"];
      case "AI Tool":
        return ["Gemini API (using @google/generative-ai SDK)", "Structured JSON Outputs logic", "Node.js / Next.js server actions"];
      default:
        return ["Node.js / Python", "Git / GitHub workflow", "Markdown documentation"];
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8 sm:px-6">
        {/* Back Link */}
        <Link
          href="/bounties"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Bounty Board</span>
        </Link>

        {/* Detail Box */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <div className="rounded-3xl border border-slate-900 bg-slate-950 p-6 sm:p-8 relative overflow-hidden shadow-xl">
              {/* Header Badges */}
              <div className="flex items-center justify-between gap-3 mb-4">
                <span className="inline-block rounded-md bg-slate-900 border border-slate-850 px-2.5 py-1 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                  {bounty.category}
                </span>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`inline-block rounded-md border px-2.5 py-1 text-[10px] font-bold ${getSourceBadgeStyle(
                      bounty.sourceType
                    )}`}
                  >
                    {bounty.sourceType}
                  </span>
                  <span
                    className={`inline-block rounded-md border px-2.5 py-1 text-[10px] font-bold ${getStatusBadgeStyle(
                      bounty.status
                    )}`}
                  >
                    {bounty.status}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-black text-white leading-tight mb-4">
                {bounty.title}
              </h1>

              {/* Description */}
              <div className="space-y-4 text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {bounty.description}
              </div>
            </div>

            {/* Deliverables / Specifications */}
            <div className="rounded-3xl border border-slate-900 bg-slate-900/10 p-6 sm:p-8">
              <h2 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-emerald-400" />
                <span>Recommended Technical Specs</span>
              </h2>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Based on the requirement, we recommend vibe-coders use the following stack and libraries to deliver this project in 1-3 days:
              </p>
              <ul className="space-y-2 text-xs text-slate-350">
                {getTechRecommendations(bounty.category).map((rec, i) => (
                  <li key={i} className="flex items-center gap-2.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Project Specs Card */}
            <div className="rounded-3xl border border-slate-900 bg-slate-950 p-6 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 top-0 -z-10 h-24 w-24 bg-gradient-to-bl from-emerald-500/5 to-transparent blur-xl" />

              <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-4">
                Bounty Overview
              </h3>

              <div className="space-y-4">
                {/* Budget */}
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Budget Range
                  </span>
                  <div className="flex items-center gap-1.5 text-emerald-400 font-black text-xl mt-0.5">
                    <DollarSign className="h-5 w-5 text-emerald-500 shrink-0" />
                    <span>
                      {bounty.budgetMin}-{bounty.budgetMax}{" "}
                      <span className="text-xs font-normal text-emerald-500 uppercase">
                        {bounty.currency}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Duration */}
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Timeline Limit
                  </span>
                  <div className="flex items-center gap-1.5 text-slate-200 font-bold text-sm mt-0.5">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span>{bounty.estimatedDays} days completion</span>
                  </div>
                </div>

                {/* Author */}
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 block">
                    Requester
                  </span>
                  <div className="flex items-center gap-2 text-slate-250 mt-1.5">
                    {bounty.author ? (
                      <>
                        <img
                          src={bounty.author.avatarUrl}
                          alt={bounty.author.username}
                          className="h-6 w-6 rounded-full border border-slate-800 bg-slate-900 object-cover"
                        />
                        <span className="text-xs font-medium">{bounty.author.username}</span>
                      </>
                    ) : (
                      <>
                        <User className="h-5 w-5 text-slate-500 bg-slate-900 p-0.5 rounded-full border border-slate-800" />
                        <span className="text-xs text-slate-450 italic">
                          {bounty.isCurated ? "Curated Poster" : "Anonymous Client"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-6 pt-6 border-t border-slate-900">
                {bounty.sourceType !== "Internal" && bounty.sourceUrl ? (
                  <a
                    href={bounty.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 px-4 py-2.5 text-xs font-bold text-slate-950 transition-all active:scale-95 text-center cursor-pointer shadow-lg shadow-emerald-950/20"
                  >
                    <span>View Original Post</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ) : (
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-slate-450 block uppercase">
                      Contact Details
                    </p>
                    <div className="rounded-lg bg-slate-900 border border-slate-850 px-3.5 py-2 text-xs font-mono text-slate-200 select-all truncate text-center">
                      {bounty.contactValue}
                    </div>
                    <p className="text-[10px] text-slate-500 text-center leading-normal">
                      ({bounty.contactMethod} direct outreach)
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Safety Disclaimer */}
            <div className="rounded-3xl border border-red-500/10 bg-red-500/5 p-5 border-dashed space-y-3 shadow-sm">
              <div className="flex items-center gap-2 text-red-400 font-extrabold text-xs uppercase tracking-wide">
                <ShieldAlert className="h-4 w-4 shrink-0 text-red-400" />
                <span>Safety Advisory</span>
              </div>
              <div className="text-[11px] text-slate-400 space-y-2 leading-relaxed">
                <p>
                  1. **Escrow Disclaimer**: VVVCODING does not handle transaction processing or disputes. All contracts and payments are outside our platform.
                </p>
                <p>
                  2. **Milestones**: Never deliver complete source code without receiving a deposit or using a trusted escrow contract (e.g. Upwork Direct Contract).
                </p>
                <p>
                  3. **Verify**: Check the client's profile or post history before starting work.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
