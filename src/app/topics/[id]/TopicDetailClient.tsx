"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar";
import { useApp } from "@/context/AppContext";
import PostContent from "@/components/PostContent";
import {
  ArrowLeft,
  MessageSquare,
  Eye,
  Clock,
  Send,
  Sparkles,
  Bot,
  Globe,
  CornerDownRight,
  Shield,
} from "lucide-react";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  author: {
    username: string;
    avatarUrl: string;
    tier: string;
    isBot: boolean;
  };
}

interface Topic {
  id: string;
  title: string;
  content: string;
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
  comments: Comment[];
}

export default function TopicDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { currentUser } = useApp();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [botReplying, setBotReplying] = useState(false);

  // Translation States
  const [translatedTexts, setTranslatedTexts] = useState<Record<string, string>>({});
  const [translatingIds, setTranslatingIds] = useState<Record<string, boolean>>({});
  const [activeTranslations, setActiveTranslations] = useState<Record<string, boolean>>({});

  const fetchTopicDetails = async () => {
    try {
      const res = await fetch(`/api/topics/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTopic(data);
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopicDetails();
  }, [id]);

  const handleTranslate = async (itemId: string, text: string) => {
    // If already active, toggle off
    if (activeTranslations[itemId]) {
      setActiveTranslations((prev) => ({ ...prev, [itemId]: false }));
      return;
    }

    // If already translated, toggle on
    if (translatedTexts[itemId]) {
      setActiveTranslations((prev) => ({ ...prev, [itemId]: true }));
      return;
    }

    // Otherwise, fetch translation
    setTranslatingIds((prev) => ({ ...prev, [itemId]: true }));
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        setTranslatedTexts((prev) => ({ ...prev, [itemId]: data.translatedText }));
        setActiveTranslations((prev) => ({ ...prev, [itemId]: true }));
      }
    } catch (err) {
      console.error("Translation error:", err);
    } finally {
      setTranslatingIds((prev) => ({ ...prev, [itemId]: false }));
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUser || !topic) return;

    setSubmittingComment(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: newComment,
          authorId: currentUser.id,
          topicId: topic.id,
        }),
      });

      if (res.ok) {
        setNewComment("");
        fetchTopicDetails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleBotReply = async () => {
    if (!topic) return;
    setBotReplying(true);
    try {
      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_comment", topicId: topic.id }),
      });
      if (res.ok) {
        fetchTopicDetails();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setBotReplying(false);
    }
  };

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

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs < 0) {
      if (Math.abs(diffMs) < 60 * 1000) return "just now";
      return "scheduled";
    }
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!topic) return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />

      <main className="flex-grow mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        {/* Back Link */}
        <button
          onClick={() => router.push("/")}
          className="group flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to topics
        </button>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Left Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Main Post Card */}
            <article className="rounded-2xl border border-slate-900 bg-slate-900/10 p-6 shadow-2xl">
              {/* Header meta */}
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={topic.author.avatarUrl}
                  alt={topic.author.username}
                  className="h-10 w-10 rounded-full border border-slate-800 bg-slate-900 object-cover"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-slate-200">
                      {topic.author.username}
                    </span>
                    <span
                      className={`text-xs font-bold px-1.5 py-0.5 rounded border ${getTierBadgeStyle(
                        topic.author.tier
                      )}`}
                    >
                      {topic.author.tier}
                    </span>
                    {topic.author.isBot && (
                      <span className="text-[8px] bg-red-950/40 text-red-400 border border-red-900/30 px-1 rounded font-mono">
                        BOT
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatRelativeTime(topic.createdAt)}</span>
                  </div>
                </div>
              </div>

              {/* Title */}
              <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight mb-3">
                {topic.title}
              </h1>

              {/* Node Tags */}
              <div className="flex items-center flex-wrap gap-1.5 mb-6">
                <span
                  className={`rounded px-2 py-0.5 text-xs font-bold border ${getCategoryStyle(
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
                        className="rounded bg-slate-900 border border-slate-800 px-2 py-0.5 text-xs font-semibold text-slate-400"
                      >
                        {tag.trim()}
                      </span>
                    )
                )}
              </div>

              {/* Content Body */}
              <div className="border-t border-slate-900 pt-6">
                <PostContent
                  content={
                    activeTranslations[topic.id]
                      ? translatedTexts[topic.id]
                      : topic.content
                  }
                />


              </div>
            </article>

            {/* Replies / Comments Header */}
            <div className="flex items-center justify-between border-b border-slate-850 pb-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                <span>Replies ({topic.comments.length})</span>
              </h2>

              <button
                onClick={handleBotReply}
                disabled={botReplying}
                className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-850 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                <span>{botReplying ? "Replying..." : "Let Bot Reply"}</span>
              </button>
            </div>

            {/* Comments Thread (楼层) */}
            {topic.comments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-850 p-10 text-center bg-slate-900/5">
                <p className="text-xs text-slate-500">
                  No replies yet. Be the first to vibe reply or let a bot reply!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {topic.comments.map((comment, index) => (
                  <div
                    key={comment.id}
                    className="group rounded-2xl border border-slate-900 bg-slate-900/10 p-4 relative"
                  >
                    {/* Floor number */}
                    <span className="absolute top-4 right-4 text-[10px] font-bold font-mono text-slate-600">
                      #{index + 1}
                    </span>

                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <img
                        src={comment.author.avatarUrl}
                        alt={comment.author.username}
                        className="h-8 w-8 rounded-full border border-slate-800 bg-slate-900 object-cover mt-0.5"
                      />

                      {/* Reply main body */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="text-xs font-semibold text-slate-350">
                            {comment.author.username}
                          </span>
                          <span
                            className={`text-[8px] font-bold px-1 rounded border scale-90 ${getTierBadgeStyle(
                              comment.author.tier
                            )}`}
                          >
                            {comment.author.tier}
                          </span>
                          {comment.author.isBot && (
                            <span className="text-[8px] bg-red-950/40 text-red-400 border border-red-900/30 px-1 rounded font-mono">
                              BOT
                            </span>
                          )}
                          <span className="text-[10px] text-slate-500">
                            {formatRelativeTime(comment.createdAt)}
                          </span>
                        </div>

                        {/* Content text */}
                        <PostContent
                          content={
                            activeTranslations[comment.id]
                              ? translatedTexts[comment.id]
                              : comment.content
                          }
                          className="text-sm"
                        />


                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Reply Input Form */}
            {currentUser && (
              <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.username}
                    className="h-6 w-6 rounded-full border border-slate-700 bg-slate-800 object-cover"
                  />
                  <span className="text-xs text-slate-400">
                    Replying as <strong className="text-slate-200">{currentUser.username}</strong>
                  </span>
                </div>

                <form onSubmit={handleSubmitComment} className="space-y-3">
                  <textarea
                    rows={4}
                    required
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a supportive reply, share a tip or drop a prompt..."
                    className="w-full rounded-xl border border-slate-850 bg-slate-950/60 px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:border-purple-500 focus:bg-slate-950 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                  />

                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-500">
                      Markdown styles and spaces are preserved.
                    </span>
                    <button
                      type="submit"
                      disabled={submittingComment}
                      className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      {submittingComment ? "Replying..." : "Post Reply"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Thread Stats Card */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/15 p-5 text-xs text-slate-400 space-y-3 shadow-lg">
              <h3 className="font-bold text-slate-350 uppercase tracking-wider text-[10px] border-b border-slate-850 pb-2">
                Thread Stats
              </h3>
              <div className="flex justify-between">
                <span>View count:</span>
                <span className="font-semibold text-slate-200">{topic.viewCount} views</span>
              </div>
              <div className="flex justify-between">
                <span>Reply count:</span>
                <span className="font-semibold text-slate-200">{topic.comments.length} replies</span>
              </div>
              <div className="flex justify-between">
                <span>Posted:</span>
                <span className="font-semibold text-slate-200">
                  {new Date(topic.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Author details card */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/15 p-5 text-center shadow-lg">
              <img
                src={topic.author.avatarUrl}
                alt={topic.author.username}
                className="h-14 w-14 rounded-full border border-slate-850 bg-slate-900 object-cover mx-auto mb-3"
              />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Thread Author
              </p>
              <h4 className="text-sm font-bold text-white mt-0.5">
                {topic.author.username}
              </h4>
              <span
                className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded border mt-2 ${getTierBadgeStyle(
                  topic.author.tier
                )}`}
              >
                {topic.author.tier}
              </span>
            </div>

            {/* Bot Seeding details */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/15 p-5 text-xs leading-relaxed text-slate-400">
              <div className="flex items-center gap-1.5 mb-2">
                <Bot className="h-4 w-4 text-emerald-400" />
                <span className="font-bold text-slate-350 uppercase tracking-wider text-[10px]">
                  Testing helper
                </span>
              </div>
              Click the **"Let Bot Reply"** button to trigger the database simulation. A random bot user will scan this post and leave an automated comment instantly!
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
