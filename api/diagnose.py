from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request

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


def build_system_prompt():
    return (
        "你是一名专业的量化策略执行追踪诊断专家（Quant Strategy Execution Tracer）。\n"
        "你的任务：根据用户的策略公式、选定K线区间内各根K线的数据、指标数值、\n"
        "持仓状态（pos_count/float_pnl等）以及逐条件的 true/false 求值结果，\n"
        "用通俗的交易员语言向用户解释：为什么该区间内策略没有触发/错误触发。\n\n"
        "核心规则：\n"
        "1. 你不需要重新做数学计算。所有的子条件 true/false 已经由本地 JS 引擎提前计算好并传给你。\n"
        "2. 你的主要工作是：① 识别哪个子条件是关键阻断点 ② 用通俗语言解释这个数字意味着什么 ③ 给出改进提示词的建议。\n"
        "3. 诊断结论要简短有力（1-2句话），解释要通俗（像经验丰富的交易员对新手讲解）。\n"
        "4. 建议必须给出能直接替换进策略输入框的中文自然语言新提示词（new_prompt）。\n\n"
        "输出严格 JSON 格式（无 markdown）：\n"
        "{\n"
        '  "conclusion": "一句话核心结论，说明为什么没触发或触发错误",\n'
        '  "explanation": "2-4句话通俗解释，结合具体数字说明原因",\n'
        '  "bar_traces": [\n'
        '    {\n'
        '      "bar_index": 42,\n'
        '      "close": 2341.5,\n'
        '      "trace_first_entry": {"close > ind0": false, "close_offset_1 <= ind0_offset_1": true}\n'
        '    }\n'
        '  ],\n'
        '  "suggestions": [\n'
        '    {\n'
        '      "label": "改为使用最高价突破均线（放宽入场条件）",\n'
        '      "prompt_hint": "适合影线穿越但收盘价未站稳的情况",\n'
        '      "new_prompt": "首单当价格最高价突破5日均线时买入，...（完整替换用户原始策略描述）"\n'
        '    }\n'
        '  ]\n'
        "}\n"
    )


def mock_diagnose(payload):
    """本地 fallback 当 Gemini API 不可用时"""
    config = payload.get("strategy_config", {})
    bars = payload.get("selected_bars", [])
    question = payload.get("user_question", "")
    direction = payload.get("direction", "BUY")

    # Find most likely blocking condition
    blocking = None
    blocking_bar = None
    for b in bars:
        trace = b.get("trace", {}).get("first_entry", {})
        for expr, val in trace.items():
            if val is False:
                blocking = expr
                blocking_bar = b
                break
        if blocking:
            break

    if not bars:
        conclusion = "选区内没有 K 线数据，无法诊断。"
        explanation = "请重新框选包含疑问位置的 K 线区间。"
        bar_traces = []
        suggestions = []
    elif blocking and blocking_bar:
        close = blocking_bar.get("close", 0)
        state = blocking_bar.get("state", {})
        pc = state.get("pos_count", 0)
        conclusion = f"第 {blocking_bar['bar_index']} 根K线未触发：条件「{blocking}」求值为 False。"
        explanation = (
            f"在 Bar #{blocking_bar['bar_index']} 时，收盘价为 ${close:.2f}，"
            f"当时持仓层数为 {pc}。"
            f"策略的入场前置条件「{blocking}」在该 K 线上求值为 False，"
            f"因此引擎阻断了入场信号，等待更明确的满足条件。"
        )
        bar_traces = [{
            "bar_index": b["bar_index"],
            "close": b.get("close"),
            "trace_first_entry": b.get("trace", {}).get("first_entry", {})
        } for b in bars[:5]]
        suggestions = [
            {
                "label": "放宽入场条件（加容差）",
                "prompt_hint": "适合价格非常接近临界值时",
                "new_prompt": (payload.get("strategy_config", {}).get("first_buy", "") or "原始策略") + " 【建议：稍微放宽触发阈值后重新测试】"
            }
        ]
    else:
        # No blocking found in first_entry — check if this is a martingale/add_layer strategy
        first_bar = bars[0] if bars else {}
        pc = first_bar.get("state", {}).get("pos_count", 0)
        add_layer_config = config.get("add_buy") or config.get("add_sell")
        max_layers = config.get("max_layers", 1)
        
        if pc > 0 and add_layer_config and pc < max_layers:
            # This is a martingale strategy with open positions — check add_layer conditions
            add_blocking = None
            add_blocking_bar = None
            for b in bars:
                trace = b.get("trace", {}).get("add_layer", {})
                for expr, val in trace.items():
                    if val is False:
                        add_blocking = expr
                        add_blocking_bar = b
                        break
                if add_blocking:
                    break
            
            if add_blocking and add_blocking_bar:
                close = add_blocking_bar.get("close", 0)
                conclusion = f"第 {add_blocking_bar['bar_index']} 根K线加仓条件未满足：「{add_blocking}」求值为 False。"
                explanation = (
                    f"这是一个马丁加仓策略（已有 {pc}/{max_layers} 层持仓）。"
                    f"在 Bar #{add_blocking_bar['bar_index']} 时，收盘价为 ${close:.2f}，"
                    f"加仓条件「{add_blocking}」求值为 False，因此未能继续加仓。"
                )
            else:
                conclusion = f"该区间是马丁加仓策略，当前持仓 {pc}/{max_layers} 层，加仓条件均已满足但未操作（可能已达最大层数或其他限制）。"
                explanation = (
                    f"这是一个马丁加仓策略。当前账户已持有 {pc} 笔订单（最多 {max_layers} 层）。"
                    f"在该区间，加仓条件的子表达式均求值为 True，但引擎未产生加仓信号，"
                    f"请检查是否是因为已达最大层数限制、额度限制或其他风控条件。"
                )
        elif pc > 0 and not add_layer_config:
            conclusion = f"该区间有持仓（持仓层数 {pc}），但您的策略未配置加仓条件，首单条件需要 pos_count == 0。"
            explanation = (
                f"您的策略配置中只有首单条件，没有加仓条件。"
                f"在该区间开始时账户已经持有 {pc} 笔订单，"
                f"因此首单条件（要求 pos_count == 0）无法满足，引擎拒绝了重复开仓。"
            )
        elif pc > 0 and pc >= max_layers:
            conclusion = f"该区间已达最大持仓层数（{pc}/{max_layers}），无法继续加仓。"
            explanation = (
                f"这是一个马丁加仓策略，最多允许 {max_layers} 层持仓。"
                f"当前账户已持有 {pc} 层，已达上限，因此即使加仓条件满足也无法继续加仓。"
            )
        else:
            conclusion = "该区间内策略公式评估结果均为 True，引擎应当触发了入场信号。"
            explanation = "请检查是否是因为图表显示的区间与实际数据索引有偏差，或者策略已经在该位置产生了入场标记（查看K线上的▲符号）。"
        bar_traces = [{
            "bar_index": b["bar_index"],
            "close": b.get("close"),
            "trace_first_entry": b.get("trace", {}).get("first_entry", {}),
            "trace_add_layer": b.get("trace", {}).get("add_layer", {})
        } for b in bars[:5]]
        suggestions = []

    return {
        "conclusion": conclusion,
        "explanation": explanation,
        "bar_traces": bar_traces,
        "suggestions": suggestions
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
            payload = json.loads(post_data.decode('utf-8'))
            api_key = get_gemini_key()

            if not api_key:
                result = mock_diagnose(payload)
                self.wfile.write(json.dumps(result).encode('utf-8'))
                return

            # Build a rich user message for Gemini
            bars_summary = []
            for b in payload.get("selected_bars", [])[:8]:  # cap at 8 bars
                s = b.get("state", {})
                trace = b.get("trace", {})
                bars_summary.append(
                    f"Bar #{b['bar_index']}: close={b.get('close','?'):.2f}, "
                    f"open={b.get('open','?'):.2f}, "
                    f"pos_count={s.get('pos_count',0)}, "
                    f"float_pnl={s.get('float_pnl',0):.2f}, "
                    f"inds={json.dumps(b.get('indicators',{}), ensure_ascii=False)}\n"
                    f"  首单条件求值: {json.dumps(trace.get('first_entry',{}), ensure_ascii=False)}\n"
                    f"  加仓条件求值: {json.dumps(trace.get('add_layer',{}), ensure_ascii=False)}\n"
                    f"  平仓条件求值: {json.dumps(trace.get('exit_all',{}), ensure_ascii=False)}"
                )

            config = payload.get("strategy_config", {})
            user_msg = (
                f"用户策略配置:\n"
                f"  方向: {payload.get('direction','BUY')}\n"
                f"  首单条件: {config.get('first_buy') or config.get('first_sell')}\n"
                f"  加仓条件: {config.get('add_buy') or config.get('add_sell')}\n"
                f"  平仓条件: {config.get('exit_all')}\n"
                f"  最大层数: {config.get('max_layers',1)}\n"
                f"  用户的指标定义: {json.dumps(payload.get('indicators_def',{}), ensure_ascii=False)}\n\n"
                f"用户疑问: {payload.get('user_question','为什么没有入场？')}\n\n"
                f"选区 K 线数据与逐条件求值结果:\n"
                + "\n".join(bars_summary)
            )

            gemini_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            req_body = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [{"text": f"SYSTEM INSTRUCTION:\n{build_system_prompt()}\n\nUSER MESSAGE:\n{user_msg}"}]
                    }
                ],
                "generationConfig": {
                    "responseMimeType": "application/json",
                    "responseSchema": {
                        "type": "OBJECT",
                        "properties": {
                            "conclusion":   {"type": "STRING"},
                            "explanation":  {"type": "STRING"},
                            "bar_traces": {
                                "type": "ARRAY",
                                "items": {
                                    "type": "OBJECT",
                                    "properties": {
                                        "bar_index": {"type": "INTEGER"},
                                        "close":     {"type": "NUMBER"},
                                        "trace_first_entry": {"type": "OBJECT"}
                                    }
                                }
                            },
                            "suggestions": {
                                "type": "ARRAY",
                                "items": {
                                    "type": "OBJECT",
                                    "properties": {
                                        "label":       {"type": "STRING"},
                                        "prompt_hint": {"type": "STRING"},
                                        "new_prompt":  {"type": "STRING"}
                                    },
                                    "required": ["label", "prompt_hint", "new_prompt"]
                                }
                            }
                        },
                        "required": ["conclusion", "explanation", "bar_traces", "suggestions"]
                    }
                }
            }

            req = urllib.request.Request(
                gemini_url,
                data=json.dumps(req_body).encode('utf-8'),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=20) as res:
                res_data = json.loads(res.read().decode('utf-8'))

            candidate = res_data['candidates'][0]['content']['parts'][0]['text']
            result = json.loads(candidate.strip())
            self.wfile.write(json.dumps(result).encode('utf-8'))

        except Exception as e:
            try:
                fallback = mock_diagnose(payload)
                fallback["_fallback_reason"] = str(e)
                self.wfile.write(json.dumps(fallback).encode('utf-8'))
            except Exception as e2:
                self.wfile.write(json.dumps({"error": str(e), "e2": str(e2)}).encode('utf-8'))
