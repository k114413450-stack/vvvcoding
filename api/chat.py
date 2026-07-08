from http.server import BaseHTTPRequestHandler
import json
import os
import urllib.request
import urllib.parse
from datetime import datetime, timedelta
import pandas as pd
import yfinance as yf

# Read local Gemini key
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
        
        # Set response headers
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        
        try:
            req_json = json.loads(post_data.decode('utf-8'))
            user_message = req_json.get("message", "").strip()
            
            if not user_message:
                response = {
                    "action": "chat_reply",
                    "reply_text": "请输入您想训练的品种和日期，例如：'2026年1月2日黄金 M1' 或 '2024年3月比特币'。"
                }
                self.wfile.write(json.dumps(response).encode('utf-8'))
                return
                
            # Define strict System Prompt to ensure no general chatting (only structured search mapping)
            system_prompt = (
                "You are a strict semantic parser for Degen Arena.\n"
                "Your ONLY job is to extract search parameters for a historical stock/crypto trading scenario from the user's message.\n\n"
                "Do NOT converse. Do NOT answer general questions. Do NOT write explanations. Do NOT engage in casual conversation.\n"
                "We have access to:\n"
                "1. Local Gold M1 CSV files under 'D:\\supercfg\\cache_1m\\2026\\XAUUSD_YYYY_MM_DD.csv' (covers dates in 2026 from Jan to May)\n"
                "2. Yahoo Finance online database for any crypto, stock, or commodity index (e.g. BTC-USD, GC=F for Gold, SPY for S&P 500).\n\n"
                "If the user wants a scenario (e.g. '2026年1月2日黄金' or '2024-03-05 BTC'), identify:\n"
                "- symbol: Ticker symbol (e.g. 'GC=F' for Gold, 'BTC-USD' for Bitcoin)\n"
                "- start_date / end_date: e.g. '2026-01-02' / '2026-01-03' (For 1m/M1 data, start and end dates should be the same day. For daily/hourly, make the end date 7 to 15 days after start to capture enough bars)\n"
                "- interval: '1m' (only if matching a 2026 local gold date like XAUUSD_2026_01_02), '1h' (default for custom dates), or '1d'\n"
                "- local_file: e.g. 'D:\\\\supercfg\\\\cache_1m\\\\2026\\\\XAUUSD_2026_01_02.csv' (only if matching a local file we have, otherwise null)\n"
                "- scenario_name: a friendly short name in Chinese\n"
                "- scenario_desc: a friendly short description in Chinese\n\n"
                "Output MUST be a valid JSON with this schema:\n"
                "{\n"
                "  \"action\": \"load_scenario\",\n"
                "  \"symbol\": \"...\",\n"
                "  \"start_date\": \"...\",\n"
                "  \"end_date\": \"...\",\n"
                "  \"interval\": \"...\",\n"
                "  \"local_file\": \"...\", // null if not matching local cache\n"
                "  \"scenario_name\": \"...\",\n"
                "  \"scenario_desc\": \"...\"\n"
                "}\n\n"
                "If the user asks a general question, tries to chat, or asks for something not matching a scenario, you MUST output this exact response:\n"
                "{\n"
                "  \"action\": \"chat_reply\",\n"
                "  \"reply_text\": \"对不起，我仅支持行情检索。请输入您想训练的品种和日期，例如：'2026年1月2日黄金 M1' 或 '2024年3月比特币'。\"\n"
                "}"
            )
            
            # Send request to Gemini API
            api_key = get_gemini_key()
            if not api_key:
                response = {
                    "action": "chat_reply",
                    "reply_text": "后台未配置 Gemini API Key，请检查 D:\\webvibc\\GK.txt 配置文件。"
                }
                self.wfile.write(json.dumps(response).encode('utf-8'))
                return
                
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
                    "responseMimeType": "application/json"
                }
            }
            
            req = urllib.request.Request(
                gemini_url,
                data=json.dumps(req_body).encode('utf-8'),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            
            with urllib.request.urlopen(req) as res:
                res_data = json.loads(res.read().decode('utf-8'))
                
            # Extract JSON output from Gemini response
            try:
                candidate = res_data['candidates'][0]['content']['parts'][0]['text']
                gemini_json = json.loads(candidate.strip())
            except Exception as e:
                print(f"Gemini parsing failed: {e}")
                gemini_json = {
                    "action": "chat_reply",
                    "reply_text": "对不起，我仅支持行情检索。请输入您想训练的品种和日期，例如：'2026年1月2日黄金 M1' 或 '2024年3月比特币'。"
                }
            
            action = gemini_json.get("action", "chat_reply")
            
            if action == "chat_reply":
                response = {
                    "action": "chat_reply",
                    "reply_text": gemini_json.get("reply_text", "对不起，我仅支持行情检索。")
                }
                self.wfile.write(json.dumps(response).encode('utf-8'))
                return
                
            # If load_scenario, fetch data
            symbol = gemini_json.get("symbol", "BTC-USD")
            start_date = gemini_json.get("start_date")
            end_date = gemini_json.get("end_date")
            interval = gemini_json.get("interval", "1h")
            local_file = gemini_json.get("local_file")
            scenario_name = gemini_json.get("scenario_name", "AI 检索关卡")
            scenario_desc = gemini_json.get("scenario_desc", "加载的定制复盘关卡")
            
            candle_data = []
            
            # Normalize local_file path if provided
            if local_file:
                local_file = local_file.replace("\\", "/")
            
            # Check local file first (if file exists and we are running locally)
            if local_file and os.path.exists(local_file):
                try:
                    df = pd.read_csv(local_file)
                    # Slice a 150 minute block
                    df_slice = df.iloc[300:450] if len(df) > 450 else df
                    start_mock = datetime(2026, 9, 1)
                    for idx, (_, row) in enumerate(df_slice.iterrows()):
                        mock_date = (start_mock + timedelta(days=idx)).strftime("%Y-%m-%d")
                        candle_data.append({
                            "time": mock_date,
                            "open": round(float(row['Open']), 2),
                            "high": round(float(row['High']), 2),
                            "low": round(float(row['Low']), 2),
                            "close": round(float(row['Close']), 2),
                            "volume": int(row['Ticks'])
                        })
                except Exception as e:
                    print(f"Error reading local file: {e}")
                    
            # Fallback to yfinance if local file not found or not matched
            if not candle_data:
                try:
                    # Download data
                    df = yf.download(symbol, start=start_date, end=end_date, interval=interval)
                    if not df.empty:
                        df = df.dropna()
                        # Flatten MultiIndex columns (standard for yfinance multi-ticker responses)
                        if isinstance(df.columns, pd.MultiIndex):
                            df.columns = df.columns.get_level_values(0)
                        start_mock = datetime(2026, 9, 1)
                        for idx, (_, row) in enumerate(df.iterrows()):
                            mock_date = (start_mock + timedelta(days=idx)).strftime("%Y-%m-%d")
                            try:
                                o = float(row['Open'])
                                h = float(row['High'])
                                l = float(row['Low'])
                                c = float(row['Close'])
                                v = int(row['Volume'])
                                candle_data.append({
                                    "time": mock_date,
                                    "open": round(o, 2),
                                    "high": round(h, 2),
                                    "low": round(l, 2),
                                    "close": round(c, 2),
                                    "volume": v
                                })
                            except Exception as e:
                                print(f"Error parsing row {idx}: {e}")
                except Exception as e:
                    print(f"yfinance download failed: {e}")
                    
            if not candle_data:
                response = {
                    "action": "chat_reply",
                    "reply_text": f"🤖 未能在数据库或在线市场中查询到该交易品种在 {start_date} 至 {end_date} 期间的数据，请换个日期或品种试试。"
                }
                self.wfile.write(json.dumps(response).encode('utf-8'))
                return
                
            # Success response
            response = {
                "action": "load_scenario",
                "scenario_name": scenario_name,
                "scenario_desc": scenario_desc,
                "reply_text": f"🤖 已经为您找到对应的历史行情！点击下方按钮载入并开启 **{scenario_name}**：",
                "candle_data": candle_data
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            print(f"Critical error in chat API: {e}")
            response = {
                "action": "chat_reply",
                "reply_text": "对不起，我仅支持行情检索。请输入您想训练的品种和日期，例如：'2026年1月2日黄金 M1' 或 '2024年3月比特币'。"
            }
            self.wfile.write(json.dumps(response).encode('utf-8'))
