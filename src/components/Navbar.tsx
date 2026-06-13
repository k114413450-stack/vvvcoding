"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  Terminal,
  Globe,
  PlusCircle,
  ChevronDown,
} from "lucide-react";

export default function Navbar() {
  const { currentUser, setCurrentUser, users, globalLang, setGlobalLang } =
    useApp();
  const pathname = usePathname();
  const [showIdentityMenu, setShowIdentityMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setActiveCategory(params.get("category"));
    }
  }, [pathname]);

  // Helper for tier styling
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

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Left Side: Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-emerald-500 p-0.5 shadow-lg shadow-purple-900/20">
              <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-slate-950">
                <Terminal className="h-4 w-4 text-emerald-400 animate-pulse" />
              </div>
            </div>
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-emerald-400 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
              VIBCODING
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-350">
            <Link
              href="/?category=FileACase"
              className={`px-2.5 py-1.5 rounded-lg transition-all hover:text-white hover:bg-slate-900/40 ${
                pathname === "/" && activeCategory === "FileACase"
                  ? "bg-slate-900 text-white shadow-sm border border-slate-800"
                  : "border border-transparent"
              }`}
            >
              File Idea
            </Link>
            <Link
              href="/?category=WebBuilds"
              className={`px-2.5 py-1.5 rounded-lg transition-all hover:text-white hover:bg-slate-900/40 ${
                pathname === "/" && activeCategory === "WebBuilds"
                  ? "bg-slate-900 text-white shadow-sm border border-slate-800"
                  : "border border-transparent"
              }`}
            >
              Web Builds
            </Link>
            <Link
              href="/?category=RoastMyPage"
              className={`px-2.5 py-1.5 rounded-lg transition-all hover:text-white hover:bg-slate-900/40 ${
                pathname === "/" && activeCategory === "RoastMyPage"
                  ? "bg-slate-900 text-white shadow-sm border border-slate-800"
                  : "border border-transparent"
              }`}
            >
              Roast My Page
            </Link>
            <Link
              href="/?category=DeployHelp"
              className={`px-2.5 py-1.5 rounded-lg transition-all hover:text-white hover:bg-slate-900/40 ${
                pathname === "/" && activeCategory === "DeployHelp"
                  ? "bg-slate-900 text-white shadow-sm border border-slate-800"
                  : "border border-transparent"
              }`}
            >
              Deploy Guide
            </Link>
            <Link
              href="/tools"
              className={`px-2.5 py-1.5 rounded-lg transition-all hover:text-white hover:bg-slate-900/40 ${
                pathname?.startsWith("/tools")
                  ? "bg-slate-900 text-white shadow-sm border border-slate-800"
                  : "border border-transparent"
              }`}
            >
              Tools
            </Link>
            <Link
              href="/?category=Graveyard"
              className={`px-2.5 py-1.5 rounded-lg transition-all hover:text-white hover:bg-slate-900/40 ${
                pathname === "/" && activeCategory === "Graveyard"
                  ? "bg-slate-900 text-white shadow-sm border border-slate-800"
                  : "border border-transparent"
              }`}
            >
              Graveyard
            </Link>
          </nav>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-4">
          <Link
            href="/create"
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-emerald-600 px-3.5 py-1.5 text-sm font-semibold text-white shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-purple-500/10 active:translate-y-0"
          >
            <PlusCircle className="h-4 w-4" />
            <span className="hidden sm:inline">New Topic</span>
          </Link>

          {/* Global Language Switcher */}
          <div className="relative">
            <button
              onClick={() => {
                setShowLangMenu(!showLangMenu);
                setShowIdentityMenu(false);
              }}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <span>{globalLang === "zh" ? "简体中文" : "English"}</span>
              <ChevronDown className="h-3 w-3 text-slate-500" />
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-32 origin-top-right rounded-lg border border-slate-800 bg-slate-900 p-1 shadow-xl ring-1 ring-black ring-opacity-5">
                <button
                  onClick={() => {
                    setGlobalLang("en");
                    setShowLangMenu(false);
                  }}
                  className={`w-full rounded-md px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-slate-800 ${
                    globalLang === "en" ? "text-emerald-400 bg-slate-800/40" : "text-slate-300"
                  }`}
                >
                  English
                </button>
                <button
                  onClick={() => {
                    setGlobalLang("zh");
                    setShowLangMenu(false);
                  }}
                  className={`w-full rounded-md px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-slate-800 ${
                    globalLang === "zh" ? "text-emerald-400 bg-slate-800/40" : "text-slate-300"
                  }`}
                >
                  简体中文
                </button>
              </div>
            )}
          </div>

          {/* Identity Switcher */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowIdentityMenu(!showIdentityMenu);
                  setShowLangMenu(false);
                }}
                className="flex items-center gap-2 rounded-lg border border-slate-850 bg-slate-900/90 pl-2 pr-3 py-1 text-sm text-slate-200 hover:bg-slate-800 transition-all active:scale-95"
              >
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.username}
                  className="h-6 w-6 rounded-full border border-slate-700 bg-slate-800 object-cover"
                />
                <span className="hidden sm:inline max-w-[90px] truncate font-medium text-xs">
                  {currentUser.username}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              </button>

              {showIdentityMenu && (
                <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl border border-slate-800 bg-slate-900 p-2 shadow-2xl ring-1 ring-black ring-opacity-5 z-50">
                  <div className="px-2 py-1.5 border-b border-slate-800 mb-1.5">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      Active Tester Profile
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <img
                        src={currentUser.avatarUrl}
                        alt={currentUser.username}
                        className="h-8 w-8 rounded-full border border-slate-700 bg-slate-800 object-cover"
                      />
                      <div className="truncate">
                        <p className="text-xs font-semibold text-white truncate">
                          {currentUser.username}
                        </p>
                        <span
                          className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border mt-0.5 ${getTierBadgeClass(
                            currentUser.tier
                          )}`}
                        >
                          {currentUser.tier}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-slate-500">
                    Switch Identity
                  </p>
                  <div className="max-h-60 overflow-y-auto space-y-0.5 mt-1 pr-1 scrollbar-thin">
                    {users.filter((u) => !u.isBot).map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setCurrentUser(u);
                          setShowIdentityMenu(false);
                        }}
                        className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-colors hover:bg-slate-800 ${
                          currentUser.id === u.id
                            ? "bg-slate-800 text-emerald-400 font-medium"
                            : "text-slate-300"
                        }`}
                      >
                        <img
                          src={u.avatarUrl}
                          alt={u.username}
                          className="h-5 w-5 rounded-full border border-slate-700 bg-slate-800 object-cover"
                        />
                        <div className="flex-1 truncate">
                          <p className="truncate font-semibold text-[11px]">{u.username}</p>
                          <span
                            className={`inline-block text-[8px] px-1 py-0.2 rounded border ${getTierBadgeClass(
                              u.tier
                            )}`}
                          >
                            {u.tier}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
