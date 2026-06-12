"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, Check } from "lucide-react";

export default function PromptDetailClient({
  id,
  template,
}: {
  id: string;
  template: string;
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(template);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Increment copyCount in the background
      await fetch(`/api/prompts/${id}`, {
        method: "PATCH",
      });

      // Refresh to update server-side copyCount stats on the page
      router.refresh();
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 rounded-lg border px-4 py-2.5 text-xs font-semibold transition-all active:scale-95 cursor-pointer ${
        copied
          ? "bg-emerald-950/40 border-emerald-900 text-emerald-400"
          : "bg-gradient-to-r from-purple-600 to-emerald-600 hover:-translate-y-0.5 border-transparent text-white shadow-lg"
      }`}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          <span>Copied to Clipboard!</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          <span>Copy Prompt Template</span>
        </>
      )}
    </button>
  );
}
