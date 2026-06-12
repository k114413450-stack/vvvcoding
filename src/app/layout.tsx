import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE_URL = "https://vvvcoding.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "VVVCODING — AI Native Developers Forum",
    template: "%s — VVVCODING",
  },
  description:
    "A minimalist community for AI-native developers and vibe coders. Share prompts, side projects, and AI showcase posts. Build with AI, ship faster.",
  keywords: [
    "vibe coding",
    "AI developers",
    "prompt engineering",
    "no-code",
    "cursor AI",
    "next.js forum",
    "AI native",
    "side project",
    "indie hackers",
    "AI showcase",
  ],
  authors: [{ name: "VVVCODING Community" }],
  creator: "VVVCODING",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: BASE_URL,
    siteName: "VVVCODING",
    title: "VVVCODING — AI Native Developers Forum",
    description:
      "A minimalist community for AI-native developers and vibe coders. Share prompts, side projects, and AI showcase posts.",
  },
  twitter: {
    card: "summary_large_image",
    title: "VVVCODING — AI Native Developers Forum",
    description:
      "A minimalist community for AI-native developers and vibe coders. Share prompts and ship faster.",
    creator: "@vvvcoding",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
  icons: {
    icon: "/favicon.ico",
  },
  // Uncomment and replace with your actual token after getting it from Google Search Console
  // verification: {
  //   google: "YOUR_GOOGLE_VERIFICATION_TOKEN",
  // },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-slate-100 selection:bg-purple-600 selection:text-white">
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
