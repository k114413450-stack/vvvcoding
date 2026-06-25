/** Simple 3-reel slots math (virtual coins only). */

import { loadBalance, saveBalance, START_BALANCE, MIN_BET, MAX_BET } from "./crash-engine";

export { loadBalance, saveBalance, START_BALANCE, MIN_BET, MAX_BET };

export const SYMBOLS = ["🍒", "🍋", "🍊", "🔔", "💎"] as const;
export type SlotSymbol = (typeof SYMBOLS)[number];

/** Weighted pick — lower index = more common */
const WEIGHTS = [32, 26, 20, 14, 8];

export function randomSymbol(): SlotSymbol {
  const total = WEIGHTS.reduce((a, b) => a + b, 0);
  let r: number;
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const bytes = new Uint32Array(1);
    crypto.getRandomValues(bytes);
    r = (bytes[0] / 0xffffffff) * total;
  } else {
    r = Math.random() * total;
  }
  let acc = 0;
  for (let i = 0; i < SYMBOLS.length; i++) {
    acc += WEIGHTS[i];
    if (r < acc) return SYMBOLS[i];
  }
  return SYMBOLS[0];
}

export function spinReels(): [SlotSymbol, SlotSymbol, SlotSymbol] {
  return [randomSymbol(), randomSymbol(), randomSymbol()];
}

/** Payout = bet * multiplier (0 = loss) */
export function calcPayout(
  reels: [SlotSymbol, SlotSymbol, SlotSymbol],
  bet: number
): { payout: number; label: string } {
  const [a, b, c] = reels;
  if (a === b && b === c) {
    if (a === "💎") return { payout: bet * 50, label: "JACKPOT! Three diamonds" };
    if (a === "🔔") return { payout: bet * 25, label: "Three bells" };
    if (a === "🍒") return { payout: bet * 15, label: "Three cherries" };
    return { payout: bet * 10, label: `Three ${a}` };
  }
  if (a === b || b === c || a === c) {
    return { payout: bet * 2, label: "Pair — small win" };
  }
  return { payout: 0, label: "No win — spin again" };
}
