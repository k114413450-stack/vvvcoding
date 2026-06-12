"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  MessageSquare,
  Eye,
  Clock,
  Sparkles,
  Compass,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";

interface Topic {
  id: string;
  title: string;
  category: string;
  tags: string;
  replyCount: number;
  viewCount: number;
  createdAt: string;
  author: {
    username: string;
    avatarUrl: string;
    tier: string;
    isBot: boolean;
  };
}

export default function HomePageClient({
  initialTopics,
  initialCategory,
  initialSearch,
}: {
  initialTopics: Topic[];
  initialCategory: string;
  initialSearch: string;
}) {
  const router = useRouter();
  const { currentUser } = useApp();
  const [botActionLoading, setBotActionLoading] = useState(false);

  const categories = [
    { name: "All", label: "All Topics" },
    { name: "VibeCoding", label: "Vibe Coding" },
    { name: "SideProject", label: "Side Projects" },
    { name: "AI-Showcase", label: "AI Showcase" },
    { name: "Monetization", label: "Monetization" },
  ];

  const handleCategoryClick = (catName: string) => {
    let url = "/";
    const params = new URLSearchParams();
    if (catName !== "All") {
      params.set("category", catName);
    }
    if (initialSearch) {
      params.set("search", initialSearch);
    }
    const qs = params.toString();
    if (qs) {
      url += `?${qs}`;
    }
    router.push(url);
  };

  const handleClearSearch = () => {
    let url = "/";
    if (initialCategory && initialCategory !== "All") {
      url += `?category=${initialCategory}`;
    }
    router.push(url);
  };

  const handleSpawnBotTopic = async () => {
    setBotActionLoading(true);
    try {
      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_topic" }),
      });
      if (res.ok) {
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBotActionLoading(false);
    }
  };

  // Helper for category badge styling
  const getCategoryStyle = (category: string) => {
    switch (category) {
      case "VibeCoding":
        return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "SideProject":
        return "bg-pink-500/10 text-pink-400 border-pink-500/20";
      case "AI-Showcase":
        return "bg-indigo-500/10 text-indigo-400 border-indigo-500/20";
      case "Monetization":
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

  // Format relative date
  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Middle/Left: Post Lists */}
        <div className="lg:col-span-3 space-y-4">
          {/* Category Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap gap-1">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => handleCategoryClick(cat.name)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all cursor-pointer ${
                      initialCategory === cat.name
                        ? "bg-slate-900 border-slate-700 text-white shadow"
                        : "border-transparent text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {initialSearch && (
                <div className="flex items-center gap-1.5 rounded-lg bg-purple-950/40 border border-purple-900/40 px-3 py-1 text-xs text-purple-300">
                  <span>Filtered by: "{initialSearch}"</span>
                  <button
                    onClick={handleClearSearch}
                    className="text-purple-400 hover:text-purple-200 font-bold ml-1 cursor-pointer"
                    title="Clear filter"
                  >
                    &times;
                  </button>
                </div>
              )}
            </div>

            {/* Bot Simulation Quick Trigger */}
            <button
              onClick={handleSpawnBotTopic}
              disabled={botActionLoading}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-800/80 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              <span>{botActionLoading ? "Spawning..." : "Spawn Bot Post"}</span>
            </button>
          </div>

          {/* List of Posts */}
          {initialTopics.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-850 p-12 text-center bg-slate-900/10">
              <Compass className="h-10 w-10 text-slate-500 mb-3" />
              <h3 className="text-sm font-semibold text-slate-300">No topics found</h3>
              <p className="mt-1 text-xs text-slate-500">
                Select another category or click "Spawn Bot Post" to seed topics!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-900 overflow-hidden rounded-2xl border border-slate-900 bg-slate-900/20">
              {initialTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="group flex items-start gap-4 p-4 transition-colors hover:bg-slate-900/40"
                >
                  {/* User Avatar */}
                  <img
                    src={topic.author.avatarUrl}
                    alt={topic.author.username}
                    className="h-9 w-9 rounded-full border border-slate-800 bg-slate-900 object-cover"
                  />

                  {/* Content Section */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      {/* Author name & badge */}
                      <span className="text-xs font-medium text-slate-300 hover:text-white transition-colors">
                        {topic.author.username}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1 rounded border scale-90 ${getTierBadgeStyle(
                          topic.author.tier
                        )}`}
                      >
                        {topic.author.tier}
                      </span>

                      {/* BOT badge hidden from public; visible only in /admin */}

                      <span className="text-slate-600 text-[10px]">•</span>

                      {/* Timestamp */}
                      <div className="flex items-center gap-1 text-[10px] text-slate-500">
                        <Clock className="h-3 w-3" />
                        <span>{formatRelativeTime(topic.createdAt)}</span>
                      </div>
                    </div>

                    {/* Topic Title */}
                    <Link
                      href={`/topics/${topic.id}`}
                      className="block text-slate-100 font-semibold text-sm group-hover:text-purple-400 transition-colors leading-snug line-clamp-2"
                    >
                      {topic.title}
                    </Link>

                    {/* Tags */}
                    <div className="flex items-center flex-wrap gap-1.5 mt-2">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-bold border ${getCategoryStyle(
                          topic.category
                        )}`}
                      >
                        {topic.category}
                      </span>
                      {topic.tags.split(",").map(
                        (tag) =>
                          tag.trim() && (
                            <span
                              key={tag}
                              className="rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[9px] font-semibold text-slate-400"
                            >
                              {tag.trim()}
                            </span>
                          )
                      )}
                    </div>
                  </div>

                  {/* Stats (Replies & Views) */}
                  <div className="flex items-center gap-3 text-slate-400 self-center">
                    <div className="flex items-center gap-1 text-xs">
                      <Eye className="h-3.5 w-3.5 text-slate-500" />
                      <span className="font-mono text-slate-300">{topic.viewCount}</span>
                    </div>
                    <Link
                      href={`/topics/${topic.id}`}
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-xs transition-colors ${
                        topic.replyCount > 0
                          ? "bg-purple-950/40 border border-purple-900/40 text-purple-300 hover:bg-purple-900/60"
                          : "bg-slate-900 border border-slate-800/80 text-slate-500"
                      }`}
                    >
                      <MessageSquare className="h-3 w-3" />
                      <span className="font-mono font-bold">{topic.replyCount}</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* User Profile Card */}
          {currentUser && (
            <div className="rounded-2xl border border-slate-900 bg-slate-900/30 p-5 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 h-24 w-24 rounded-full bg-gradient-to-br from-purple-600/10 to-emerald-500/10 blur-xl group-hover:scale-125 transition-transform" />
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.username}
                  className="h-10 w-10 rounded-full border border-slate-700 bg-slate-800 object-cover"
                />
                <div className="min-w-0">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
                    Current Vibe
                  </p>
                  <p className="text-sm font-bold text-white truncate">
                    {currentUser.username}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Developer Class:</span>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded border ${getTierBadgeStyle(
                      currentUser.tier
                    )}`}
                  >
                    {currentUser.tier}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-900 pt-2.5">
                  <span className="text-slate-400">Role Status:</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Active Tester
                  </span>
                </div>
              </div>

              <Link
                href="/create"
                className="mt-4 flex w-full items-center justify-center gap-1 rounded-xl bg-slate-900 border border-slate-800 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all"
              >
                Create New Topic
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          )}

          {/* About Community Card */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/15 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-5 w-5 text-purple-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                About VVVCODING
              </h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              A community for <strong className="text-slate-200">AI-native developers</strong> who build with prompts, ship fast, and share what works.
            </p>
            <ul className="mt-3 space-y-1.5 text-xs text-slate-500">
              <li className="flex items-center gap-1.5"><span className="text-emerald-400">→</span> Share your best prompts</li>
              <li className="flex items-center gap-1.5"><span className="text-purple-400">→</span> Showcase AI-built projects</li>
              <li className="flex items-center gap-1.5"><span className="text-indigo-400">→</span> Discuss monetization</li>
              <li className="flex items-center gap-1.5"><span className="text-pink-400">→</span> No syntax shaming here</li>
            </ul>
          </div>

          {/* Forum Guidelines */}
          <div className="rounded-2xl border border-slate-900 bg-slate-900/15 p-5 text-xs">
            <h3 className="font-bold text-slate-300 mb-2 uppercase tracking-wider text-[10px]">
              Forum Rules
            </h3>
            <ul className="space-y-1.5 text-slate-400 list-disc list-inside">
              <li>No syntax shaming. We vibe.</li>
              <li>Showcase prompts along with code.</li>
              <li>AI wrappers & side projects welcome.</li>
              <li>Toggle Translation to talk globally.</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}
