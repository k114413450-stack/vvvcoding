import type { Metadata } from "next";
import Link from "next/link";
import { Coins, ChevronLeft, BookOpen, ShieldAlert, Sparkles, Star } from "lucide-react";
import { GAME_SITE_URL } from "@/lib/site-host";

export const metadata: Metadata = {
  title: "Ultimate Free Slots Strategy Guide — Master Reel Spin Volatility",
  description:
    "Learn the mechanics behind online slot machine simulators, RTP, reel volatility, hit frequencies, and play coin bankroll management.",
  alternates: {
    canonical: `${GAME_SITE_URL}/guide/slots-strategy`,
  },
};

export default function SlotsStrategyPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-amber-600 selection:text-white">
      {/* Brand Header */}
      <header className="shrink-0 border-b border-slate-800/80 bg-[#0a0f1a]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/slots" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-xs font-black text-slate-950 transition-transform group-hover:scale-105">
              7
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-amber-400 transition-colors">
              SLOTS SIMULATOR
            </span>
          </Link>
          <Link
            href="/slots"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Spin
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-8 md:py-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 border border-amber-500/25 text-amber-400">
            Guide
          </span>
          <span className="text-xs text-slate-500 font-medium">Updated June 2026</span>
        </div>

        <article className="prose prose-invert max-w-none space-y-6">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-6 leading-tight">
            Ultimate Free Slots Strategy Guide: Master Volatility and Spin Mechanics
          </h1>

          <p className="text-lg md:text-xl text-slate-300 font-normal leading-relaxed">
            Slot machines are the backbone of modern gaming entertainment. While they appear simple—insert coins and spin the reels—under the hood, there is a fascinating system of probability, volatility, and random number generation (RNG).
          </p>

          <div className="grid md:grid-cols-3 gap-6 my-8 not-prose">
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0a0f1a]/40 space-y-2">
              <Sparkles className="h-6 w-6 text-amber-400" />
              <h3 className="font-bold text-white text-base">Understand Volatility</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Volatility determines how often a slot pays out and the size of those wins. High volatility slots have big jackpots but long dry streaks.
              </p>
            </div>
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0a0f1a]/40 space-y-2">
              <Coins className="h-6 w-6 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Bet Sizing & Bankroll</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Staking a small, consistent fraction of your balance per spin lets you survive the dry cycles and hit the high multiplier pairs.
              </p>
            </div>
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0a0f1a]/40 space-y-2">
              <ShieldAlert className="h-6 w-6 text-cyan-400" />
              <h3 className="font-bold text-white text-base">RNG Decoded</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every spin is completely independent. There is no such thing as a "hot" or "cold" machine, or reels that are "due" to hit.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white pt-4">1. How Browser Slot Simulators Work</h2>
          <p className="text-slate-400 leading-relaxed">
            Unlike mechanical vintage slot machines that relied on physical gears, virtual slot simulators run on a mathematical model powered by a **Random Number Generator (RNG)**.
          </p>
          <p className="text-slate-400 leading-relaxed">
            In our free 3-reel slot machine, the symbols on each reel are selected independently from a predefined pool of symbols during every spin. Because the reels spin rapidly and stop randomly, the outcome is determined at the exact millisecond you click the spin button. There is no physical memory of previous spins, making each game 100% fair and random.
          </p>

          <h2 className="text-2xl font-bold text-white pt-4">2. Deconstructing the Paytable & Volatility</h2>
          <p className="text-slate-400 leading-relaxed">
            Our free slot machine features a carefully balanced paytable that models standard casino slot game math:
          </p>

          <div className="overflow-x-auto my-6 border border-slate-800 rounded-xl bg-slate-900/30">
            <table className="min-w-full divide-y divide-slate-800 text-left text-sm text-slate-300">
              <thead className="bg-[#0a0f1a]/80 text-xs uppercase text-slate-400 font-bold">
                <tr>
                  <th className="px-6 py-3">Winning Combination</th>
                  <th className="px-6 py-3">Payout Multiplier</th>
                  <th className="px-6 py-3">Payout Volatility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850">
                <tr>
                  <td className="px-6 py-3 font-mono">💎 💎 💎 (Triple Diamonds)</td>
                  <td className="px-6 py-3 text-amber-400 font-bold">50× Bet</td>
                  <td className="px-6 py-3 text-red-400 font-semibold">Very High</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-mono">🔔 🔔 🔔 (Triple Bells)</td>
                  <td className="px-6 py-3 text-emerald-400 font-bold">25× Bet</td>
                  <td className="px-6 py-3 text-amber-400 font-semibold">High</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-mono">🍒 🍒 🍒 (Triple Cherries)</td>
                  <td className="px-6 py-3 text-emerald-400 font-bold">15× Bet</td>
                  <td className="px-6 py-3 text-slate-400">Medium</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-mono">Any Triple (e.g. 🍋🍋🍋)</td>
                  <td className="px-6 py-3 text-emerald-400 font-bold">10× Bet</td>
                  <td className="px-6 py-3 text-slate-400">Medium-Low</td>
                </tr>
                <tr>
                  <td className="px-6 py-3 font-mono">Any Pair (e.g. 🍒🍒🍋)</td>
                  <td className="px-6 py-3 text-cyan-400 font-bold">2× Bet</td>
                  <td className="px-6 py-3 text-emerald-400 font-semibold">Very Low</td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-slate-400 leading-relaxed">
            Because of this layout, the game features two distinct payout triggers:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li>
              <strong>Hit Frequency (Pairs)</strong>: Over 35% of spins result in a simple pair payout of <strong>2x your bet</strong>. This keeps your virtual bankroll alive and balances out the dry spins.
            </li>
            <li>
              <strong>Jackpot Chase (Triple Diamonds)</strong>: Triple diamonds pay a massive <strong>50x your bet</strong>, but have a much lower hit frequency. This represents the high volatility aspect of the game.
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-white pt-4">3. Recommended Slots Bankroll Strategies</h2>
          <p className="text-slate-400 leading-relaxed">
            Even though you are playing with free play money, using a structured strategy increases your playtime and lets you hit more jackpots.
          </p>

          <h3 className="text-xl font-semibold text-slate-200 mt-4">A. The "Fractional Spin" Strategy</h3>
          <p className="text-slate-400 leading-relaxed">
            The simplest and most effective slots strategy is setting your bet size to a small percentage of your overall balance.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>If your balance is <strong>1,000 coins</strong>, set your spin bet to <strong>10 or 25 coins</strong> (1% to 2.5% of your bankroll).</li>
            <li>This gives you between 40 and 100 spins. Having this buffer allows you to survive extended losing runs until you land high-paying pairs and triples.</li>
          </ul>

          <h3 className="text-xl font-semibold text-slate-200 mt-4">B. The "Escalating Bet" Strategy</h3>
          <p className="text-slate-400 leading-relaxed">
            In this strategy, you start with the minimum bet (10 coins) and spin. If you experience 5 dry spins in a row without a payout:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>Increase your bet size to 25 or 50 coins.</li>
            <li>Once you hit a pair or a triple payout, drop your bet size back to 10 coins.</li>
            <li>This strategy aims to maximize payouts on winning streaks while minimizing coin consumption during cold streaks.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white pt-4 border-t border-slate-800/80">Frequently Asked Questions</h2>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-200">Is this slot machine free?</h4>
              <p className="text-sm text-slate-400">
                Yes, our slot game simulator is 100% free to play. No registration or deposit is required. If your virtual play coin balance drops below 10, just click the free refill button to reset it back to 1,000 coins.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-200">Can slots be beaten with a strategy?</h4>
              <p className="text-sm text-slate-400">
                Because online slot machines run on RNG, there is no strategy that can change the mathematical house edge over time. However, proper bet sizing and bankroll control can help you stay in the game longer and maximize your entertainment value.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-200">Is this real-money gambling?</h4>
              <p className="text-sm text-slate-400">
                No. All coins, bets, wins, and balances are strictly virtual play money. No real money deposits are accepted, and virtual winnings cannot be exchanged for cash or prizes.
              </p>
            </div>
          </div>
        </article>

        {/* Action Panel */}
        <div className="mt-12 p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center space-y-4">
          <Star className="h-8 w-8 text-amber-400 mx-auto" />
          <h3 className="font-bold text-white text-lg">Ready to spin the reels?</h3>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            Put your bankroll strategy to the test on our free classic slot machine simulator with virtual coins.
          </p>
          <Link
            href="/slots"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-105 transition-all"
          >
            Play Slots Free Now
          </Link>
        </div>
      </main>

      <footer className="mt-auto border-t border-slate-900 bg-[#060a12] py-6 px-4 text-center text-xs text-slate-600">
        <p>© 2026 Free Slots Online. Virtual coins only. All rights reserved.</p>
      </footer>
    </div>
  );
}
