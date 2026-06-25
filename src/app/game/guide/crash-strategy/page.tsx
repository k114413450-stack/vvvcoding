import type { Metadata } from "next";
import Link from "next/link";
import { Coins, ChevronLeft, BookOpen, ShieldAlert, TrendingUp } from "lucide-react";
import { GAME_SITE_URL } from "@/lib/site-host";

export const metadata: Metadata = {
  title: "Ultimate Crash Game Strategy Guide — Master When to Cash Out",
  description:
    "Learn the math behind the crash curve, master low-multiplier cashouts, virtual money bankroll management, and how to avoid standard gaming traps.",
  alternates: {
    canonical: `${GAME_SITE_URL}/guide/crash-strategy`,
  },
};

export default function CrashStrategyPage() {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col selection:bg-emerald-600 selection:text-white">
      {/* Brand Header */}
      <header className="shrink-0 border-b border-slate-800/80 bg-[#0a0f1a]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-xs font-black text-slate-950 transition-transform group-hover:scale-105">
              C
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-emerald-400 transition-colors">
              CRASH GAME
            </span>
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" /> Back to Play
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-4xl mx-auto w-full px-4 py-8 md:py-12">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
            Guide
          </span>
          <span className="text-xs text-slate-500 font-medium">Updated June 2026</span>
        </div>

        <article className="prose prose-invert max-w-none space-y-6">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-6 leading-tight">
            Ultimate Crash Game Strategy Guide: Master When to Cash Out
          </h1>

          <p className="text-lg md:text-xl text-slate-300 font-normal leading-relaxed">
            The Crash game (often called Aviator, Blast, or Bustabit) is one of the most exciting crypto-style multiplier games. The concept is beautifully simple: a multiplier line goes up and up, and you must cash out before it randomly collapses (crashes).
          </p>

          <div className="grid md:grid-cols-3 gap-6 my-8 not-prose">
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0a0f1a]/40 space-y-2">
              <TrendingUp className="h-6 w-6 text-emerald-400" />
              <h3 className="font-bold text-white text-base">Understand the Curve</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                The multiplier grows exponentially. The longer you wait, the faster the value scales, but the probability of a crash grows.
              </p>
            </div>
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0a0f1a]/40 space-y-2">
              <Coins className="h-6 w-6 text-amber-400" />
              <h3 className="font-bold text-white text-base">Bankroll Control</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Even with free virtual coins, managing your stakes ensures you can ride out cold streaks without running out of tokens.
              </p>
            </div>
            <div className="p-5 rounded-2xl border border-slate-800 bg-[#0a0f1a]/40 space-y-2">
              <ShieldAlert className="h-6 w-6 text-cyan-400" />
              <h3 className="font-bold text-white text-base">House Edge Math</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every game has an instant bust rate (~4% at 1.00x). Accept that some rounds are mathematically impossible to win.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white pt-4">1. Understanding the Multiplier Math</h2>
          <p className="text-slate-400 leading-relaxed">
            Most crash games use an exponential multiplier curve. In our free online simulator, the multiplier formula is defined by:
          </p>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 font-mono text-center text-emerald-400 my-4">
            Multiplier = e^(0.1 * t_seconds)
          </div>
          <p className="text-slate-400 leading-relaxed">
            This means the multiplier increases slowly at first, but accelerates the longer the round goes. For example:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li>To reach <strong>2.00x</strong> takes approximately 6.9 seconds.</li>
            <li>To reach <strong>10.00x</strong> takes approximately 23.0 seconds.</li>
            <li>To reach <strong>50.00x</strong> takes approximately 39.1 seconds.</li>
          </ul>

          <h2 className="text-2xl font-bold text-white pt-4">2. Core Crash Strategies to Master</h2>
          <p className="text-slate-400 leading-relaxed">
            While no strategy guarantees consistent success due to the random number generators (RNG) generating the crash point, employing these playstyles can improve your session length and enjoyment.
          </p>

          <h3 className="text-xl font-semibold text-slate-200 mt-4">A. The Conservative "Low Multiplier" Playstyle</h3>
          <p className="text-slate-400 leading-relaxed">
            This is the most popular strategy among consistent players. Instead of waiting for huge multipliers, you set your cash-out target low (between <strong>1.20x</strong> and <strong>1.50x</strong>).
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li><strong>Pros:</strong> High win rate (often over 75% of rounds).</li>
            <li><strong>Cons:</strong> A single early crash (e.g. an instant bust at 1.00x) requires multiple successful rounds to recover the loss.</li>
          </ul>

          <h3 className="text-xl font-semibold text-slate-200 mt-4">B. The "Moon Shot" Playstyle</h3>
          <p className="text-slate-400 leading-relaxed">
            This playstyle targets huge multipliers (10.00x, 20.00x, or even 100.00x). You bet a very small percentage of your balance and hold on.
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400">
            <li><strong>Pros:</strong> Extremely rewarding when it hits, and loss exposure per round is minimal.</li>
            <li><strong>Cons:</strong> You will experience long losing streaks. It requires massive patience.</li>
          </ul>

          <h3 className="text-xl font-semibold text-slate-200 mt-4">C. The Martingale Strategy (With Virtual Currency)</h3>
          <p className="text-slate-400 leading-relaxed">
            The Martingale strategy involves doubling your bet after every loss, then cashing out at a fixed 2.00x. When you eventually win, you recover all previous losses plus a profit equal to your original bet.
          </p>
          <p className="text-slate-400 leading-relaxed">
            <strong>Warning:</strong> While tempting, a streak of 6 or 7 losses in a row will wipe out your bankroll or hit the table limit. Use this with extreme caution even when playing with virtual free coins.
          </p>

          <h2 className="text-2xl font-bold text-white pt-4">3. Bankroll Management (Virtual Play Money)</h2>
          <p className="text-slate-400 leading-relaxed">
            Since this game uses virtual play coins, it is the perfect training ground to practice safe bankroll management. Here are the golden rules:
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-slate-400">
            <li><strong>Set a Base Bet:</strong> Your standard bet should be no more than 2% to 5% of your total balance (e.g., if you start with 1,000 coins, bet 20–50 coins).</li>
            <li><strong>Use the Free Refill:</strong> If your balance hits zero, use our free refill button to top back up. Never rush into big bets right after resetting.</li>
            <li><strong>Know the Edge:</strong> Every crash point is generated via cryptographic hashing with a house edge of ~4%. That means, over thousands of rounds, the average output favors the game.</li>
          </ol>

          <h2 className="text-2xl font-bold text-white pt-4 border-t border-slate-800/80">Frequently Asked Questions</h2>
          <div className="space-y-4 pt-2">
            <div className="space-y-1">
              <h4 className="font-bold text-slate-200">Is this game for real money?</h4>
              <p className="text-sm text-slate-400">
                No. This application is 100% free to play. It uses virtual play coins for entertainment and strategy practice only. No real money deposits or withdrawals are supported.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-200">Can I predict when the game will crash?</h4>
              <p className="text-sm text-slate-400">
                No. Each round's crash point is generated using cryptographically secure random numbers. Past results have absolutely no influence on future rounds.
              </p>
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-200">What is the highest multiplier?</h4>
              <p className="text-sm text-slate-400">
                The multiplier in this simulator is capped at <strong>100.00x</strong>. Once the multiplier hits 100.00x, it auto-cashes out any remaining active bets.
              </p>
            </div>
          </div>
        </article>

        {/* Footer Actions */}
        <div className="mt-12 p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center space-y-4">
          <BookOpen className="h-8 w-8 text-emerald-400 mx-auto" />
          <h3 className="font-bold text-white text-lg">Ready to test your new strategy?</h3>
          <p className="text-sm text-slate-300 max-w-md mx-auto">
            Put these theories into practice on our free crash simulator with 1,000 complimentary play coins.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-105 transition-all"
          >
            Play Crash Game Free Now
          </Link>
        </div>
      </main>

      <footer className="mt-auto border-t border-slate-900 bg-[#060a12] py-6 px-4 text-center text-xs text-slate-600">
        <p>© 2026 Crash Game Online. Virtual coins only. All rights reserved.</p>
      </footer>
    </div>
  );
}
