# PROJECT GUIDE: VVVCODING Degen Trading Trainer (Manual Simulator)

Welcome! This document provides the current scope, folder layout, and architectural constraints of this project. Any AI agent loading this workspace should read this first to align with the active workspace instead of historical presets.

---

## 1. Project Overview
The VVVCODING repository has been streamlined to focus exclusively on:
*   **The Degen Trading Trainer (Active)**: A manual trading backtesting simulator designed for pricing behavior practice (similar to MT5 sandbox). 
    *   It operates directly out of static pages in `public/` (specifically `public/trade.html` and `public/backtest.html`).
    *   It connects to custom Next.js history endpoints fetching cached local historical candle data.
    *   It includes a native JS会员/auth panel and PayPal payment flow integrated directly in `public/js/backtest/auth_client.js` talking to backend endpoints.
    *   **No live trading setups are currently planned.** The simulator runs offline in a sandboxed mock-account framework.
*   **Archived Forum & Virtual Coin Games**: The legacy "AI Developer Forum" and virtual coin games (slots/crash) have been cleaned up and removed from the active frontend path.

---

## 2. Directory & File Map

### Frontend Pages (Static HTML & Scripts)
*   **[public/trade.html](file:///d:/webgame/public/trade.html)**: Main frontend user interface of the manual trading simulator (Chinese version). Contains Chart canvas layout, Buy/Sell buttons, and neon styled panels.
*   **[public/en/trade.html](file:///d:/webgame/public/en/trade.html)**: Main English version of the simulator.
*   **[public/js/backtest/manual_ui.js](file:///d:/webgame/public/js/backtest/manual_ui.js)**: Front-end business script.
    *   Defines active symbols: `XAUUSD`, `BTCUSD`, and `ETHUSD`.
    *   Selects a random date from a high-volatility event pool (CPI day, Non-farm payroll day, FOMC).
    *   Fetches the selected symbol's day candles from `/api/history`.
    *   Scans the full day dataset for the continuous 35-bar sequence with the absolute highest volatility (high - low difference) and auto-starts playback there.

### Backend APIs & Data Storage
*   **[src/app/api/history/route.ts](file:///d:/webgame/src/app/api/history/route.ts)**: Handles history data queries.
    *   Params: `symbol` (e.g. `BTCUSD`, `ETHUSD`, `XAUUSD`), `start` & `end` dates (e.g., `2026_03_11`).
    *   Resolves files in path: `D:/supercfg/cache_1m/2026/[SYMBOL]_[DATE].csv`.
*   **[src/app/api/translate/route.ts](file:///d:/webgame/src/app/api/translate/route.ts)**: Compiles the natural language strategy block (using Gemini or local mock compiler fallback).
*   **[src/app/api/auth/](file:///d:/webgame/src/app/api/auth/) & [src/app/api/payments/](file:///d:/webgame/src/app/api/payments/)**: Supporting authentication and subscription payments backend APIs.
*   **D:/supercfg/cache_1m/2026/**: Local historical cache folder.
    *   Holds pre-downloaded 1-minute historical data for `XAUUSD`, `BTCUSD`, and `ETHUSD` for CPI, Non-farm, and normal calendar dates of 2026.
    *   CSV files match standard MT5 outputs (Timestamp, Open, High, Low, Close, Volume).

---

## 3. Core Development Rules
1.  **Do NOT touch the Neon sidebar list styling**: Keep the clean `.symbol-list` and `.symbol` layouts with green breathing dots (`.sym-dot`). Do not replace them with grid cards or tabs.
2.  **API Fallbacks**: `/api/history` falls back to `XAUUSD_2026_03_11.csv` if a file is missing. Ensure the frontend handles missing asset ranges gracefully.
3.  **Local Dev Server**: Started via `npm run dev` in background on `http://localhost:3000`.

