import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

// Use CSS variable font stacks instead of next/font/google to avoid build-time network dependency
const geistSans = { variable: "--font-geist-sans", className: "" };
const geistMono = { variable: "--font-geist-mono", className: "" };

const BASE_URL = "https://vvvcoding.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "VVVCODING — Degen Trading Trainer",
    template: "%s — VVVCODING",
  },
  description:
    "A manual trading backtesting simulator designed for pricing behavior practice.",
  keywords: [
    "vibe coding",
    "backtesting",
    "trading simulator",
    "degen trading",
    "manual simulator",
  ],
  authors: [{ name: "VVVCODING" }],
  creator: "VVVCODING",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "VVVCODING",
    title: "VVVCODING — Degen Trading Trainer",
    description:
      "A manual trading backtesting simulator designed for pricing behavior practice.",
  },
  twitter: {
    card: "summary_large_image",
    title: "VVVCODING — Degen Trading Trainer",
    description:
      "A manual trading backtesting simulator designed for pricing behavior practice.",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: BASE_URL,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const htmlClass = `${geistSans.variable} ${geistMono.variable} h-full antialiased dark`;

  return (
    <html lang="en" className={htmlClass}>
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-purple-600 selection:text-white animate-fade-in">
        <AppProvider>{children}</AppProvider>
        <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-6 px-4">
          <div className="mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-slate-600">
            <p>© 2026 VVVCODING — AI Native Developers Community · Degen Trading Trainer Sandbox.</p>
            <p className="text-center sm:text-right leading-relaxed max-w-sm">
              All trading simulations are strictly with virtual play coins for educational purposes.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
