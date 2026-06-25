import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import CrashGame from "@/components/crash/CrashGame";
import { GAME_SITE_URL } from "@/lib/site-host";

export const metadata: Metadata = {
  metadataBase: new URL(GAME_SITE_URL),
  title: "Crash — Free Online Crash Game (Play Money)",
  description:
    "Play crash free in your browser. Ride the multiplier and cash out before it busts. Virtual coins only — no real money, no signup.",
  alternates: {
    canonical: GAME_SITE_URL,
  },
  openGraph: {
    title: "Crash — Free Browser Crash Game",
    description: "Virtual-coin crash game. Bet, launch, cash out in time.",
    url: GAME_SITE_URL,
    siteName: "Crash",
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Crash",
  url: GAME_SITE_URL,
  applicationCategory: "GameApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description: "Free browser crash game with virtual play coins.",
};

export default function GameSitePage() {
  return (
    <>
      <JsonLd data={jsonLd} />
      <CrashGame />
    </>
  );
}
