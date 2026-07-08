from http.server import BaseHTTPRequestHandler
import json
import os
import csv
from datetime import datetime, timedelta

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        # Parse query params
        from urllib.parse import urlparse, parse_qs
        parsed_url = urlparse(self.path)
        query = parse_qs(parsed_url.query)
        
        # Get start and end date (format: YYYY_MM_DD)
        start_str = query.get("start", ["2026_03_11"])[0].strip().replace("-", "_")
        end_str = query.get("end", [start_str])[0].strip().replace("-", "_")
        
        # Parse into datetime objects
        try:
            start_date = datetime.strptime(start_str, "%Y_%m_%d")
            end_date = datetime.strptime(end_str, "%Y_%m_%d")
        except Exception:
            start_date = datetime(2026, 3, 11)
            end_date = datetime(2026, 3, 11)
            
        # Protect server memory: cap range to maximum 5 days
        if (end_date - start_date).days > 4:
            end_date = start_date + timedelta(days=4)
            
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        
        try:
            candles = []
            global_idx = 0
            curr_date = start_date
            
            while curr_date <= end_date:
                date_str = curr_date.strftime("%Y_%m_%d")
                file_path = f"D:/supercfg/cache_1m/2026/XAUUSD_{date_str}.csv"
                
                if os.path.exists(file_path):
                    with open(file_path, "r", encoding="utf-8") as f:
                        reader = csv.DictReader(f)
                        for row in reader:
                            candles.append({
                                "open": float(row["Open"]),
                                "high": float(row["High"]),
                                "low": float(row["Low"]),
                                "close": float(row["Close"]),
                                "time": global_idx
                            })
                            global_idx += 1
                curr_date += timedelta(days=1)
                
            # If no data loaded at all, fallback to default XAUUSD_2026_03_11
            if not candles:
                fallback_path = "D:/supercfg/cache_1m/2026/XAUUSD_2026_03_11.csv"
                with open(fallback_path, "r", encoding="utf-8") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        candles.append({
                            "open": float(row["Open"]),
                            "high": float(row["High"]),
                            "low": float(row["Low"]),
                            "close": float(row["Close"]),
                            "time": global_idx
                        })
                        global_idx += 1
            
            self.wfile.write(json.dumps({
                "start": start_date.strftime("%Y_%m_%d"),
                "end": end_date.strftime("%Y_%m_%d"),
                "candles": candles
            }).encode('utf-8'))
            
        except Exception as e:
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
