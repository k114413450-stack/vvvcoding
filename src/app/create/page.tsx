"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useApp } from "@/context/AppContext";
import {
  ArrowLeft,
  Send,
  ChevronDown,
  Info,
} from "lucide-react";

const CATEGORY_TEMPLATES: Record<string, string> = {
  FileACase: `📁 Case filed at The Build Bureau

**What I want to build:**


**Who it's for:**


**Why I think it's needed:**


**What AI tool I'd use:** (Cursor / Lovable / Bolt / v0 / Replit / Antigravity)


**Honest concern:**


---
Bureau is open. What's the verdict?`,
  WebBuilds: `## What I built


## Live URL


## Built with
(Cursor / Lovable / Bolt / v0 / Replit / Antigravity)

## What stage is it?
- [ ] Just shipped
- [ ] Needs feedback
- [ ] Looking for first users
- [ ] Experiment / toy

## What feedback I want`,
  RoastMyPage: `## URL


## Target user


## What should visitors do?
(Sign up / Join waitlist / Buy / Try demo / Contact me)

## What I'm most worried about
- [ ] People don't understand it
- [ ] It looks too AI-generated
- [ ] No one clicks the CTA
- [ ] Mobile looks bad
- [ ] Other:`,
  DeployHelp: `**What I built:**


**What AI tool I used:**


**Where I'm stuck:**


**What I've tried so far:**


**Error message (if any):**`,
  Graveyard: `## What I built


## URL or screenshot


## Why I stopped


## What I learned


## Would I rebuild it?
`,
};

function CreateTopicForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, setCurrentUser, users } = useApp();

  const urlCategory = searchParams.get("category") || "FileACase";

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(urlCategory);
  const [tags, setTags] = useState("");
  const [content, setContent] = useState(CATEGORY_TEMPLATES[urlCategory] || "");
  const [submitting, setSubmitting] = useState(false);
  const [showFormIdentityMenu, setShowFormIdentityMenu] = useState(false);

  // When category changes, offer to load the template
  const handleCategoryChange = (newCat: string) => {
    setCategory(newCat);
    if (content === "" || content === CATEGORY_TEMPLATES[category]) {
      setContent(CATEGORY_TEMPLATES[newCat] || "");
    }
  };

  const getTierBadgeClass = (tier: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !currentUser) return;

    setSubmitting(true);
    try {
      const formattedTags = tags
        .split(",")
        .map((t) => (t.startsWith("#") ? t.trim() : `#${t.trim()}`))
        .filter((t) => t !== "#")
        .join(",");

      const res = await fetch("/api/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          category,
          tags: formattedTags,
          authorId: currentUser.id,
        }),
      });

      if (res.ok) {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      console.error("Failed to create topic:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="group flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to list
        </button>

        {/* Creation card */}
        <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-6 shadow-2xl">
          <div className="border-b border-slate-800 pb-4 mb-6">
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
              Create New Topic
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              File an idea, share a web build, request a roast, or ask about deployment.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Identity Switcher Dropdown (Inside form) */}
            {currentUser && (
              <div className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-4">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Posting Identity Selector
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowFormIdentityMenu(!showFormIdentityMenu)}
                    className="flex w-full items-center justify-between rounded-lg border border-slate-850 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:bg-slate-900 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.username}
                        className="h-6 w-6 rounded-full border border-slate-700 bg-slate-850 object-cover"
                      />
                      <span className="font-semibold text-xs text-slate-200">
                        {currentUser.username}
                      </span>
                      <span
                        className={`text-[8px] font-bold px-1.5 py-0.2 rounded border ${getTierBadgeClass(
                          currentUser.tier
                        )}`}
                      >
                        {currentUser.tier}
                      </span>
                      {currentUser.isBot && (
                        <span className="text-[8px] bg-red-950 text-red-400 border border-red-900 px-1 rounded font-mono">
                          BOT
                        </span>
                      )}
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </button>

                  {showFormIdentityMenu && (
                    <div className="absolute left-0 right-0 mt-1.5 max-h-52 overflow-y-auto origin-top rounded-xl border border-slate-850 bg-slate-950 p-1.5 shadow-2xl ring-1 ring-black ring-opacity-5 z-20 scrollbar-thin">
                      {users.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            setCurrentUser(u);
                            setShowFormIdentityMenu(false);
                          }}
                          className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-slate-900 ${
                            currentUser.id === u.id
                              ? "bg-slate-900 text-emerald-400 font-medium"
                              : "text-slate-300"
                          }`}
                        >
                          <img
                            src={u.avatarUrl}
                            alt={u.username}
                            className="h-5 w-5 rounded-full border border-slate-700 bg-slate-850 object-cover"
                          />
                          <div className="flex-1 truncate">
                            <p className="font-semibold text-[11px] truncate">{u.username}</p>
                            <span
                              className={`inline-block text-[8px] px-1 py-0.2 rounded border ${getTierBadgeClass(
                                u.tier
                              )}`}
                            >
                              u.tier
                            </span>
                          </div>
                          {u.isBot && (
                            <span className="text-[8px] bg-red-950 text-red-400 border border-red-900 px-1.5 rounded font-mono">
                              BOT
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-500">
                  <Info className="h-3 w-3 text-slate-400" />
                  <span>Allows testing and simulating threads under various personalities.</span>
                </div>
              </div>
            )}

            {/* Title */}
            <div>
              <label
                htmlFor="title"
                className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5"
              >
                Topic Title
              </label>
              <input
                type="text"
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cursor composer is cheating! Just built a SaaS in 1 hour."
                className="w-full rounded-xl border border-slate-850 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:border-purple-500 focus:bg-slate-950 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
              />
            </div>

            {/* Grid for Category and Tags */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Category */}
              <div>
                <label
                  htmlFor="category"
                  className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5"
                >
                  Category Node
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-850 bg-slate-950 px-3.5 py-2.5 text-sm text-slate-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                >
                  <option value="FileACase">📁 File a Case (idea validation)</option>
                  <option value="WebBuilds">🚀 Web Builds (show what you made)</option>
                  <option value="RoastMyPage">🔥 Roast My Page (get feedback)</option>
                  <option value="DeployHelp">🛠 Deploy Help (stuck on launch)</option>
                  <option value="AITools">🤖 AI Tools (tool discussion)</option>
                  <option value="Graveyard">⚰️ Graveyard (project postmortem)</option>
                </select>
              </div>

              {/* Tags */}
              <div>
                <label
                  htmlFor="tags"
                  className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5"
                >
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="e.g. Nextjs, Gemini, Cursor"
                  className="w-full rounded-xl border border-slate-850 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:border-purple-500 focus:bg-slate-950 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                />
              </div>
            </div>

            {/* Content */}
            <div>
              <label
                htmlFor="content"
                className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5"
              >
                Content Body
              </label>
              <textarea
                id="content"
                required
                rows={8}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your topic description here. Supports markdown or plain text styling."
                className="w-full rounded-xl border border-slate-850 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:border-purple-500 focus:bg-slate-950 focus:ring-1 focus:ring-purple-500 outline-none transition-all font-sans"
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Send className="h-4 w-4" />
                {submitting ? "Publishing..." : "Publish Topic"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default function CreateTopicPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500 text-sm bg-slate-950">Loading...</div>}>
      <CreateTopicForm />
    </Suspense>
  );
}
