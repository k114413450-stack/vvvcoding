/** Client-side crash round math (virtual currency only). */

export const CRASH_STORAGE_KEY = "vvvcoding_crash_v1";
export const START_BALANCE = 1000;
export const MIN_BET = 10;
export const MAX_BET = 5000;
const MAX_MULTIPLIER = 100;

/**
 * Standard crash multiplier curve: e^(0.1 * t_seconds)
 * Same formula as tanh1c/stake-originals-clone GameTemplate/Crash/script.js
 */
export function multiplierAt(elapsedMs: number): number {
  const elapsedSec = elapsedMs / 1000;
  const raw = Math.pow(Math.E, 0.1 * elapsedSec);
  return Math.floor(raw * 100) / 100;
}

export function msToReachMultiplier(target: number): number {
  if (target <= 1) return 0;
  return (Math.log(target) / 0.1) * 1000;
}

export function generateCrashPoint(): number {
  let r: number;
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    r = bytes[0] / 0xffffffff;
  } else {
    r = Math.random();
  }

  // ~4% instant bust at 1.00x (stake-style house edge)
  if (r < 0.04) return 1;

  const point = 0.99 / (1 - r);
  const clamped = Math.min(Math.max(1, point), MAX_MULTIPLIER);
  return Math.floor(clamped * 100) / 100;
}

export function loadBalance(): number {
  if (typeof window === "undefined") return START_BALANCE;
  try {
    const raw = localStorage.getItem(CRASH_STORAGE_KEY);
    if (!raw) return START_BALANCE;
    const n = JSON.parse(raw) as { balance?: number };
    if (typeof n.balance === "number" && Number.isFinite(n.balance)) {
      return Math.max(0, Math.floor(n.balance));
    }
  } catch {
    /* ignore */
  }
  return START_BALANCE;
}

export function saveBalance(balance: number): void {
  localStorage.setItem(
    CRASH_STORAGE_KEY,
    JSON.stringify({ balance: Math.floor(balance) })
  );
}

export type RoundPhase = "betting" | "flying" | "crashed" | "cashed";

export function crashColor(mult: number): string {
  if (mult < 2) return "text-red-400";
  if (mult < 10) return "text-amber-400";
  return "text-emerald-400";
}
