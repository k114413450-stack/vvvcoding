"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  MAX_BET,
  MIN_BET,
  START_BALANCE,
  RoundPhase,
  crashColor,
  generateCrashPoint,
  loadBalance,
  multiplierAt,
  saveBalance,
} from "@/lib/crash-engine";
import {
  CrashChartPhase,
  drawCrashChart,
  setupCrashCanvas,
} from "@/lib/crash-canvas";
import { Coins, RotateCcw, Zap } from "lucide-react";

const BET_PRESETS = [10, 50, 100, 250, 500];
const HISTORY_KEY = "vvvcoding_crash_history_v1";
const HISTORY_LEN = 14;
const CHART_HEIGHT = 300;

function loadHistory(): number[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as number[];
    return Array.isArray(arr) ? arr.slice(0, HISTORY_LEN) : [];
  } catch {
    return [];
  }
}

function pushHistory(point: number) {
  const prev = loadHistory();
  const next = [point, ...prev].slice(0, HISTORY_LEN);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  return next;
}

export default function CrashGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);
  const startTimeRef = useRef(0);
  const crashPointRef = useRef(1);
  const phaseRef = useRef<RoundPhase>("betting");
  const betRef = useRef(0);
  const multiplierRef = useRef(1);
  const elapsedSecRef = useRef(0);
  const balanceRef = useRef(START_BALANCE);

  const [balance, setBalance] = useState(START_BALANCE);
  const [bet, setBet] = useState(50);
  const [phase, setPhase] = useState<RoundPhase>("betting");
  const [multiplier, setMultiplier] = useState(1);
  const [history, setHistory] = useState<number[]>([]);
  const [lastWin, setLastWin] = useState<number | null>(null);
  const [message, setMessage] = useState("Set your bet. Launch when ready.");

  useEffect(() => {
    const b = loadBalance();
    balanceRef.current = b;
    setBalance(b);
    setHistory(loadHistory());
  }, []);

  const persistBalance = useCallback((next: number) => {
    balanceRef.current = next;
    setBalance(next);
    saveBalance(next);
  }, []);

  const paint = useCallback(
    (chartPhase: CrashChartPhase, mult: number, elapsedSec: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = setupCrashCanvas(canvas);
      if (!ctx) return;
      drawCrashChart(ctx, canvas, {
        elapsedSec: elapsedSec,
        multiplier: mult,
        phase: chartPhase,
      });
    },
    []
  );

  const stopLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    }
  }, []);

  const endCrashed = useCallback(() => {
    stopLoop();
    const point = crashPointRef.current;
    phaseRef.current = "crashed";
    setPhase("crashed");
    multiplierRef.current = point;
    elapsedSecRef.current = point > 1 ? Math.log(point) / 0.1 : 0;
    setMultiplier(point);
    setMessage(`Crashed @ ${point.toFixed(2)}×`);
    setLastWin(null);
    setHistory(pushHistory(point));
    paint("crashed", point, elapsedSecRef.current);
  }, [paint, stopLoop]);

  const gameLoop = useCallback(() => {
    if (phaseRef.current !== "flying") return;

    const elapsedMs = Date.now() - startTimeRef.current;
    const elapsedSec = elapsedMs / 1000;
    const mult = multiplierAt(elapsedMs);

    elapsedSecRef.current = elapsedSec;
    multiplierRef.current = mult;
    setMultiplier(mult);

    if (mult >= crashPointRef.current) {
      multiplierRef.current = crashPointRef.current;
      setMultiplier(crashPointRef.current);
      endCrashed();
      return;
    }

    paint("running", mult, elapsedSec);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [endCrashed, paint]);

  const startRound = useCallback(() => {
    if (phaseRef.current !== "betting") return;

    const bal = balanceRef.current;
    const stake = Math.min(Math.max(bet, MIN_BET), MAX_BET, bal);
    if (stake < MIN_BET || bal < MIN_BET) {
      setMessage("Out of coins — tap free refill.");
      return;
    }

    stopLoop();
    crashPointRef.current = generateCrashPoint();
    betRef.current = stake;
    startTimeRef.current = Date.now();
    elapsedSecRef.current = 0;
    phaseRef.current = "flying";
    setPhase("flying");
    multiplierRef.current = 1;
    setMultiplier(1);
    setLastWin(null);
    setMessage("Cash out before the crash!");
    persistBalance(bal - stake);
    paint("running", 1, 0);
    rafRef.current = requestAnimationFrame(gameLoop);
  }, [bet, gameLoop, paint, persistBalance, stopLoop]);

  const cashOut = useCallback(() => {
    if (phaseRef.current !== "flying") return;
    stopLoop();

    const elapsedMs = Date.now() - startTimeRef.current;
    const mult = multiplierAt(elapsedMs);
    const payout = Math.floor(betRef.current * mult);

    phaseRef.current = "cashed";
    setPhase("cashed");
    multiplierRef.current = mult;
    elapsedSecRef.current = elapsedMs / 1000;
    setMultiplier(mult);
    setLastWin(payout);
    setMessage(`Cashed out @ ${mult.toFixed(2)}×`);
    persistBalance(loadBalance() + payout);
    paint("running", mult, elapsedSecRef.current);
  }, [paint, persistBalance, stopLoop]);

  const resetToBetting = useCallback(() => {
    stopLoop();
    phaseRef.current = "betting";
    setPhase("betting");
    multiplierRef.current = 1;
    elapsedSecRef.current = 0;
    setMultiplier(1);
    setMessage("Set your bet. Launch when ready.");
    paint("idle", 1, 0);
  }, [paint, stopLoop]);

  useEffect(() => {
    if (phase === "cashed" || phase === "crashed") {
      const id = window.setTimeout(resetToBetting, 2200);
      return () => clearTimeout(id);
    }
  }, [phase, resetToBetting]);

  useEffect(() => {
    paint("idle", 1, 0);
    const onResize = () => {
      const p = phaseRef.current;
      const chartPhase: CrashChartPhase =
        p === "flying" ? "running" : p === "crashed" ? "crashed" : "idle";
      paint(chartPhase, multiplierRef.current, elapsedSecRef.current);
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      stopLoop();
    };
  }, [paint, stopLoop]);

  const refill = () => {
    persistBalance(START_BALANCE);
    setMessage(`Refilled — ${START_BALANCE.toLocaleString()} play coins.`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
      <header className="shrink-0 border-b border-slate-800/80 bg-[#0a0f1a]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg md:max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-black text-slate-950">
              C
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white">
              CRASH
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/5 px-3 py-1">
            <Coins className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-sm font-bold font-mono text-amber-300">
              {balance.toLocaleString()}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col mx-auto w-full max-w-lg md:max-w-5xl px-4 py-4 sm:py-6 justify-center">
        <div className="flex flex-col md:grid md:grid-cols-[300px_1fr] md:gap-6 w-full items-start">
          {/* Left Column: Betting Panel */}
          <div className="order-2 md:order-1 w-full rounded-2xl border border-slate-800/90 bg-[#0a0f1a]/60 p-5 shadow-lg space-y-4 md:mt-0 mt-4">
            <div className="hidden md:block">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Manual Bet
              </span>
            </div>

            {/* Bet Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-400">Bet Amount</label>
                <span className="text-[10px] font-mono text-slate-500">Min: {MIN_BET} · Max: {MAX_BET}</span>
              </div>
              <div className="relative flex items-center">
                <Coins className="absolute left-3 h-4 w-4 text-amber-500" />
                <input
                  type="number"
                  min={MIN_BET}
                  max={MAX_BET}
                  value={bet}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setBet(Math.min(val, balance));
                  }}
                  disabled={phase !== "betting"}
                  className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-2 pl-9 pr-14 text-sm font-semibold font-mono text-white focus:border-emerald-500/50 focus:outline-none disabled:opacity-50"
                />
                <span className="absolute right-3 text-[10px] font-bold text-slate-500 uppercase">
                  COINS
                </span>
              </div>
            </div>

            {/* Presets and Launch Controls */}
            <div className="space-y-3">
              {phase === "betting" && (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {BET_PRESETS.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setBet(Math.min(p, balance))}
                        disabled={balance < MIN_BET}
                        className={`flex-1 min-w-[3.5rem] py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          bet === p
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                            : "border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={startRound}
                    disabled={balance < MIN_BET || bet < MIN_BET || bet > balance}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-105 active:scale-[0.99] disabled:opacity-40 transition-all"
                  >
                    <Zap className="h-4 w-4" />
                    BET & LAUNCH
                  </button>
                </>
              )}

              {phase === "flying" && (
                <button
                  type="button"
                  onClick={cashOut}
                  className="w-full rounded-xl bg-emerald-400 py-3.5 text-sm font-black text-slate-950 shadow-lg shadow-emerald-400/30 animate-pulse hover:bg-emerald-300 active:scale-[0.99] transition-all"
                >
                  CASH OUT ·{" "}
                  {Math.floor(betRef.current * multiplier).toLocaleString()}
                </button>
              )}

              {(phase === "cashed" || phase === "crashed") && (
                <div className="w-full rounded-xl border border-slate-800 py-3.5 text-center text-xs font-semibold text-slate-500">
                  Next round…
                </div>
              )}

              {balance < MIN_BET && (
                <button
                  type="button"
                  onClick={refill}
                  className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 py-2 text-xs font-semibold text-amber-300"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Free refill
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Game chart and History */}
          <div className="order-1 md:order-2 w-full flex flex-col">
            {/* History Row */}
            <div className="flex flex-wrap gap-1.5 mb-3 min-h-[1.75rem]">
              {history.map((h, i) => (
                <span
                  key={`${h}-${i}`}
                  className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md border border-slate-800/80 bg-slate-900/50 ${crashColor(h)}`}
                >
                  {h.toFixed(2)}×
                </span>
              ))}
            </div>

            {/* Canvas Container */}
            <div className="rounded-2xl border border-slate-800/90 bg-slate-900/20 overflow-hidden shadow-[0_0_60px_-15px_rgba(16,185,129,0.15)] w-full">
              <div className="relative w-full border-b border-slate-800/80 h-[280px] sm:h-[340px] md:h-[450px]">
                <canvas
                  ref={canvasRef}
                  className="absolute inset-0 block h-full w-full"
                  aria-hidden
                />
                <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none z-10">
                  <span
                    className={`text-5xl sm:text-6xl font-black font-mono tabular-nums tracking-tighter drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)] ${
                      phase === "crashed"
                        ? "text-red-400"
                        : phase === "cashed"
                          ? "text-emerald-300"
                          : phase === "flying"
                            ? "text-white"
                            : "text-slate-600"
                    }`}
                  >
                    {multiplier.toFixed(2)}×
                  </span>
                </div>
                <p className="absolute bottom-2 left-0 right-0 text-center text-xs text-slate-400 pointer-events-none z-10 px-4">
                  {message}
                  {lastWin !== null && (
                    <span className="text-emerald-400 font-semibold ml-1">
                      +{lastWin.toLocaleString()}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SEO Text Area */}
        <div className="mt-8 border-t border-slate-800/80 pt-6 space-y-6 text-left w-full">
          <div className="space-y-2">
            <h1 className="text-xl sm:text-2xl font-black text-white">
              Free Crash Game Online — Play for Fun
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Experience the thrill of the classic crypto Crash game in your browser, completely free of charge. No download, registration, or real-money deposits are required. Practice your timing and test strategies using our responsive simulator equipped with 1,000 complimentary play coins.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5 p-4 rounded-xl border border-slate-800/80 bg-slate-900/10">
              <h2 className="text-sm font-bold text-slate-200">How Does It Work?</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Strap in, select a bet amount, and click launch. As the multiplier grows exponentially, click <strong>Cash Out</strong> before it randomly crashes. If you exit in time, you win your bet multiplied by the exit multiplier.
              </p>
              <div className="pt-1">
                <Link
                  href="/how-to-play"
                  className="text-xs font-bold text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                >
                  Read Rules & How to Play Guide →
                </Link>
              </div>
            </div>

            <div className="space-y-1.5 p-4 rounded-xl border border-slate-800/80 bg-slate-900/10">
              <h2 className="text-sm font-bold text-slate-200">Master Your Strategy</h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Should you cash out early at 1.30x for consistent wins, or hold on for a high-risk 10.00x moon shot? Learn how the multiplier math works and practice bankroll management strategies.
              </p>
              <div className="pt-1">
                <Link
                  href="/guide/crash-strategy"
                  className="text-xs font-bold text-emerald-400 hover:underline inline-flex items-center gap-0.5"
                >
                  View Crash Strategy Guide →
                </Link>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-[10px] text-slate-600 leading-relaxed px-2 w-full">
          18+ · Virtual coins only · No real-money gambling · Entertainment only
        </p>
      </main>
    </div>
  );
}
