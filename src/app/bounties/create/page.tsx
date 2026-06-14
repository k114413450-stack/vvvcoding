"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useApp } from "@/context/AppContext";
import {
  ArrowLeft,
  PlusCircle,
  AlertTriangle,
  Info,
  Sparkles,
} from "lucide-react";

const CATEGORIES = [
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
  "Other",
];

const CONTACT_METHODS = ["Email", "Discord", "Telegram", "Link", "Other"];

export default function CreateBountyPage() {
  const router = useRouter();
  const { currentUser } = useApp();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("AI Tool");
  const [budgetMin, setBudgetMin] = useState("50");
  const [budgetMax, setBudgetMax] = useState("150");
  const [currency, setCurrency] = useState("USD");
  const [estimatedDays, setEstimatedDays] = useState("2");
  const [contactMethod, setContactMethod] = useState("Email");
  const [contactValue, setContactValue] = useState("");
  const [description, setDescription] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!title || !description || !contactValue) {
      setError("Please fill in all required fields.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/bounties", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          category,
          budgetMin: parseInt(budgetMin) || 0,
          budgetMax: parseInt(budgetMax) || 0,
          currency,
          estimatedDays: parseInt(estimatedDays) || 3,
          contactMethod,
          contactValue,
          description,
          authorId: currentUser?.id || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create bounty.");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/bounties");
        router.refresh();
      }, 1500);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-200">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-8 sm:px-6">
        {/* Back Link */}
        <Link
          href="/bounties"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6 group"
        >
          <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Bounty Board</span>
        </Link>

        {/* Title Section */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-purple-400 mb-2">
            <Sparkles className="h-3 w-3 animate-pulse" />
            <span>Create a new Request</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white leading-tight">
            Post a Micro-Bounty
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Describe the tool you need. Keep budgets between $50-$300 and scope within 1-3 days.
          </p>
        </div>

        {/* Form Container */}
        <div className="rounded-3xl border border-slate-900 bg-slate-950 p-6 sm:p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute right-0 top-0 -z-10 h-24 w-24 bg-gradient-to-bl from-purple-500/5 to-transparent blur-xl" />

          {success ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-4 animate-bounce">
                ✓
              </div>
              <h3 className="text-base font-bold text-white">Bounty Posted Successfully!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Redirecting you back to the board...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-xs text-red-400 flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-red-400 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Bounty Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Shopify single-to-box inventory sync script"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-xl border border-slate-850 bg-slate-900/40 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                />
              </div>

              {/* Category & Currency */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-850 bg-slate-900 px-3.5 py-2.5 text-xs text-slate-250 focus:border-emerald-500/50 focus:outline-none"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Currency
                  </label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full rounded-xl border border-slate-850 bg-slate-900 px-3.5 py-2.5 text-xs text-slate-250 focus:border-emerald-500/50 focus:outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="CNY">CNY (¥)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              {/* Budget Min/Max & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Min Budget
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="50"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(e.target.value)}
                    className="w-full rounded-xl border border-slate-855 bg-slate-900/40 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Max Budget
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="150"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(e.target.value)}
                    className="w-full rounded-xl border border-slate-855 bg-slate-900/40 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Time Limit (Days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    placeholder="2"
                    value={estimatedDays}
                    onChange={(e) => setEstimatedDays(e.target.value)}
                    className="w-full rounded-xl border border-slate-855 bg-slate-900/40 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>
              </div>

              {/* Contact Method & Value */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Contact Method <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={contactMethod}
                    onChange={(e) => setContactMethod(e.target.value)}
                    className="w-full rounded-xl border border-slate-850 bg-slate-900 px-3.5 py-2.5 text-xs text-slate-250 focus:border-emerald-500/50 focus:outline-none"
                  >
                    {CONTACT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Contact Details <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., discord_username or email@example.com"
                    value={contactValue}
                    onChange={(e) => setContactValue(e.target.value)}
                    className="w-full rounded-xl border border-slate-850 bg-slate-900/40 px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Explain exactly what problem the tool needs to solve, what inputs it should accept, and what outputs are expected. Specify any unique layout or integration requirements."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-850 bg-slate-900/40 px-4 py-3 text-xs text-slate-200 placeholder-slate-500 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/30 font-sans"
                />
              </div>

              {/* Guidelines Info */}
              <div className="rounded-xl border border-slate-900 bg-slate-900/10 p-4 text-[11px] text-slate-450 flex items-start gap-2.5 leading-relaxed">
                <Info className="h-4 w-4 shrink-0 text-slate-400 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-350">📝 Posting Guidelines</p>
                  <p>
                    By submitting this bounty, you agree to respond to developers who reach out. Do not share credentials, tokens, or secure data here. Bounties are public.
                  </p>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <Link
                  href="/bounties"
                  className="rounded-xl border border-slate-850 bg-transparent hover:bg-slate-900 px-5 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 px-6 py-2.5 text-xs font-bold text-slate-950 transition-all active:scale-95 shadow-md shadow-emerald-950/10 cursor-pointer disabled:opacity-50"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>{loading ? "Posting..." : "Post Bounty"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
