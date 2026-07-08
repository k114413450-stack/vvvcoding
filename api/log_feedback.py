from http.server import BaseHTTPRequestHandler
import json
import os
from datetime import datetime

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        
        try:
            payload = json.loads(post_data.decode('utf-8'))
            
            # Extract fields
            original_prompt = payload.get('original_prompt', '')
            compiled_config = payload.get('compiled_config', {})
            developer_feedback = payload.get('developer_feedback', '')
            error = payload.get('error', '')
            
            # Prepare log line
            log_entry = {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "original_prompt": original_prompt,
                "compiled_config": compiled_config,
                "developer_feedback": developer_feedback,
                "error": error,
                "backtest_result": payload.get('backtest_result', None)
            }
            
            # Ensure local logs directory exists
            log_dir = "D:/webvibc/data"
            os.makedirs(log_dir, exist_ok=True)
            log_path = os.path.join(log_dir, "feedback_logs.jsonl")
            
            # Append log entry to the JSONL file
            with open(log_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(log_entry, ensure_ascii=False) + "\n")
                
            response = {"status": "success", "message": "Feedback log appended successfully"}
            self.wfile.write(json.dumps(response).encode('utf-8'))
            
        except Exception as e:
            response = {"status": "error", "message": str(e)}
            self.wfile.write(json.dumps(response).encode('utf-8'))
