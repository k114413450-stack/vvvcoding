"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Crash" },
  { href: "/slots", label: "Slots" },
  { href: "/guide/crash-strategy", label: "Crash Tips" },
  { href: "/guide/slots-strategy", label: "Slots Tips" },
  { href: "/how-to-play", label: "How to Play" },
];

export default function GameNav() {
  const pathname = usePathname();
  const isSlots = pathname?.includes("/slots");

  return (
    <nav className="flex flex-wrap gap-1.5 justify-center px-4 py-2 border-b border-slate-800/60 bg-[#0a0f1a]/50">
      {LINKS.map((link) => {
        const active =
          link.href === "/slots"
            ? isSlots
            : link.href === "/"
              ? !isSlots && (pathname === "/game" || pathname === "/")
              : pathname?.includes(link.href.replace("/", ""));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
              active
                ? "bg-slate-800 border-slate-600 text-white"
                : "border-transparent text-slate-500 hover:text-slate-300"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
