import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// 1. 读取本地 GK.txt 中的 Gemini API Key 或者是环境变量
function getGeminiApiKey(): string {
  try {
    const gkPath = "D:/webvibc/GK.txt";
    if (fs.existsSync(gkPath)) {
      const content = fs.readFileSync(gkPath, "utf-8").trim();
      const lines = content.split(/\r?\n/);
      if (lines.length > 0 && lines[0].trim()) {
        return lines[0].trim();
      }
    }
  } catch (e) {
    console.warn("Failed to read D:/webvibc/GK.txt:", e);
  }
  return process.env.GEMINI_API_KEY || "";
}

// 2. 本地策略启发式编译器 (Heuristics Fallback) — 保证断网时百分百可用
interface TranslateResult {
  indicators: Record<string, string>;
  direction: "BUY" | "SELL";
  first_buy: string | null;
  first_sell: string | null;
  add_buy: string | null;
  add_sell: string | null;
  lot_multiplier: number;
  max_layers: number;
  exit_all: string;
  pos_sl: number | null;
  pos_tp: number | null;
  pos_trail_trigger: number | null;
  pos_trail_callback: number | null;
  user_clarifications: Array<{
    id: string;
    title: string;
    options: Array<{
      label: string;
      append?: string;
      replace?: string;
      hasInput?: boolean;
      appendTemplate?: string;
    }>;
  }>;
  developer_feedback: string;
}

function mockTranslate(strategyText: string): TranslateResult {
  const msg = strategyText.toLowerCase();

  const isMartingale = msg.includes("马丁") || msg.includes("翻倍") || msg.includes("加仓") || msg.includes("倍") || msg.includes("升") || msg.includes("跌") || msg.includes("限");
  
  let maxLayers = 1;
  if (isMartingale) {
    maxLayers = 7;
    const numWords = [
      { w: "7", val: 7 }, { w: "七", val: 7 },
      { w: "6", val: 6 }, { w: "六", val: 6 },
      { w: "5", val: 5 }, { w: "五", val: 5 },
      { w: "8", val: 8 }, { w: "八", val: 8 },
      { w: "10", val: 10 }, { w: "十", val: 10 }
    ];
    for (const item of numWords) {
      if (msg.includes(item.w)) {
        maxLayers = item.val;
        break;
      }
    }
  }

  const direction: "BUY" | "SELL" = (msg.includes("sell") || msg.includes("做空") || msg.includes("卖出")) ? "SELL" : "BUY";

  let tpSlPoints: number | null = null;
  const ptsMatch = msg.match(/(tp\/sl|止盈止损)[^\d]*(\d+)/);
  if (ptsMatch) {
    tpSlPoints = parseInt(ptsMatch[2], 10);
  }

  let stepPoints = 50;
  const stepMatch = msg.match(/(升|跌|涨|降|下|落)[^\d]*(\d+)/);
  if (stepMatch) {
    stepPoints = parseInt(stepMatch[2], 10);
  }

  const indicators: Record<string, string> = {};
  let firstBuy = "pos_count == 0 && close > ind0";

  if (msg.includes("开盘") || msg.includes("open")) {
    if (msg.includes("高") || msg.includes("higher") || msg.includes("above")) {
      firstBuy = "pos_count == 0 && open > open_offset_1";
    } else {
      firstBuy = "pos_count == 0 && open < open_offset_1";
    }
  } else if (msg.includes("阳线") || msg.includes("bullish")) {
    let count = 3;
    const items = [
      { w: "2", v: 2 }, { w: "二", v: 2 },
      { w: "3", v: 3 }, { w: "三", v: 3 },
      { w: "4", v: 4 }, { w: "四", v: 4 },
      { w: "5", v: 5 }, { w: "五", v: 5 }
    ];
    for (const item of items) {
      if (msg.includes(item.w)) { count = item.v; break; }
    }
    const parts = [];
    for (let c = 0; c < count; c++) {
      parts.push(c === 0 ? "close > open" : `close[${c}] > open[${c}]`);
    }
    firstBuy = "pos_count == 0 && " + parts.join(" && ");
  } else if (msg.includes("阴线") || msg.includes("bearish")) {
    let count = 3;
    const items = [
      { w: "2", v: 2 }, { w: "二", v: 2 },
      { w: "3", v: 3 }, { w: "三", v: 3 },
      { w: "4", v: 4 }, { w: "四", v: 4 },
      { w: "5", v: 5 }, { w: "五", v: 5 }
    ];
    for (const item of items) {
      if (msg.includes(item.w)) { count = item.v; break; }
    }
    const parts = [];
    for (let c = 0; c < count; c++) {
      parts.push(c === 0 ? "close < open" : `close[${c}] < open[${c}]`);
    }
    firstBuy = "pos_count == 0 && " + parts.join(" && ");
  } else {
    firstBuy = "pos_count == 0";
  }

  let exitAll = "";
  if (direction === "SELL") {
    exitAll = tpSlPoints ? `close <= last_entry - ${tpSlPoints} || close >= last_entry + ${tpSlPoints}` : "close > open";
  } else {
    exitAll = tpSlPoints ? `close >= last_entry + ${tpSlPoints} || close <= last_entry - ${tpSlPoints}` : "close < open";
  }

  if (msg.includes("均线") || msg.includes("ma")) {
    indicators["ind0"] = "MA(5)";
    indicators["ind1"] = "MA(10)";
    firstBuy = "pos_count == 0 && ind0 > ind1";
    exitAll = "ind0 < ind1";
  }

  if (msg.includes("rsi")) {
    indicators["ind2"] = "RSI(14)";
    firstBuy += " && ind2 < 30";
  }

  let addBuy: string | null = null;
  let lotMultiplier = 1.0;
  if (isMartingale) {
    if (direction === "SELL") {
      addBuy = `pos_count > 0 && pos_count < ${maxLayers} && close >= last_entry + ${stepPoints}`;
    } else {
      addBuy = `pos_count > 0 && pos_count < ${maxLayers} && close <= last_entry - ${stepPoints}`;
    }
    lotMultiplier = 2.0;
    exitAll = `float_pnl >= 150 || (${exitAll})`;
  }

  let posSl: number | null = null;
  let posTp: number | null = null;
  let posTrailTrigger: number | null = null;
  let posTrailCallback: number | null = null;

  if (msg.includes("每单独立止损") || msg.includes("每单止损")) {
    const slMatch = msg.match(/(每单独立止损|每单止损)[^\d]*(\d+)/);
    if (slMatch) posSl = parseFloat(slMatch[2]);
  }
  if (msg.includes("每单独立止盈") || msg.includes("每单止盈")) {
    const tpMatch = msg.match(/(每单独立止盈|每单止盈)[^\d]*(\d+)/);
    if (tpMatch) posTp = parseFloat(tpMatch[2]);
  }

  if (msg.includes("移动止盈") || msg.includes("每单移损") || msg.includes("每单移动止盈")) {
    const trigMatch = msg.match(/(盈利|起步|起)[^\d]*(\d+)/);
    const cbMatch = msg.match(/(回调|回撤)[^\d]*(\d+)/);
    if (trigMatch && cbMatch) {
      posTrailTrigger = parseFloat(trigMatch[2]);
      posTrailCallback = parseFloat(cbMatch[2]);
    }
  }

  const userClarifications: TranslateResult["user_clarifications"] = [];
  const developerFeedback = "Mock translation generated locally fallback.";

  const isTrailingOrPos = msg.includes("移动") || msg.includes("每单") || msg.includes("每笔") || msg.includes("移损");
  const hasIndicatorExit = msg.includes("均线") || msg.includes("ma") || msg.includes("rsi");
  // 如果策略中完全未提及止损/止盈/移损/每单止损，且也没有均线等技术指标作为出场平仓信号，则必须跳卡片引导用户设定止损/止盈
  if (!tpSlPoints && !posSl && !posTp && !isTrailingOrPos && !hasIndicatorExit) {
    userClarifications.push({
      id: "missing_sl_tp",
      title: "❓ 您未设定止损/止盈，请设定具体额度：",
      options: [
        { label: "🛡️ 5 美元", append: "; TP/SL 5" },
        { label: "🛡️ 10 美元", append: "; TP/SL 10" },
        { label: "✍️ 自定义", hasInput: true, appendTemplate: "; TP/SL {value}" }
      ]
    });
  }

  if (isMartingale) {
    const hasStep = msg.match(/(升|跌|涨|降|下|落)[^\d]*(\d+)/) !== null;
    if (!hasStep) {
      userClarifications.push({
        id: "martingale_step",
        title: "❓ 您提到了下跌加仓，请问每下跌多少点进行加仓？",
        options: [
          { label: "每跌 30 点加仓", append: "; 每跌 30 点加仓" },
          { label: "每跌 50 点加仓", append: "; 每跌 50 点加仓" },
          { label: "✍️ 自定义", hasInput: true, appendTemplate: "; 每跌 {value} 点加仓" }
        ]
      });
    }

    const hasLayers = ["层", "次", "上限", "最大"].some(w => msg.includes(w));
    if (!hasLayers) {
      userClarifications.push({
        id: "martingale_max_layers",
        title: "❓ 请设置最大加仓层数（包含首单）：",
        options: [
          { label: "最多加仓 5 层", append: "; 最多加仓 5 层" },
          { label: "最多加仓 7 层", append: "; 最多加仓 7 层" },
          { label: "✍️ 自定义", hasInput: true, appendTemplate: "; 最多加仓 {value} 层" }
        ]
      });
    }
  }

  return {
    indicators,
    direction,
    first_buy: direction === "BUY" ? firstBuy : null,
    first_sell: direction === "SELL" ? firstBuy : null,
    add_buy: direction === "BUY" ? addBuy : null,
    add_sell: direction === "SELL" ? addBuy : null,
    lot_multiplier: lotMultiplier,
    max_layers: maxLayers,
    exit_all: exitAll,
    pos_sl: posSl,
    pos_tp: posTp,
    pos_trail_trigger: posTrailTrigger,
    pos_trail_callback: posTrailCallback,
    user_clarifications: userClarifications,
    developer_feedback: developerFeedback
  };
}

// 3. System Instruction for Gemini
const SYSTEM_INSTRUCTION = `You are a strict trading strategy semantic parser for a backtesting engine.
Your job: translate the user's natural language strategy into a structured JSON config.

=== SUPPORTED INDICATORS ===
- MA(period), EMA(period), RSI(period)
- BOLL_MID(period), BOLL_UP(period, std_dev), BOLL_DOWN(period, std_dev)
- CCI(period), KDJ_K(n,pk,pd), KDJ_D(n,pk,pd), KDJ_J(n,pk,pd)
- MACD_DIF(fast,slow), MACD_DEA(fast,slow,signal), MACD_BAR(fast,slow,signal)
- HHV(field, period), LLV(field, period)  [field: high/low/close/open]

=== FORMULA VARIABLES ===
- close, open, high, low, volume
- ind0, ind1, ind2... (matched to indicators block keys)
- close[1], open[2], high[3]... (historical bar offset, up to [5])
- pos_count: number of open position layers (0 = flat)
- last_entry: entry price of latest layer (0 if flat)
- float_pnl: total floating PnL of all layers (0 if flat)
- max_float_pnl: peak float_pnl reached in current trade cycle (0 if flat)
- bars_since_entry: bars elapsed since first entry in current cycle (0 if flat)

=== FORMULA EXAMPLES ===
- 4 consecutive bearish candles: close<open && close[1]<open[1] && close[2]<open[2] && close[3]<open[3]
- MA(5) crosses above MA(10): ind0>ind1 && ind0[1]<=ind1[1]
- EMA(50) slope up (trending): ind0>ind0[1]
- Volume breakout (2x prev): volume>volume[1]*2
- Trailing stop (BUY, -5 USD): float_pnl<=max_float_pnl-5
- Trailing stop (SELL, -5 USD): float_pnl>=max_float_pnl+5
- Time exit (>20 bars, losing): bars_since_entry>=20 && float_pnl<0
- Fixed SL/TP (BUY ±10): close>=last_entry+10 || close<=last_entry-10
- Fixed SL/TP (SELL ±10): close<=last_entry-10 || close>=last_entry+10
- Bollinger band dynamic SL/TP: close>=ind0 || close<=ind1

=== POSITION-LEVEL PARAMETERS (pos_sl, pos_tp, pos_trail_trigger, pos_trail_callback) ===
If the user specifies parameters that apply to EACH individual order/position rather than globally:
- pos_sl: stop loss distance (in price units/dollars). Fill in the corresponding number field. DO NOT write this into exit_all.
- pos_tp: take profit distance (in price units/dollars). Fill in the corresponding number field. DO NOT write this into exit_all.
- pos_trail_trigger: activation threshold for individual trailing stop profit. Fill in the corresponding number field. DO NOT write this into exit_all.
- pos_trail_callback: pullback callback distance for individual trailing stop profit. Fill in the corresponding number field. DO NOT write this into exit_all.

=== DIAGNOSTIC RULES (user_clarifications) ===
Scan the user strategy for issues. Generate clarifications ONLY when the user explicitly requests a feature or strategy type but fails to specify the required parameters, OR when the strategy contains NO exit parameters (TP/SL) and NO indicator-based exit rules.
IMPORTANT: All option objects MUST use ONLY 'append' or 'hasInput+appendTemplate'. NEVER use 'replace'.

1. [missing_sl_tp] Trigger if the user did NOT specify a value for TP/SL (either because they mentioned it without a value, or because they did NOT mention TP/SL/exit rules at all in their strategy).
   -> Ask: '❓ 您未设定止损/止盈，请设定具体额度：'
   -> Options: append '; TP/SL 5', '; TP/SL 10', hasInput appendTemplate='; TP/SL {value}'

2. [martingale_step] Trigger if the user requested a Martingale or grid strategy but did NOT specify the step distance (e.g. '每跌X点加仓').
   -> Ask: '❓ 您提到了下跌加仓，请问每下跌多少点进行加仓？'
   -> Options: append '; 每跌 30 点加仓', '; 每跌 50 点加仓', hasInput appendTemplate='; 每跌 {value} 点加仓'

3. [martingale_max_layers] Trigger if the user requested a Martingale or grid strategy but did NOT specify the maximum layers.
   -> Ask: '❓ 请设置最大加仓层数（包含首单）：'
   -> Options: append '; 最多加仓 5 层', '; 最多加仓 7 层', hasInput appendTemplate='; 最多加仓 {value} 层'

4. [martingale_global_sl] Trigger if the user requested a Martingale strategy and explicitly mentioned '整体保护' or '总止损' or '总浮亏平仓', but did NOT specify the value.
   -> Ask: '❓ 您提到了整体账户浮亏保护，请设置总止损额度：'
   -> Options: append '; 总浮亏超过 100 美元时全平仓', '; 总浮亏超过 150 美元时全平仓', hasInput appendTemplate='; 总浮亏超过 {value} 美元时全平仓'

5. [trailing_stop_params] Trigger if the user explicitly requested trailing stop profit but did NOT specify parameters (activation and callback points).
   -> Ask: '❓ 您启用了移动止盈，请设置具体参数（盈利起步点，回调平仓点）：'
   -> Options: append '; 每单盈利 5 美元起，回调 2 美元移动止盈', '; 每单盈利 10 美元起，回调 3 美元移动止盈', hasInput appendTemplate='; 每单盈利 {value} 美元起，回调 2 美元移动止盈'

6. [ambiguous_period] Trigger if the user mentioned a technical indicator but did NOT specify the period.
   -> Ask: '❓ 请确认指标的周期参数：'
   -> Options: append '; MA周期5', '; MA周期10', '; MA周期20', hasInput appendTemplate='; MA周期{value}'

7. [missing_direction] Trigger only if the strategy is completely vague and cannot determine if it's BUY or SELL.
   -> Ask: '❓ 请确认交易方向：'
   -> Options: append '; 做多', '; 做空'

Only include clarifications for issues that are ACTUALLY present. Empty array if all clear.
Prioritize the most critical issues first.

=== OUTPUT SCHEMA (strict JSON, no markdown) ===
{
  "indicators": { "ind0": "MA(5)", "ind1": "MA(10)" },
  "direction": "BUY",
  "first_buy": "pos_count==0 && ind0>ind1 && ind0[1]<=ind1[1]",
  "first_sell": null,
  "add_buy": null,
  "add_sell": null,
  "lot_multiplier": 1.0,
  "max_layers": 1,
  "exit_all": "close>=last_entry+10 || close<=last_entry-5",
  "pos_sl": null,
  "pos_tp": null,
  "pos_trail_trigger": null,
  "pos_trail_callback": null,
  "user_clarifications": [],
  "developer_feedback": "Technical log..."
}`;

// 4. CORS 跨域头
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

// 4a. Preflight OPTIONS handler (Chrome Extension CORS preflight)
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

// 4b. 接口主路由
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // ============================================================
    // A. 策略编译逻辑 (含有 body.strategy)
    // ============================================================
    if (body.strategy) {
      const userMessage = body.strategy.trim();
      const apiKey = getGeminiApiKey();

      if (!apiKey) {
        console.warn("No Gemini API key found. Using local mock translation.");
        const fallback = mockTranslate(userMessage);
        return NextResponse.json(fallback, { headers: CORS_HEADERS });
      }

      try {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const reqBody = {
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `SYSTEM INSTRUCTION:\n${SYSTEM_INSTRUCTION}\n\nUSER MESSAGE:\n${userMessage}`
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              properties: {
                indicators: {
                  type: "OBJECT",
                  properties: {
                    ind0: { type: "STRING" },
                    ind1: { type: "STRING" },
                    ind2: { type: "STRING" },
                    ind3: { type: "STRING" },
                    ind4: { type: "STRING" }
                  }
                },
                direction: { type: "STRING", enum: ["BUY", "SELL"] },
                first_buy: { type: "STRING" },
                first_sell: { type: "STRING" },
                add_buy: { type: "STRING" },
                add_sell: { type: "STRING" },
                lot_multiplier: { type: "NUMBER" },
                max_layers: { type: "INTEGER" },
                exit_all: { type: "STRING" },
                pos_sl: { type: "NUMBER" },
                pos_tp: { type: "NUMBER" },
                pos_trail_trigger: { type: "NUMBER" },
                pos_trail_callback: { type: "NUMBER" },
                developer_feedback: { type: "STRING" },
                user_clarifications: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    properties: {
                      id: { type: "STRING" },
                      title: { type: "STRING" },
                      options: {
                        type: "ARRAY",
                        items: {
                          type: "OBJECT",
                          properties: {
                            label: { type: "STRING" },
                            append: { type: "STRING" },
                            replace: { type: "STRING" },
                            hasInput: { type: "BOOLEAN" },
                            appendTemplate: { type: "STRING" }
                          },
                          required: ["label"]
                        }
                      }
                    },
                    required: ["id", "title", "options"]
                  }
                }
              },
              required: ["indicators", "direction", "exit_all", "developer_feedback", "user_clarifications"]
            }
          }
        };

        const res = await fetch(geminiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody)
        });

        if (!res.ok) {
          throw new Error(`Gemini HTTP Error ${res.status}`);
        }

        const resData = await res.json();
        const candidate = resData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidate) {
          throw new Error("Empty candidate in Gemini response");
        }

        const compiledJson = JSON.parse(candidate.trim());
        return NextResponse.json(compiledJson, { headers: CORS_HEADERS });
      } catch (err: any) {
        console.error("Gemini compilation failed, using mock fallback:", err);
        const fallback = mockTranslate(userMessage);
        fallback.developer_feedback += ` (Gemini API failed: ${err.message || err})`;
        return NextResponse.json(fallback, { headers: CORS_HEADERS });
      }
    }

    // ============================================================
    // B. 论坛文本翻译逻辑 (含有 body.text)
    // ============================================================
    const { text } = body;
    if (!text) {
      return NextResponse.json({ error: "Text or Strategy is required" }, { status: 400, headers: CORS_HEADERS });
    }

    const translationMap: Record<string, string> = {
      "How I built a fully functional SaaS in 3 hours using Gemini 3.5 Pro and Next.js":
        "如何使用 Gemini 3.5 Pro 和 Next.js 在 3 小时内构建一个功能齐全的 SaaS",
      "I have very little background in react, but today I wanted to test if the \"vibe coding\" hype is real.\n      \nHere is exactly what I did:\n1. I described my idea: a simplified analytics dashboard for indie hackers.\n2. I prompted Gemini 3.5 Pro to generate the nextjs setup commands.\n3. I used standard tailwind cards to make it look super modern.\n4. I hooked up the SQLite db.\n\nThe results are insane. The app compiles, writes records, and looks extremely sleek.\nHow is everyone else vibing? Are we actually entering the zero-syntax developer era?":
        "我几乎没有 React 基础，但今天我想测试一下“vibe coding”的宣传是否属实。\n\n我具体是这么做的：\n1. 我描述了我的想法：一个面向独立开发者的简易分析仪表盘。\n2. 我提示 Gemini 3.5 Pro 生成 Next.js 的安装命令。\n3. 我使用标准的 Tailwind 卡片设计让它看起来非常现代。\n4. 我连接了 SQLite 数据库。\n\n结果太不可思议了。应用成功编译，写入记录，而且外观极其流畅。\n大家最近感觉如何？我们真的要进入“零语法开发时代”了吗？",
      "This is exactly what I mean! The syntax barrier is gone. Now it's all about product thinking.":
        "这就是我所说的！语法障碍消失了。现在一切都看产品思维了。",
      "Did you encounter any hallucinations with the SQLite setup? Sometimes my agent tries to use pg-native packages which fail.":
        "你在 SQLite 配置中遇到幻觉了吗？有时我的 Agent 会尝试使用 pg-native 包，然后报错。",
      "I recommend using Prisma. It handles SQLite out of the box and is super easy to prompt the AI for queries.":
        "我推荐使用 Prisma。它开箱即用支持 SQLite，并且非常容易提示 AI 编写查询语句。",
      "Share your absolute best prompt for debugging tailwind layout alignment":
        "分享你用于调试 Tailwind 布局对齐的绝对最佳提示词",
      "We've all been there: a layout looks perfect on desktop but breaks completely on mobile or medium screen widths. Instead of digging through CSS manually, what is your go-to prompt to get the LLM to fix it?\n\nHere is mine:\n```text\nAnalyze the following CSS/Tailwind classes and layout. It has an alignment issue where elements wrap unexpectedly on md screens. Please output only the corrected code block and explain which utility class was causing the overflow.\n```\n\nLet's share prompt templates that actually save hours!":
        "大家都经历过：布局在桌面端看起来完美，但在移动端或中等屏幕宽度上完全崩塌。不用去手动翻 CSS，你首选的 prompt 是什么？\n\n这是我的：\n```text\n分析以下 CSS/Tailwind 类和布局。它在中等屏幕上存在对齐问题，元素意外折行。请仅输出修改后的代码块，并解释是哪个工具类导致了溢出。\n```\n\n让我们分享那些真正能节省时间的提示词模板！",
      "My prompt is simple: 'Explain it to me like I am 5, then fix it.' Works every time lol.":
        "我的提示词很简单：“像我 5 岁一样解释给我听，然后修复它。” 每次都行，哈哈。",
      "Agreed, keeping prompts simple is key. Overcomplicating it makes the agent hallucinate.":
        "同意，保持 prompt 简单是关键。过于复杂会让 Agent 产生幻觉。",
      "Is anyone actually making money with vibe-coded projects? Let's discuss monetization":
        "真的有人用 vibe-coded 项目赚到钱吗？我们来聊聊变现",
      "Vibe coding allows us to ship projects 10x faster. But shipping is only 10% of the battle. \n\nAre you guys integrating Stripe or Lemon Squeezy? How do you prompt the AI to setup payment webhooks without messing up the database states?\n\nLet's talk numbers and monetization strategies for AI Native developers!":
        "Vibe coding 让我们发版速度快了 10 倍。但发版只是 10% 的战斗。\n\n大家都在集成 Stripe 还是 Lemon Squeezy？你怎么写 prompt 让 AI 设置支付 webhook 而不搞乱数据库状态的？\n\n让我们来谈谈 AI 原生开发者的数字与变现策略！",
      "I'm using Stripe. I just tell the AI: 'Write a Next.js route handler for Stripe webhooks and secure it.' It gets it right 90% of the time.":
        "我用的是 Stripe。我直接告诉 AI：“写一个用于 Stripe Webhook 的 Next.js 路由处理器并保障安全。” 90% 的情况下它都能写对。",
      "We should build a boilerplate repo that has SQLite + Stripe pre-prompted.":
        "我们应该建一个开源脚手架仓库，把 SQLite + Stripe 提示词全部内置好。",
      "Showcase: My 3D Shader Generator built entirely via prompting":
        "展示：完全通过提示词构建 of 3D Shader 生成器",
      "I don't know WebGL or glsl shaders at all. Yet, using Claude 3.5 Sonnet, I generated this fully responsive 3D interactive shader where you can drag mouse to alter gravity waves.\n\nTook me exactly 4 prompts!\nCheck it out, it renders 60fps on mobile. The code is 800 lines of pure math that I didn't write a single line of.\n\nWhat a time to be alive.":
        "我完全不懂 WebGL 或 glsl 编程。但使用 Claude 3.5 Sonnet，我生成了这个完全响应式的 3D 交互着色器，可以通过拖拽鼠标修改引力波。\n\n只用了 4 个提示词！\n瞧瞧这个，它在手机上跑 60 帧。代码里有 800 行纯数学计算，我自己一行没写。\n\n这时代真是太棒了。",
      "This is gorgeous. Could you share the prompt sequence you used? I want to build a similar shader.":
        "这太华丽了。你能分享一下你用的提示词序列吗？我也想写个类似的着色器。"
    };

    const trimmed = text.trim();
    if (translationMap[trimmed]) {
      return NextResponse.json({ translatedText: translationMap[trimmed] });
    }

    const isChinese = /[\u4e00-\u9fa5]/.test(trimmed);
    const translatedText = isChinese
      ? `[Simulated English Translation]: "${trimmed}" has been automatically translated. AI agent is vibing in the background to support global builders!`
      : `[模拟中文翻译]: “${trimmed}” 已被自动翻译。AI 助手正在后台默默写码，支持全球创作者！`;

    return NextResponse.json({ translatedText });
  } catch (error) {
    console.error("Translation handler error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500, headers: CORS_HEADERS });
  }
}
