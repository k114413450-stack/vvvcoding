"use client";

import React, { useCallback, useEffect, useState } from "react";
import GameNav from "@/components/game/GameNav";
import {
  MAX_BET,
  MIN_BET,
  START_BALANCE,
  SYMBOLS,
  SlotSymbol,
  calcPayout,
  loadBalance,
  saveBalance,
  spinReels,
} from "@/lib/slots-engine";
import { Coins, RotateCcw, Sparkles } from "lucide-react";

const BET_PRESETS = [10, 25, 50, 100, 250];
const SPIN_MS = 1400;

export default function SimpleSlots() {
  const [balance, setBalance] = useState(START_BALANCE);
  const [bet, setBet] = useState(25);
  const [reels, setReels] = useState<[SlotSymbol, SlotSymbol, SlotSymbol]>([
    "🍒",
    "🍋",
    "🍊",
  ]);
  const [spinning, setSpinning] = useState(false);
  const [message, setMessage] = useState("Set your bet and spin.");

  useEffect(() => {
    setBalance(loadBalance());
  }, []);

  const persistBalance = useCallback((n: number) => {
    setBalance(n);
    saveBalance(n);
  }, []);

  const refill = () => {
    persistBalance(START_BALANCE);
    setMessage(`Refilled — ${START_BALANCE.toLocaleString()} play coins.`);
  };

  const handleSpin = () => {
    if (spinning) return;
    const stake = Math.min(Math.max(bet, MIN_BET), MAX_BET, balance);
    if (balance < MIN_BET) {
      setMessage("Out of coins — tap free refill.");
      return;
    }

    persistBalance(balance - stake);
    setSpinning(true);
    setMessage("Spinning…");

    const tick = window.setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      ]);
    }, 80);

    window.setTimeout(() => {
      clearInterval(tick);
      const result = spinReels();
      setReels(result);
      const { payout, label } = calcPayout(result, stake);
      const newBal = loadBalance() + payout;
      persistBalance(newBal);
      setMessage(
        payout > 0 ? `${label} — +${payout.toLocaleString()} coins` : label
      );
      setSpinning(false);
    }, SPIN_MS);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#070b14] text-slate-100">
      <header className="shrink-0 border-b border-slate-800/80 bg-[#0a0f1a]/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-lg items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xs font-black text-slate-950">
              7
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white">
              SLOTS
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

      <GameNav />

      <main className="flex-1 mx-auto w-full max-w-lg px-4 py-5">
        <div className="rounded-2xl border border-slate-800/90 bg-gradient-to-b from-slate-900/40 to-[#0a0f1a] p-5 shadow-xl">
          <div className="grid grid-cols-3 gap-2 mb-4">
            {reels.map((sym, i) => (
              <div
                key={i}
                className={`flex items-center justify-center rounded-xl border border-slate-700/80 bg-slate-950/80 aspect-[3/4] text-5xl sm:text-6xl shadow-inner ${
                  spinning ? "animate-pulse" : ""
                }`}
              >
                {sym}
              </div>
            ))}
          </div>

          <p className="text-sm text-center text-slate-400 mb-4 min-h-[2.5rem]">
            {message}
          </p>

          <div className="flex flex-wrap gap-2 mb-3">
            {BET_PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                disabled={spinning || balance < MIN_BET}
                onClick={() => setBet(Math.min(p, balance))}
                className={`flex-1 min-w-[3rem] py-2 rounded-lg text-sm font-bold border transition-all ${
                  bet === p
                    ? "bg-amber-500/15 border-amber-500/40 text-amber-300"
                    : "border-slate-800 text-slate-500 hover:border-slate-600"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSpin}
            disabled={spinning || balance < MIN_BET}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 py-4 text-base font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-105 disabled:opacity-40 active:scale-[0.99] transition-all"
          >
            <Sparkles className="h-5 w-5" />
            {spinning ? "SPINNING…" : `SPIN · ${bet} coins`}
          </button>

          {balance < MIN_BET && (
            <button
              type="button"
              onClick={refill}
              className="w-full mt-3 flex items-center justify-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/10 py-2.5 text-sm font-semibold text-amber-300"
            >
              <RotateCcw className="h-4 w-4" />
              Free refill
            </button>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-slate-800/60 bg-slate-900/20 p-4 text-xs text-slate-500">
          <p className="font-semibold text-slate-400 mb-2">Paytable (virtual coins)</p>
          <ul className="space-y-1">
            <li>💎💎💎 = 50× bet</li>
            <li>🔔🔔🔔 = 25× · 🍒🍒🍒 = 15× · other triple = 10×</li>
            <li>Any pair = 2× bet</li>
          </ul>
        </div>

        <p className="mt-4 text-center text-[10px] text-slate-600">
          18+ · Virtual coins only · No real-money gambling
        </p>
      </main>
    </div>
  );
}
