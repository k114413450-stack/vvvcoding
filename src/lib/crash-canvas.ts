/**
 * Crash chart renderer — adapted from stake-originals-clone (MIT-style reference)
 * https://github.com/tanh1c/stake-originals-clone/blob/main/GameTemplate/Crash/script.js
 */

export type CrashChartPhase = "idle" | "running" | "crashed";

const PADDING = { left: 44, right: 16, top: 24, bottom: 36 };

export function setupCrashCanvas(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return ctx;

  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  canvas.style.width = `${rect.width}px`;
  canvas.style.height = `${rect.height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  return ctx;
}

function multiplierAtSeconds(seconds: number): number {
  return Math.pow(Math.E, 0.1 * seconds);
}

export function drawCrashChart(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  opts: {
    elapsedSec: number;
    multiplier: number;
    phase: CrashChartPhase;
  }
): void {
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  if (width <= 0 || height <= 0) return;

  ctx.clearRect(0, 0, width, height);

  // Background
  const bg = ctx.createLinearGradient(0, 0, 0, height);
  bg.addColorStop(0, "#0c1222");
  bg.addColorStop(1, "#070b14");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, width, height);

  const chartWidth = width - PADDING.left - PADDING.right;
  const chartHeight = height - PADDING.top - PADDING.bottom;
  const baseY = height - PADDING.bottom;

  // Grid
  ctx.strokeStyle = "rgba(51, 65, 85, 0.35)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 5; i++) {
    const y = PADDING.top + (chartHeight * i) / 5;
    ctx.beginPath();
    ctx.moveTo(PADDING.left, y);
    ctx.lineTo(width - PADDING.right, y);
    ctx.stroke();
  }
  for (let i = 0; i <= 4; i++) {
    const x = PADDING.left + (chartWidth * i) / 4;
    ctx.beginPath();
    ctx.moveTo(x, PADDING.top);
    ctx.lineTo(x, baseY);
    ctx.stroke();
  }

  const elapsed = opts.elapsedSec;
  const multiplier = opts.multiplier;
  const phase = opts.phase;
  const crashed = phase === "crashed";

  // Viewport scaling limits
  // Keep growing dot at 75% of the chart width once elapsed >= 4.5 seconds
  const viewMaxSec = Math.max(6, elapsed / 0.75);

  // Keep growing dot at 70% of the chart height once multiplier >= 1.70x
  const viewMaxMult = Math.max(2.0, 1 + (multiplier - 1) / 0.7);

  // Y-axis labels (based on viewMaxMult)
  ctx.fillStyle = "rgba(148, 163, 184, 0.55)";
  ctx.font = "10px ui-monospace, monospace";
  ctx.textAlign = "right";
  for (let i = 5; i >= 1; i--) {
    const value = 1 + ((viewMaxMult - 1) * i) / 5;
    const y = PADDING.top + (chartHeight * (5 - i)) / 5;
    ctx.fillText(`${value.toFixed(1)}×`, PADDING.left - 6, y + 3);
  }

  // X-axis time labels (aligned to the vertical grid lines at 25%, 50%, 75%, 100%)
  ctx.textAlign = "center";
  for (let i = 1; i <= 4; i++) {
    const s = viewMaxSec * (i / 4);
    const x = PADDING.left + (chartWidth * i) / 4;
    const labelText = s % 1 === 0 ? `${s.toFixed(0)}s` : `${s.toFixed(1)}s`;
    ctx.fillText(labelText, x, height - 10);
  }

  // Draw a starting dot with a glow during idle phase
  if (phase === "idle" || elapsed <= 0) {
    ctx.beginPath();
    ctx.arc(PADDING.left, baseY, 6, 0, Math.PI * 2);
    ctx.fillStyle = "#6ee7b7";
    ctx.shadowColor = "#10b981";
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    return;
  }

  // Sample curve points based on dynamic viewMaxSec and viewMaxMult
  const points: { x: number; y: number }[] = [];
  const numPoints = 100;

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const timeAtPoint = elapsed * t;
    const multAtPoint = multiplierAtSeconds(timeAtPoint);
    const x = PADDING.left + chartWidth * (timeAtPoint / viewMaxSec);
    const normalized = (multAtPoint - 1) / (viewMaxMult - 1);
    const y = baseY - normalized * chartHeight;
    points.push({ x, y: Math.max(PADDING.top, y) });
  }

  // Gradient fill under curve
  const fillGradient = ctx.createLinearGradient(
    PADDING.left,
    baseY,
    PADDING.left,
    PADDING.top
  );
  if (crashed) {
    fillGradient.addColorStop(0, "rgba(239, 68, 68, 0.15)");
    fillGradient.addColorStop(0.5, "rgba(239, 68, 68, 0.35)");
    fillGradient.addColorStop(1, "rgba(248, 113, 113, 0.5)");
  } else {
    fillGradient.addColorStop(0, "rgba(16, 185, 129, 0.15)");
    fillGradient.addColorStop(0.4, "rgba(16, 185, 129, 0.35)");
    fillGradient.addColorStop(0.7, "rgba(52, 211, 153, 0.55)");
    fillGradient.addColorStop(1, "rgba(110, 231, 183, 0.7)");
  }

  ctx.beginPath();
  ctx.moveTo(PADDING.left, baseY);
  points.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.lineTo(points[points.length - 1].x, baseY);
  ctx.closePath();
  ctx.fillStyle = fillGradient;
  ctx.fill();

  // Curve stroke
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  points.forEach((p) => ctx.lineTo(p.x, p.y));
  ctx.strokeStyle = crashed ? "#f87171" : "#ffffff";
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.stroke();

  // Head dot + glow
  const last = points[points.length - 1];
  ctx.beginPath();
  ctx.arc(last.x, last.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = crashed ? "#fca5a5" : "#6ee7b7";
  ctx.shadowColor = crashed ? "#ef4444" : "#10b981";
  ctx.shadowBlur = 16;
  ctx.fill();
  ctx.shadowBlur = 0;
}
