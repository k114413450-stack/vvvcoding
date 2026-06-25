import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import SimpleSlots from "@/components/slots/SimpleSlots";
import { GAME_SITE_URL } from "@/lib/site-host";

export const metadata: Metadata = {
  metadataBase: new URL(GAME_SITE_URL),
  title: "Free Slots Online — Play for Fun, No Download",
  description:
    "Play free slots online in your browser. Classic 3-reel slot machine with virtual play coins. No signup, no real money, no download — instant spin.",
  keywords: [
    "free slots",
    "free slots online",
    "play slots for free",
    "slot machine browser",
    "no download slots",
    "virtual coins slots",
  ],
  alternates: {
    canonical: `${GAME_SITE_URL}/slots`,
  },
  openGraph: {
    title: "Free Slots Online — Play for Fun",
    description:
      "Browser slot machine with virtual coins. Spin free — no real money.",
    url: `${GAME_SITE_URL}/slots`,
    siteName: "VVVCODING Games",
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Free Slots Online",
  url: `${GAME_SITE_URL}/slots`,
  applicationCategory: "GameApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description:
    "Free browser slot machine game with virtual play coins. No real-money gambling.",
};

export default function SlotsPage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <SimpleSlots />
      <article className="mx-auto max-w-2xl px-4 pb-12 text-slate-400 text-sm leading-relaxed space-y-6 pt-6 border-t border-slate-800/60 mt-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-black text-slate-200">
            Free Slots Online — Play Classic Slot Simulator
          </h1>
          <p>
            Looking for high-quality <strong className="text-slate-300">free slots online</strong> with no risk? Our classic 3-reel slots simulator runs instantly in your web browser. There is **no download, no registration, and no sign-up** required. We provide you with 1,000 complimentary play coins, letting you spin the reels and test strategies right away.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 pt-2">
          <div className="space-y-2 p-4 rounded-xl border border-slate-850 bg-slate-900/5">
            <h2 className="text-base font-bold text-slate-300">
              How to Play Free Slots
            </h2>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-500 text-xs">
              <li>Set your bet size (choose from 10, 25, 50, 100, or 250 coins).</li>
              <li>Click the orange <strong className="text-slate-400">Spin</strong> button.</li>
              <li>Reels spin and stop randomly using cryptographically secure RNG.</li>
              <li>Winnings are automatically credited to your virtual wallet.</li>
            </ol>
          </div>

          <div className="space-y-2 p-4 rounded-xl border border-slate-850 bg-slate-900/5">
            <h2 className="text-base font-bold text-slate-300">
              Slots Tips & Strategy
            </h2>
            <p className="text-xs text-slate-400">
              Browser slots are powered by random number generation, meaning every single spin is completely independent. However, practicing proper bet sizing and managing your play coins will maximize your session length.
            </p>
            <div className="pt-0.5">
              <a
                href="/guide/slots-strategy"
                className="text-xs font-bold text-amber-500 hover:underline"
              >
                Read Slots Strategy Guide →
              </a>
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <h3 className="text-sm font-bold text-slate-350">Virtual Currency & Refills</h3>
          <p className="text-xs text-slate-500">
            This simulator is built strictly for entertainment and educational purposes. No real money deposits or withdrawals are supported, and play coins carry no cash value. If your balance drops, simply hit the **Free Refill** button to restore your wallet to 1,000 coins instantly.
          </p>
          <p className="text-xs text-slate-500">
            Looking for other browser games? Try our online{" "}
            <a href="/" className="text-emerald-500 hover:underline">
              free crash game
            </a>{" "}
            which shares the same virtual play coin wallet!
          </p>
        </div>
      </article>
    </>
  );
}
