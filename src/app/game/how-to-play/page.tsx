import type { Metadata } from "next";
import Link from "next/link";
import { Coins, ChevronLeft, HelpCircle, Gamepad2, Info, CheckCircle } from "lucide-react";
import { GAME_SITE_URL } from "@/lib/site-host";

export const metadata: Metadata = {
  title: "How to Play Crash Game — Beginner's Complete Rules & Guide",
  description:
    "Learn the rules, controls, and mechanics of the Crash game. Practice placing virtual bets and cashing out in time with our free simulator.",
  alternates: {
    canonical: `${GAME_SITE_URL}/how-to-play`,
  },
};

export default function HowToPlayPage() {
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
            Rules
          </span>
          <span className="text-xs text-slate-500 font-medium">Beginner Friendly</span>
        </div>

        <article className="prose prose-invert max-w-none space-y-6">
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-6 leading-tight">
            How to Play Crash Game: A Beginner's Guide
          </h1>

          <p className="text-lg text-slate-300 leading-relaxed">
            Welcome to the ultimate beginner's guide on <strong>how to play the Crash game</strong>! Whether you have seen this game on online casinos or are just curious about crypto-style multiplier games, this guide breaks down the rules, controls, and gameplay mechanics so you can play with confidence.
          </p>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 my-6 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Info className="h-5 w-5 text-emerald-400" />
              What is the Crash Game?
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Crash is a real-time multiplayer game of nerve and decision making. A graphical curve starts climbing at a multiplier of <strong>1.00x</strong> and rises exponentially. At any random microsecond, the curve "crashes" (busts). Your goal is to click the <strong>Cash Out</strong> button to secure your multiplier profit before the crash occurs.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-white pt-4">The Step-by-Step Gameplay Loop</h2>
          <p className="text-slate-400 leading-relaxed">
            Playing a round of Crash involves four simple phases:
          </p>

          <div className="space-y-4 my-6">
            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center font-bold text-emerald-400 shrink-0 text-sm">
                1
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Place Your Bet</h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                  Select your stake amount using the virtual coins. You can choose from standard presets (e.g. 10, 50, 100, 250, 500 coins) or type a custom bet inside the manual bet input.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center font-bold text-emerald-400 shrink-0 text-sm">
                2
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Launch the Round</h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                  Click the <strong>Bet & Launch</strong> button to start. The multiplier starts climbing from <strong>1.00x</strong> and accelerates up and to the right on the canvas.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center font-bold text-emerald-400 shrink-0 text-sm">
                3
              </div>
              <div>
                <h4 className="font-bold text-white text-base">Cash Out in Time</h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                  Watch the multiplier scale. Click the pulsing green <strong>Cash Out</strong> button at any moment. If you cash out successfully, you win your bet multiplied by the current multiplier value!
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center font-bold text-emerald-400 shrink-0 text-sm">
                4
              </div>
              <div>
                <h4 className="font-bold text-white text-base">The Bust (Crash)</h4>
                <p className="text-xs text-slate-400 leading-relaxed mt-0.5">
                  If you fail to click cash out before the curve randomly crashes, your bet is lost. The round ends, and a brief countdown begins before you can place your next bet.
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white pt-4">Crash Rules Checklist</h2>
          <p className="text-slate-400 leading-relaxed">
            Keep these basic game rules in mind as you practice on our free simulator:
          </p>
          <ul className="space-y-2.5 not-prose">
            <li className="flex items-start gap-2.5 text-sm text-slate-400">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Instant Bust:</strong> Every round has a small mathematical chance (~4%) of crashing immediately at 1.00x. When this happens, all active bets lose instantly.</span>
            </li>
            <li className="flex items-start gap-2.5 text-sm text-slate-400">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Max Multiplier:</strong> The game has a ceiling of 100.00x. If reached, any active bets are automatically cashed out at this maximum value.</span>
            </li>
            <li className="flex items-start gap-2.5 text-sm text-slate-400">
              <CheckCircle className="h-4.5 w-4.5 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>No Download & No Account:</strong> Our simulator runs entirely in your web browser. You do not need to register, sign up, or download any software.</span>
            </li>
          </ul>

          <h2 className="text-2xl font-bold text-white pt-4">Beginner Tips for Playing Safely</h2>
          <p className="text-slate-400 leading-relaxed">
            To ensure a fun and long-lasting session, keep your play style balanced:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
            <li><strong>Start Small:</strong> Keep your stakes small relative to your total balance. Bet 20 or 50 coins to test the speed and timing first.</li>
            <li><strong>Auto-Refill:</strong> If you run out of coins, simply tap the <strong>Free Refill</strong> button to instantly get another 1,000 play coins.</li>
            <li><strong>Try Strategy Guides:</strong> Once you understand the rules, read our <Link href="/guide/crash-strategy" className="text-emerald-400 hover:underline">Crash Strategy Guide</Link> to learn about bankroll methods and multipliers.</li>
          </ul>
        </article>

        {/* Action Panel */}
        <div className="mt-12 p-6 rounded-2xl border border-slate-800 bg-[#0a0f1a]/40 text-center space-y-4">
          <Gamepad2 className="h-8 w-8 text-emerald-400 mx-auto" />
          <h3 className="font-bold text-white text-lg">Ready to play your first round?</h3>
          <p className="text-sm text-slate-400 max-w-sm mx-auto">
            Test the rules you've learned on our free online crash simulator with zero risk.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-105 transition-all"
          >
            Play Free Simulator Now
          </Link>
        </div>
      </main>

      <footer className="mt-auto border-t border-slate-900 bg-[#060a12] py-6 px-4 text-center text-xs text-slate-600">
        <p>© 2026 Crash Game Online. Virtual coins only. All rights reserved.</p>
      </footer>
    </div>
  );
}
