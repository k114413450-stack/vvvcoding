from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.parse

def get_gemini_key():
    local_path = "D:/webvibc/GK.txt"
    if os.path.exists(local_path):
        try:
            with open(local_path, "r", encoding="utf-8") as f:
                lines = f.read().splitlines()
                if lines:
                    return lines[0].strip()
        except Exception:
            pass
    return os.environ.get("GEMINI_API_KEY", "")

def mock_translate(user_message):
    message = user_message.lower()
    
    # Check for Martingale indicators (including rise/fall grids)
    is_martingale = "马丁" in message or "翻倍" in message or "加仓" in message or "倍" in message or "升" in message or "跌" in message or "涨" in message
    
    # Extract max layers from text if present
    max_layers = 1
    if is_martingale:
        max_layers = 7
        for w in ["7", "七", "六", "6", "五", "5", "八", "8", "十", "10"]:
            if w in message:
                if w in ["7", "七"]: max_layers = 7
                elif w in ["6", "六"]: max_layers = 6
                elif w in ["5", "五"]: max_layers = 5
                elif w in ["8", "八"]: max_layers = 8
                elif w in ["10", "十"]: max_layers = 10
                
    # Detect order direction: default is BUY
    direction = "BUY"
    if "sell" in message or "做空" in message or "卖出" in message:
        direction = "SELL"

    # Detect TP/SL points (e.g. "TP/SL 5")
    tp_sl_points = None
    import re
    pts_match = re.search(r'(tp/sl|止盈止损)[^\d]*(\d+)', message)
    if pts_match:
        tp_sl_points = int(pts_match.group(2))

    # Detect grid step points (e.g. "上升5" -> 5)
    step_points = 50 # Default step
    step_match = re.search(r'(升|跌|涨|降|下|落)[^\d]*(\d+)', message)
    if step_match:
        step_points = int(step_match.group(2))

    # Extract indicators & triggers
    indicators = {}
    first_buy = "pos_count == 0 && close > ind0"
    
    # Check for custom price comparison: "开盘价比前一根高"
    if "开盘" in message or "open" in message:
        if "高" in message or "higher" in message or "above" in message:
            first_buy = "pos_count == 0 && open > open_offset_1"
        else:
            first_buy = "pos_count == 0 && open < open_offset_1"
    # Check for consecutive candles patterns (e.g. "连续4个阳线")
    elif "阳线" in message or "bullish" in message:
        count = 3
        for w in ["2", "two", "二", "3", "three", "三", "4", "four", "四", "5", "five", "五"]:
            if w in message:
                if w in ["2", "two", "二"]: count = 2
                elif w in ["3", "three", "三"]: count = 3
                elif w in ["4", "four", "四"]: count = 4
                elif w in ["5", "five", "五"]: count = 5
        parts = []
        for c in range(count):
            if c == 0:
                parts.append("close > open")
            else:
                parts.append(f"close[{c}] > open[{c}]")
        first_buy = "pos_count == 0 && " + " && ".join(parts)
    elif "阴线" in message or "bearish" in message:
        count = 3
        for w in ["2", "two", "二", "3", "three", "三", "4", "four", "四", "5", "five", "五"]:
            if w in message:
                if w in ["2", "two", "二"]: count = 2
                elif w in ["3", "three", "三"]: count = 3
                elif w in ["4", "four", "四"]: count = 4
                elif w in ["5", "five", "五"]: count = 5
        parts = []
        for c in range(count):
            if c == 0:
                parts.append("close < open")
            else:
                parts.append(f"close[{c}] < open[{c}]")
        first_buy = "pos_count == 0 && " + " && ".join(parts)
    else:
        # Default simple condition: enter on every new bar if flat
        first_buy = "pos_count == 0"
        
    # Exits calculations
    if direction == "SELL":
        if tp_sl_points:
            exit_all = f"close <= last_entry - {tp_sl_points} || close >= last_entry + {tp_sl_points}"
        else:
            exit_all = "close > open"
    else:
        if tp_sl_points:
            exit_all = f"close >= last_entry + {tp_sl_points} || close <= last_entry - {tp_sl_points}"
        else:
            exit_all = "close < open"

    if "均线" in message or "ma" in message:
        # Default dual MA golden cross
        indicators = {
            "ind0": "MA(5)",
            "ind1": "MA(10)"
        }
        first_buy = "pos_count == 0 && ind0 > ind1"
        exit_all = "ind0 < ind1"

    if "rsi" in message:
        # Incorporate RSI
        indicators["ind2"] = "RSI(14)"
        first_buy += " && ind2 < 30"
        
    add_buy = None
    lot_multiplier = 1.0
    if is_martingale:
        # Add logic according to trade direction
        if direction == "SELL":
            add_buy = f"pos_count > 0 && pos_count < {max_layers} && close >= last_entry + {step_points}"
        else:
            add_buy = f"pos_count > 0 && pos_count < {max_layers} && close <= last_entry - {step_points}"
        lot_multiplier = 2.0
        # Martingale exit all on overall PnL target or structural break
        exit_all = f"float_pnl >= 150 || ({exit_all})"
        
    # Parse position-level parameters in mock translate if present
    pos_sl = None
    pos_tp = None
    pos_trail_trigger = None
    pos_trail_callback = None
    
    if "每单独立止损" in message or "每单止损" in message:
        sl_match = re.search(r'(每单独立止损|每单止损)[^\d]*(\d+)', message)
        if sl_match:
            pos_sl = float(sl_match.group(2))
    if "每单独立止盈" in message or "每单止盈" in message:
        tp_match = re.search(r'(每单独立止盈|每单止盈)[^\d]*(\d+)', message)
        if tp_match:
            pos_tp = float(tp_match.group(2))
            
    # Trailing Stop parsing: "每单盈利 5 美元起，回调 2 美元移动止盈"
    if "移动止盈" in message or "每单移损" in message or "每单移动止盈" in message:
        trig_match = re.search(r'(盈利|起步|起)[^\d]*(\d+)', message)
        cb_match = re.search(r'(回调|回撤)[^\d]*(\d+)', message)
        if trig_match and cb_match:
            pos_trail_trigger = float(trig_match.group(2))
            pos_trail_callback = float(cb_match.group(2))

    # Diagnostics telemetry
    user_clarifications = []
    developer_feedback = "Mock translation generated locally."
    
    # 1. missing_sl_tp card (only if user explicitly mentioned standard sl/tp but didn't specify values)
    is_trailing_or_pos = "移动" in message or "每单" in message or "每笔" in message or "移损" in message
    if ("止损" in message or "止盈" in message or "tp" in message or "sl" in message) and not is_trailing_or_pos and not tp_sl_points:
        user_clarifications.append({
            "id": "missing_sl_tp",
            "title": "❓ 您提到了止损/止盈，请设定具体额度：",
            "options": [
                { "label": "🛡️ 5 美元", "append": "; TP/SL 5" },
                { "label": "🛡️ 10 美元", "append": "; TP/SL 10" },
                { "label": "✍️ 自定义", "hasInput": True, "appendTemplate": "; TP/SL {value}" }
            ]
        })
        
    # 2. Martingale step and layers checks (only if martingale strategy is requested)
    if is_martingale:
        # Check if step is specified
        has_step = re.search(r'(升|跌|涨|降|下|落)[^\d]*(\d+)', message) is not None
        if not has_step:
            user_clarifications.append({
                "id": "martingale_step",
                "title": "❓ 您提到了下跌加仓，请问每下跌多少点进行加仓？",
                "options": [
                    { "label": "每跌 30 点加仓", "append": "; 每跌 30 点加仓" },
                    { "label": "每跌 50 点加仓", "append": "; 每跌 50 点加仓" },
                    { "label": "✍️ 自定义", "hasInput": True, "appendTemplate": "; 每跌 {value} 点加仓" }
                ]
            })
            
        # Check if max layers is specified
        has_layers = any(w in message for w in ["层", "次", "上限", "最大"])
        if not has_layers:
            user_clarifications.append({
                "id": "martingale_max_layers",
                "title": "❓ 请设置最大加仓层数（包含首单）：",
                "options": [
                    { "label": "最多加仓 5 层", "append": "; 最多加仓 5 层" },
                    { "label": "最多加仓 7 层", "append": "; 最多加仓 7 层" },
                    { "label": "✍️ 自定义", "hasInput": True, "appendTemplate": "; 最多加仓 {value} 层" }
                ]
            })

        # Check if global stop loss is requested but values are missing
        if ("总浮损" in message or "总浮亏" in message or "整体保护" in message) and ("150 美金" not in message and "150美金" not in message and "100" not in message):
            user_clarifications.append({
                "id": "martingale_global_sl",
                "title": "❓ 您提到了整体账户浮亏保护，请设置总止损额度：",
                "options": [
                    { "label": "🛡️ 总浮亏 100 美元时全平仓", "append": "; 总浮亏超过 100 美元时全平仓" },
                    { "label": "🛡️ 总浮亏 150 美元时全平仓", "append": "; 总浮亏超过 150 美元时全平仓" },
                    { "label": "✍️ 自定义", "hasInput": True, "appendTemplate": "; 总浮亏超过 {value} 美元时全平仓" }
                ]
            })
            
    # 3. Trailing stop parameters check
    if ("移动止盈" in message or "每单移损" in message or "每单移动止盈" in message) and not pos_trail_trigger:
        user_clarifications.append({
            "id": "trailing_stop_params",
            "title": "❓ 您启用了每单移动止盈，请设置具体参数（盈利起步点，回调平仓点）：",
            "options": [
                { "label": "📈 盈利 5 美元起，回调 2 美元止盈", "append": "; 每单盈利 5 美元起，回调 2 美元移动止盈" },
                { "label": "📈 盈利 10 美元起，回调 3 美元止盈", "append": "; 每单盈利 10 美元起，回调 3 美元移动止盈" },
                { "label": "✍️ 自定义起步", "hasInput": True, "appendTemplate": "; 每单盈利 {value} 美元起，回调 2 美元移动止盈" }
            ]
        })

    if "日均线" in message or "日线" in message:
        user_clarifications.append({
            "id": "ma_timeframe",
            "title": "📅 您输入的“X日均线”，在当前 M1 图表上是指：",
            "options": [
                { "label": "📊 5周期/10周期线 (当前K线)", "replace": "5周期均线/10周期均线" },
                { "label": "📅 跨时间5天/10天线 (极平滑)", "replace": "跨周期5天日均线/10天日均线" }
            ]
        })
        developer_feedback += " Warning: Multi-timeframe daily MA requested on minutes chart. Substitution warning displayed."

    return {
        "indicators": indicators,
        "direction": direction,
        "first_buy": first_buy,
        "add_buy": add_buy,
        "lot_multiplier": lot_multiplier,
        "max_layers": max_layers,
        "exit_all": exit_all,
        "pos_sl": pos_sl,
        "pos_tp": pos_tp,
        "pos_trail_trigger": pos_trail_trigger,
        "pos_trail_callback": pos_trail_callback,
        "user_clarifications": user_clarifications,
        "developer_feedback": developer_feedback
    }

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        
        try:
            req_json = json.loads(post_data.decode('utf-8'))
            user_message = req_json.get("strategy", "").strip()
            
            if not user_message:
                self.wfile.write(json.dumps({"error": "Empty strategy input"}).encode('utf-8'))
                return
                
            api_key = get_gemini_key()
            if not api_key:
                # Local fallback mock translation
                result = mock_translate(user_message)
                self.wfile.write(json.dumps(result).encode('utf-8'))
                return
                
            system_prompt = (
                "You are a strict trading strategy semantic parser for a backtesting engine.\n"
                "Your job: translate the user's natural language strategy into a structured JSON config.\n\n"

                "=== SUPPORTED INDICATORS ===\n"
                "- MA(period), EMA(period), RSI(period)\n"
                "- BOLL_MID(period), BOLL_UP(period, std_dev), BOLL_DOWN(period, std_dev)\n"
                "- CCI(period), KDJ_K(n,pk,pd), KDJ_D(n,pk,pd), KDJ_J(n,pk,pd)\n"
                "- MACD_DIF(fast,slow), MACD_DEA(fast,slow,signal), MACD_BAR(fast,slow,signal)\n"
                "- HHV(field, period), LLV(field, period)  [field: high/low/close/open]\n\n"

                "=== FORMULA VARIABLES ===\n"
                "- close, open, high, low, volume\n"
                "- ind0, ind1, ind2... (matched to indicators block keys)\n"
                "- close[1], open[2], high[3]... (historical bar offset, up to [5])\n"
                "- pos_count: number of open position layers (0 = flat)\n"
                "- last_entry: entry price of latest layer (0 if flat)\n"
                "- float_pnl: total floating PnL of all layers (0 if flat)\n"
                "- max_float_pnl: peak float_pnl reached in current trade cycle (0 if flat)\n"
                "- bars_since_entry: bars elapsed since first entry in current cycle (0 if flat)\n\n"

                "=== FORMULA EXAMPLES ===\n"
                "- 4 consecutive bearish candles: close<open && close[1]<open[1] && close[2]<open[2] && close[3]<open[3]\n"
                "- MA(5) crosses above MA(10): ind0>ind1 && ind0[1]<=ind1[1]\n"
                "- EMA(50) slope up (trending): ind0>ind0[1]\n"
                "- Volume breakout (2x prev): volume>volume[1]*2\n"
                "- Trailing stop (BUY, -5 USD): float_pnl<=max_float_pnl-5\n"
                "- Trailing stop (SELL, -5 USD): float_pnl>=max_float_pnl+5\n"
                "- Time exit (>20 bars, losing): bars_since_entry>=20 && float_pnl<0\n"
                "- Fixed SL/TP (BUY ±10): close>=last_entry+10 || close<=last_entry-10\n"
                "- Fixed SL/TP (SELL ±10): close<=last_entry-10 || close>=last_entry+10\n"
                "- Bollinger band dynamic SL/TP: close>=ind0 || close<=ind1\n\n"

                "=== POSITION-LEVEL PARAMETERS (pos_sl, pos_tp, pos_trail_trigger, pos_trail_callback) ===\n"
                "If the user specifies parameters that apply to EACH individual order/position rather than globally:\n"
                "- pos_sl: stop loss distance (in price units/dollars, e.g. 5 for $5 stop loss per order). Fill in the corresponding number field. DO NOT write this into exit_all.\n"
                "- pos_tp: take profit distance (in price units/dollars, e.g. 10 for $10 take profit per order). Fill in the corresponding number field. DO NOT write this into exit_all.\n"
                "- pos_trail_trigger: activation threshold for individual trailing stop profit (e.g. 5 for $5 profit activation). Fill in the corresponding number field. DO NOT write this into exit_all.\n"
                "- pos_trail_callback: pullback callback distance for individual trailing stop profit (e.g. 2 for $2 callback). Fill in the corresponding number field. DO NOT write this into exit_all.\n"
                "Note: Standard stop losses (e.g., '止损5美元') can be mapped to exit_all as a global stop-out, unless the user explicitly wants individual order/position stop-loss (e.g. '每单独立止损5美元' or '每笔订单止损').\n\n"

                "=== DIAGNOSTIC RULES (user_clarifications) ===\n"
                "Scan the user strategy for issues. Generate clarifications ONLY when the user explicitly requests a feature or strategy type but fails to specify the required parameters. Do NOT proactively ask for features/parameters the user did not mention or suggest.\n"
                "IMPORTANT: All option objects MUST use ONLY 'append' or 'hasInput+appendTemplate'. NEVER use 'replace'.\n\n"

                "1. [missing_sl_tp] Trigger ONLY if the user explicitly mentioned '止损' or '止盈' (stop loss/take profit) in their prompt, but did NOT specify a value.\n"
                "   -> Ask: '❓ 您提到了止损/止盈，请设定具体额度：'\n"
                "   -> Options: append '; TP/SL 5', '; TP/SL 10', hasInput appendTemplate='; TP/SL {value}'\n\n"

                "2. [martingale_step] Trigger if the user requested a Martingale or grid strategy (e.g., mentioning '加仓', '马丁', '倍', '网格') but did NOT specify the step distance (e.g. '每跌X点加仓' or step size).\n"
                "   -> Ask: '❓ 您提到了下跌加仓，请问每下跌多少点进行加仓？'\n"
                "   -> Options: append '; 每跌 30 点加仓', '; 每跌 50 点加仓', hasInput appendTemplate='; 每跌 {value} 点加仓'\n\n"

                "3. [martingale_max_layers] Trigger if the user requested a Martingale or grid strategy but did NOT specify the maximum layers/limit (e.g. '最多加仓X次' or '最多X层').\n"
                "   -> Ask: '❓ 请设置最大加仓层数（包含首单）：'\n"
                "   -> Options: append '; 最多加仓 5 层', '; 最多加仓 7 层', hasInput appendTemplate='; 最多加仓 {value} 层'\n\n"

                "4. [martingale_global_sl] Trigger if the user requested a Martingale strategy and explicitly mentioned '整体保护' or '总止损' or '总浮亏平仓', but did NOT specify the value.\n"
                "   -> Ask: '❓ 您提到了整体账户浮亏保护，请设置总止损额度：'\n"
                "   -> Options: append '; 总浮亏超过 100 美元时全平仓', '; 总浮亏超过 150 美元时全平仓', hasInput appendTemplate='; 总浮亏超过 {value} 美元时全平仓'\n\n"

                "5. [trailing_stop_params] Trigger if the user explicitly requested trailing stop profit (e.g., '移动止盈', '每单移动止盈', '移动止损', '移损') but did NOT specify parameters (activation and callback points).\n"
                "   -> Ask: '❓ 您启用了移动止盈，请设置具体参数（盈利起步点，回调平仓点）：'\n"
                "   -> Options: append '; 每单盈利 5 美元起，回调 2 美元移动止盈', '; 每单盈利 10 美元起，回调 3 美元移动止盈', hasInput appendTemplate='; 每单盈利 {value} 美元起，回调 2 美元移动止盈'\n\n"

                "6. [ambiguous_period] Trigger if the user mentioned a technical indicator (like '均线', 'MA', 'RSI') but did NOT specify the period (e.g. just saying '均线金叉入场' without period numbers).\n"
                "   -> Ask: '❓ 请确认指标的周期参数：'\n"
                "   -> Options: append '; MA周期5', '; MA周期10', '; MA周期20', hasInput appendTemplate='; MA周期{value}'\n\n"

                "7. [missing_direction] Trigger only if the strategy is completely vague and cannot determine if it's BUY or SELL.\n"
                "   -> Ask: '❓ 请确认交易方向：'\n"
                "   -> Options: append '; 做多', '; 做空'\n\n"

                "Only include clarifications for issues that are ACTUALLY present. Empty array if all clear.\n"
                "Prioritize the most critical issues first.\n\n"

                "=== DEVELOPER FEEDBACK ===\n"
                "developer_feedback: Always write a detailed technical log covering:\n"
                "- What logic substitutions or assumptions were made\n"
                "- Any whipsaw/overfitting risks (e.g. MA cross on M1 data)\n"
                "- Any engine limitations hit (e.g. unsupported indicators)\n"
                "- Suggestions for improving the template or System Prompt\n\n"

                "=== OUTPUT SCHEMA (strict JSON, no markdown) ===\n"
                "{\n"
                "  \"indicators\": { \"ind0\": \"MA(5)\", \"ind1\": \"MA(10)\" },\n"
                "  \"direction\": \"BUY\",\n"
                "  \"first_buy\": \"pos_count==0 && ind0>ind1 && ind0[1]<=ind1[1]\",\n"
                "  \"first_sell\": null,\n"
                "  \"add_buy\": null,\n"
                "  \"add_sell\": null,\n"
                "  \"lot_multiplier\": 1.0,\n"
                "  \"max_layers\": 1,\n"
                "  \"exit_all\": \"close>=last_entry+10 || close<=last_entry-5\",\n"
                "  \"pos_sl\": null,\n"
                "  \"pos_tp\": null,\n"
                "  \"pos_trail_trigger\": null,\n"
                "  \"pos_trail_callback\": null,\n"
                "  \"user_clarifications\": [\n"
                "    {\n"
                "      \"id\": \"missing_sl_tp\",\n"
                "      \"title\": \"❓ 您提到了止损/止盈，请设定具体额度：\",\n"
                "      \"options\": [\n"
                "        { \"label\": \"5 美元\", \"append\": \"; TP/SL 5\" },\n"
                "        { \"label\": \"10 美元\", \"append\": \"; TP/SL 10\" },\n"
                "        { \"label\": \"自定义\", \"hasInput\": true, \"appendTemplate\": \"; TP/SL {value}\" }\n"
                "      ]\n"
                "    }\n"
                "  ],\n"
                "  \"developer_feedback\": \"Technical log...\"\n"
                "}\n\n"
                "Output ONLY the raw JSON. No markdown. No explanation."
            )
            
            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            req_body = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {"text": f"SYSTEM INSTRUCTION:\n{system_prompt}\n\nUSER MESSAGE:\n{user_message}"}
                        ]
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "responseSchema": {
                        "type": "OBJECT",
                        "properties": {
                            "indicators": {
                                "type": "OBJECT",
                                "properties": {
                                    "ind0": {"type": "STRING"},
                                    "ind1": {"type": "STRING"},
                                    "ind2": {"type": "STRING"},
                                    "ind3": {"type": "STRING"},
                                    "ind4": {"type": "STRING"}
                                }
                            },
                            "direction": {"type": "STRING", "enum": ["BUY", "SELL"]},
                            "first_buy": {"type": "STRING"},
                            "first_sell": {"type": "STRING"},
                            "add_buy": {"type": "STRING"},
                            "add_sell": {"type": "STRING"},
                            "lot_multiplier": {"type": "NUMBER"},
                            "max_layers": {"type": "INTEGER"},
                            "exit_all": {"type": "STRING"},
                            "pos_sl": {"type": "NUMBER"},
                            "pos_tp": {"type": "NUMBER"},
                            "pos_trail_trigger": {"type": "NUMBER"},
                            "pos_trail_callback": {"type": "NUMBER"},
                            "developer_feedback": {"type": "STRING"},
                            "user_clarifications": {
                                "type": "ARRAY",
                                "items": {
                                    "type": "OBJECT",
                                    "properties": {
                                        "id": {"type": "STRING"},
                                        "title": {"type": "STRING"},
                                        "options": {
                                            "type": "ARRAY",
                                            "items": {
                                                "type": "OBJECT",
                                                "properties": {
                                                    "label": {"type": "STRING"},
                                                    "append": {"type": "STRING"},
                                                    "replace": {"type": "STRING"},
                                                    "hasInput": {"type": "BOOLEAN"},
                                                    "appendTemplate": {"type": "STRING"}
                                                },
                                                "required": ["label"]
                                            }
                                        }
                                    },
                                    "required": ["id", "title", "options"]
                                }
                            }
                        },
                        "required": ["indicators", "direction", "exit_all", "developer_feedback", "user_clarifications"]
                    }
                }
            }
            
            req = urllib.request.Request(
                gemini_url,
                data=json.dumps(req_body).encode('utf-8'),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            
            with urllib.request.urlopen(req, timeout=15) as res:
                res_data = json.loads(res.read().decode('utf-8'))
                
            candidate = res_data['candidates'][0]['content']['parts'][0]['text']
            gemini_json = json.loads(candidate.strip())
            
            self.wfile.write(json.dumps(gemini_json).encode('utf-8'))
            
        except Exception as e:
            # Fallback mock in case of timeout or other error
            try:
                fallback_result = mock_translate(user_message)
                fallback_result["developer_feedback"] += f" (Live Gemini failed: {str(e)})"
                self.wfile.write(json.dumps(fallback_result).encode('utf-8'))
            except Exception as e2:
                self.wfile.write(json.dumps({"error": str(e), "fallback_error": str(e2)}).encode('utf-8'))
