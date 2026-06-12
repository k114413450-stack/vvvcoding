"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { useApp } from "@/context/AppContext";
import {
  Cpu,
  Sparkles,
  Bot,
  Play,
  RotateCcw,
  Terminal as TermIcon,
  UserCheck,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface LogEntry {
  timestamp: string;
  type: "info" | "success" | "error";
  message: string;
}

export default function AdminPage() {
  const { users, refreshUsers } = useApp();
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      timestamp: new Date().toLocaleTimeString(),
      type: "info",
      message: "Bot Control console initialized.",
    },
  ]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  // ── Simple password gate ──
  const [unlocked, setUnlocked] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const ADMIN_PW = process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? "vvvcoding888";

  const handleUnlock = () => {
    if (pwInput === ADMIN_PW) {
      setUnlocked(true);
      setPwError(false);
    } else {
      setPwError(true);
      setPwInput("");
    }
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen flex flex-col bg-slate-950">
        <Navbar />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/40 p-8 shadow-2xl backdrop-blur">
            <div className="flex items-center gap-2 mb-6">
              <Cpu className="h-5 w-5 text-emerald-400 animate-pulse" />
              <h1 className="text-base font-bold text-slate-200">Admin Access</h1>
            </div>
            <p className="text-xs text-slate-500 mb-4">This page is restricted to site admins.</p>
            <input
              type="password"
              value={pwInput}
              onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
              onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
              placeholder="Enter admin password"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 mb-2"
            />
            {pwError && (
              <p className="text-xs text-red-400 mb-2">Incorrect password.</p>
            )}
            <button
              onClick={handleUnlock}
              className="w-full rounded-lg bg-gradient-to-r from-purple-600 to-emerald-600 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
            >
              Unlock
            </button>
          </div>
        </main>
      </div>
    );
  }

  const addLog = (message: string, type: "info" | "success" | "error" = "info") => {
    setLogs((prev) => [
      {
        timestamp: new Date().toLocaleTimeString(),
        type,
        message,
      },
      ...prev,
    ]);
  };

  const bots = users.filter((u) => u.isBot);

  const handleSpawnTopic = async () => {
    setLoadingAction("topic");
    addLog("Requesting bot thread spawn...", "info");
    try {
      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_topic" }),
      });
      if (res.ok) {
        const data = await res.json();
        addLog(
          `SUCCESS: Bot '${data.data.title}' spawned by bot user.`,
          "success"
        );
      } else {
        addLog("Failed to spawn bot topic.", "error");
      }
    } catch (err) {
      addLog(`Error: ${err}`, "error");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSpawnComment = async () => {
    setLoadingAction("comment");
    addLog("Fetching topics to target...", "info");
    try {
      // Fetch topics first
      const topicsRes = await fetch("/api/topics");
      if (!topicsRes.ok) {
        addLog("Failed to fetch target topics.", "error");
        return;
      }
      const topics = await topicsRes.json();
      if (topics.length === 0) {
        addLog("Error: No topics available to comment on.", "error");
        return;
      }

      // Pick a random topic
      const randomTopic = topics[Math.floor(Math.random() * topics.length)];
      addLog(
        `Targeting topic: "${randomTopic.title.substring(0, 30)}..."`,
        "info"
      );

      const res = await fetch("/api/bot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create_comment",
          topicId: randomTopic.id,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        addLog(
          `SUCCESS: Bot comment added to topic. Author: ${data.data.author.username}`,
          "success"
        );
      } else {
        addLog("Failed to spawn bot comment.", "error");
      }
    } catch (err) {
      addLog(`Error: ${err}`, "error");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRunAutopilot = async () => {
    setLoadingAction("autopilot");
    addLog("Starting Autopilot Seeding Simulation (5 actions)...", "info");
    
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    try {
      for (let i = 0; i < 5; i++) {
        const actionType = Math.random() > 0.4 ? "comment" : "topic";
        if (actionType === "topic") {
          addLog(`[Autopilot Action ${i + 1}/5] Spawning topic...`, "info");
          await handleSpawnTopic();
        } else {
          addLog(`[Autopilot Action ${i + 1}/5] Spawning comment...`, "info");
          await handleSpawnComment();
        }
        await sleep(1500); // Small delay between bot actions
      }
      addLog("Autopilot Seeding Simulation completed successfully.", "success");
    } catch (err) {
      addLog(`Autopilot encountered errors: ${err}`, "error");
    } finally {
      setLoadingAction(null);
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
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />

      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {/* Header Title */}
        <div className="flex items-center gap-2 mb-6">
          <Cpu className="h-6 w-6 text-emerald-400 animate-pulse" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-emerald-400 bg-clip-text text-transparent">
            AI Bot Control & Developer Panel
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left: Controls & Autopilot */}
          <div className="lg:col-span-2 space-y-6">
            {/* Control Panel Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Spawn Topic Card */}
              <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-250 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-purple-400" />
                    Spawn Bot Thread
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Selects a random Bot profile, picks a realistic Vibe Coding topic template, and inserts it into the database.
                  </p>
                </div>
                <button
                  onClick={handleSpawnTopic}
                  disabled={loadingAction !== null}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5" />
                  {loadingAction === "topic" ? "Creating..." : "Trigger Spawn"}
                </button>
              </div>

              {/* Spawn Comment Card */}
              <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-5 shadow-xl flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-250 flex items-center gap-1.5">
                    <Bot className="h-4 w-4 text-emerald-400" />
                    Spawn Bot Comment
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    Picks a random thread, selects a Bot persona, and generates a comment reply simulating real-time discussion.
                  </p>
                </div>
                <button
                  onClick={handleSpawnComment}
                  disabled={loadingAction !== null}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 border border-slate-800 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-800 hover:text-white transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Play className="h-3.5 w-3.5" />
                  {loadingAction === "comment" ? "Commenting..." : "Trigger Comment"}
                </button>
              </div>
            </div>

            {/* Run Autopilot Card */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/20 p-5 shadow-xl">
              <h3 className="text-sm font-bold text-slate-250 flex items-center gap-1.5 mb-2">
                <Sparkles className="h-4 w-4 text-yellow-400 animate-spin" />
                Autopilot Seeding Simulator
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-4">
                Executes a sequence of 5 random bot actions (posts and comments) with small delays. 
                Perfect for instantly testing the forum's reactive layout and populating threads.
              </p>
              <button
                onClick={handleRunAutopilot}
                disabled={loadingAction !== null}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-emerald-600 px-5 py-2.5 text-xs font-semibold text-white shadow-xl hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Play className="h-4 w-4" />
                {loadingAction === "autopilot" ? "Running Autopilot..." : "Launch Autopilot Seeding"}
              </button>
            </div>

            {/* Simulated Console Logger */}
            <div className="rounded-2xl border border-slate-900 bg-slate-950 p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2.5 mb-3">
                <div className="flex items-center gap-2">
                  <TermIcon className="h-4 w-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Activity Console Log
                  </span>
                </div>
                <button
                  onClick={() => setLogs([])}
                  className="text-[10px] text-slate-500 hover:text-white flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear
                </button>
              </div>

              {/* Logs display */}
              <div className="h-64 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1.5 pr-2 scrollbar-thin">
                {logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-slate-600 select-none">[{log.timestamp}]</span>
                    {log.type === "success" && (
                      <span className="text-emerald-400 font-bold">[SUCCESS]</span>
                    )}
                    {log.type === "error" && (
                      <span className="text-red-400 font-bold">[ERROR]</span>
                    )}
                    {log.type === "info" && (
                      <span className="text-indigo-400 font-bold">[INFO]</span>
                    )}
                    <span className="text-slate-300 flex-1">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Active Bots List */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-900 bg-slate-900/10 p-5 shadow-xl">
              <div className="flex items-center gap-1.5 mb-4 border-b border-slate-850 pb-2.5">
                <Bot className="h-5 w-5 text-purple-400" />
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-355">
                  Seeded Bot Profiles ({bots.length})
                </h2>
              </div>

              <div className="space-y-3">
                {bots.map((bot) => (
                  <div
                    key={bot.id}
                    className="flex items-center justify-between rounded-xl border border-slate-900 bg-slate-950 p-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <img
                        src={bot.avatarUrl}
                        alt={bot.username}
                        className="h-8 w-8 rounded-full border border-slate-800 bg-slate-900 object-cover"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">
                          {bot.username}
                        </p>
                        <span
                          className={`inline-block text-[8px] px-1 py-0.2 rounded border scale-90 -translate-x-1 ${getTierBadgeStyle(
                            bot.tier
                          )}`}
                        >
                          {bot.tier}
                        </span>
                      </div>
                    </div>
                    <span className="flex items-center gap-1 rounded bg-emerald-950/40 border border-emerald-900/30 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-400">
                      <UserCheck className="h-3 w-3" />
                      Idle
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Developer Notice */}
            <div className="rounded-2xl border border-slate-900 bg-slate-900/15 p-5 text-xs text-slate-400 leading-relaxed">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertCircle className="h-4 w-4 text-slate-400" />
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                  Simulated AI Engine
                </span>
              </div>
              In this MVP, bot responses are selected from pre-compiled templates representing various developer styles. In production, this trigger connects to a Gemini LLM agent via webhooks to read the topic content and post dynamically generated replies.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
