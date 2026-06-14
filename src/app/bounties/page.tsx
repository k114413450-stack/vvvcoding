import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { db } from "@/lib/db";
import {
  Sparkles,
  ArrowRight,
  PlusCircle,
  Clock,
  DollarSign,
  Tag,
  ExternalLink,
  Search,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "VibeBounty — Find Paid Micro-Tool Requests",
  description: "Browse small software bounties ($50-$300) that can be built in 1-3 days with AI-assisted vibe coding.",
};

const CATEGORIES = [
  "All",
  "AI Tool",
  "Chrome Extension",
  "Automation Script",
  "Web Scraper",
  "Internal Tool",
  "Landing Page",
  "Notion / Airtable Tool",
  "Discord / Slack Bot",
  "Data Cleanup",
  "API Integration",
  "Shopify",
];

const STATUSES = ["All", "OPEN", "CLAIMED", "EXPIRED"];

interface Props {
  searchParams: Promise<{ category?: string; status?: string; search?: string }>;
}

export default async function BountiesPage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const activeCategory = resolvedSearchParams?.category || "All";
  const activeStatus = resolvedSearchParams?.status || "All";
  const searchQuery = resolvedSearchParams?.search || "";

  // Build filter query
  const whereClause: any = {};
  if (activeCategory !== "All") {
    whereClause.category = activeCategory;
  }
  if (activeStatus !== "All") {
    whereClause.status = activeStatus;
  }
  if (searchQuery) {
    whereClause.OR = [
      { title: { contains: searchQuery } },
      { description: { contains: searchQuery } },
    ];
  }

  const bounties = await db.bounty.findMany({
    where: whereClause,
    include: {
      author: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

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

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {/* Page Header */}
        <div className="relative mb-8 rounded-3xl border border-slate-900 bg-slate-900/10 p-6 sm:p-8 backdrop-blur-md shadow-xl overflow-hidden">
          <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-purple-500/5 blur-3xl" />
          <div className="absolute -right-20 -bottom-20 h-48 w-48 rounded-full bg-emerald-500/5 blur-3xl" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-[10px] font-bold tracking-wider uppercase text-emerald-400">
                <Sparkles className="h-3 w-3 animate-pulse" />
                <span>VibeBounty ⚡</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                Need a micro-tool? Post a bounty.
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                Browse small software bounties ($50-$300) that can be built in 1-3 days with AI-assisted coding. Direct collaboration, 0% platform fee.
              </p>
            </div>

            <div className="flex shrink-0">
              <Link
                href="/bounties/create"
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-950/20 transition-all active:scale-95 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Post a Bounty</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Filters Sidebar */}
          <div className="space-y-6">
            {/* Search Input */}
            <form method="GET" action="/bounties" className="relative">
              <input
                type="text"
                name="search"
                defaultValue={searchQuery}
                placeholder="Search requests..."
                className="w-full rounded-xl border border-slate-800 bg-slate-900/60 pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
              {activeCategory !== "All" && (
                <input type="hidden" name="category" value={activeCategory} />
              )}
              {activeStatus !== "All" && (
                <input type="hidden" name="status" value={activeStatus} />
              )}
            </form>

            {/* Categories */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5">
              <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                <span>Categories</span>
              </h3>
              <div className="flex flex-col gap-1">
                {CATEGORIES.map((cat) => {
                  const isActive = activeCategory === cat;
                  // Build URL
                  const params = new URLSearchParams();
                  if (cat !== "All") params.set("category", cat);
                  if (activeStatus !== "All") params.set("status", activeStatus);
                  if (searchQuery) params.set("search", searchQuery);
                  const href = `/bounties${params.toString() ? "?" + params.toString() : ""}`;

                  return (
                    <Link
                      key={cat}
                      href={href}
                      className={`rounded-lg px-3 py-2 text-xs transition-all flex items-center justify-between ${
                        isActive
                          ? "bg-slate-900 text-emerald-400 font-bold border border-slate-850"
                          : "text-slate-400 hover:text-slate-200 border border-transparent"
                      }`}
                    >
                      <span>{cat}</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Statuses */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5">
              <h3 className="text-xs uppercase font-bold tracking-wider text-slate-500 mb-3">
                Status
              </h3>
              <div className="flex flex-col gap-1">
                {STATUSES.map((stat) => {
                  const isActive = activeStatus === stat;
                  const params = new URLSearchParams();
                  if (activeCategory !== "All") params.set("category", activeCategory);
                  if (stat !== "All") params.set("status", stat);
                  if (searchQuery) params.set("search", searchQuery);
                  const href = `/bounties${params.toString() ? "?" + params.toString() : ""}`;

                  return (
                    <Link
                      key={stat}
                      href={href}
                      className={`rounded-lg px-3 py-2 text-xs transition-all ${
                        isActive
                          ? "bg-slate-900 text-emerald-400 font-bold border border-slate-850"
                          : "text-slate-400 hover:text-slate-200 border border-transparent"
                      }`}
                    >
                      {stat}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Platform info note */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-4 text-[11px] text-slate-500 space-y-2 leading-relaxed">
              <p className="font-bold text-slate-400">🛡️ Information Board Only</p>
              <p>
                VVVCODING is a matchmaker and discovery directory. We do not process payments or escrow funds.
              </p>
              <p>
                Developers and clients coordinate delivery and payment terms directly off-platform. Read our safety warnings in details pages before starting.
              </p>
            </div>
          </div>

          {/* Bounties Listing */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-900 pb-2">
              <span>Found {bounties.length} micro-bounties</span>
              {searchQuery && (
                <Link href="/bounties" className="text-purple-400 hover:underline">
                  Clear Search Filter
                </Link>
              )}
            </div>

            {bounties.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-900 p-16 text-center bg-slate-900/10">
                <Sparkles className="h-10 w-10 text-slate-600 mb-3" />
                <h3 className="text-sm font-semibold text-slate-350">No bounties found</h3>
                <p className="mt-2 text-xs text-slate-500">
                  Try clearing your search query or choosing another category filter.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bounties.map((bounty) => (
                  <div
                    key={bounty.id}
                    className="group flex flex-col justify-between rounded-2xl border border-slate-900 bg-slate-950 p-5 shadow-md transition-all hover:border-slate-800 hover:shadow-purple-950/5 relative overflow-hidden"
                  >
                    {/* Background glows */}
                    <div className="absolute right-0 top-0 -z-10 h-24 w-24 bg-gradient-to-bl from-purple-500/5 to-transparent blur-xl" />

                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="inline-block rounded-md bg-slate-900 border border-slate-850 px-2 py-0.5 text-[10px] font-semibold text-slate-400">
                          {bounty.category}
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${getSourceBadgeStyle(
                              bounty.sourceType
                            )}`}
                          >
                            {bounty.sourceType}
                          </span>
                          <span
                            className={`inline-block rounded-md border px-2 py-0.5 text-[10px] font-bold ${getStatusBadgeStyle(
                              bounty.status
                            )}`}
                          >
                            {bounty.status}
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors mb-2.5 line-clamp-1">
                        <Link href={`/bounties/${bounty.id}`}>
                          {bounty.title}
                        </Link>
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-slate-400 leading-relaxed mb-4 line-clamp-3">
                        {bounty.description}
                      </p>
                    </div>

                    {/* Bottom Metadata */}
                    <div className="border-t border-slate-900/60 pt-4 mt-auto flex items-center justify-between">
                      {/* Budget */}
                      <div className="flex items-center gap-1 text-emerald-400 font-extrabold text-sm">
                        <DollarSign className="h-4 w-4 shrink-0 text-emerald-500" />
                        <span>
                          {bounty.budgetMin}-{bounty.budgetMax}{" "}
                          <span className="text-[10px] font-normal text-emerald-500">
                            {bounty.currency}
                          </span>
                        </span>
                      </div>

                      {/* Estimated Days */}
                      <div className="flex items-center gap-1 text-slate-500 text-xs">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{bounty.estimatedDays}d limit</span>
                      </div>

                      {/* Detail CTA */}
                      <Link
                        href={`/bounties/${bounty.id}`}
                        className="flex items-center gap-1 text-[11px] font-semibold text-slate-350 hover:text-white transition-colors group/btn"
                      >
                        <span>Details</span>
                        <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
