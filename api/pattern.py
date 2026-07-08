from http.server import BaseHTTPRequestHandler
import json
import os
import glob
import pandas as pd
import numpy as np

# Cache for M1 history data to enable sub-100ms searches
_history_opens = None
_history_highs = None
_history_lows = None
_history_closes = None
_history_timestamps = None

def load_all_m1_history():
    global _history_opens, _history_highs, _history_lows, _history_closes, _history_timestamps
    if _history_closes is not None:
        return _history_opens, _history_highs, _history_lows, _history_closes, _history_timestamps
        
    print("Loading M1 history database...")
    
    # Try loading from the packaged compressed pickle first
    compressed_paths = [
        "data/xau_m1_history.pkl.gz",
        "../data/xau_m1_history.pkl.gz",
        "/var/task/data/xau_m1_history.pkl.gz",
        os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "xau_m1_history.pkl.gz")
    ]
    
    compressed_file = None
    for p in compressed_paths:
        if os.path.exists(p):
            compressed_file = p
            break
            
    if compressed_file:
        try:
            import gzip
            import pickle
            print(f"Loading from compressed database: {compressed_file}")
            with gzip.open(compressed_file, "rb") as f:
                db = pickle.load(f)
            _history_opens = np.array(db["opens"], dtype=np.float32)
            _history_highs = np.array(db["highs"], dtype=np.float32)
            _history_lows = np.array(db["lows"], dtype=np.float32)
            _history_closes = np.array(db["closes"], dtype=np.float32)
            _history_timestamps = db["timestamps"]
            print(f"Loaded total {_history_closes.shape[0]} M1 OHLC records from compressed database")
            return _history_opens, _history_highs, _history_lows, _history_closes, _history_timestamps
        except Exception as e:
            print(f"Failed to load compressed database: {e}")
            
    # Fallback to scanning raw directory (useful for local development)
    csv_files = glob.glob("D:/supercfg/cache_1m/**/*.csv", recursive=True)
    csv_files = sorted(csv_files)  # Sort chronologically
    
    all_opens = []
    all_highs = []
    all_lows = []
    all_closes = []
    all_ts = []
    
    for fpath in csv_files:
        try:
            fname = os.path.basename(fpath)
            parts = fname.replace(".csv", "").split("_")
            if len(parts) >= 4:
                date_str = f"{parts[1]}-{parts[2]}-{parts[3]}"
            else:
                date_str = "2026-01-01"
                
            df = pd.read_csv(fpath)
            open_col = next((c for c in ["Open", "open", "OPEN", "o", "O"] if c in df.columns), None)
            high_col = next((c for c in ["High", "high", "HIGH", "h", "H"] if c in df.columns), None)
            low_col = next((c for c in ["Low", "low", "LOW", "l", "L"] if c in df.columns), None)
            close_col = next((c for c in ["Close", "close", "CLOSE", "c", "C"] if c in df.columns), None)
            
            if not all([open_col, high_col, low_col, close_col]):
                continue
                
            opens = df[open_col].values.astype(np.float32)
            highs = df[high_col].values.astype(np.float32)
            lows = df[low_col].values.astype(np.float32)
            closes = df[close_col].values.astype(np.float32)
            
            all_opens.append(opens)
            all_highs.append(highs)
            all_lows.append(lows)
            all_closes.append(closes)
            
            for minute_idx in range(len(closes)):
                all_ts.append(f"{date_str} {minute_idx:02d}:{minute_idx%60:02d}")
                
        except Exception as e:
            print(f"Failed loading {fpath}: {e}")
            
    if all_closes:
        _history_opens = np.concatenate(all_opens)
        _history_highs = np.concatenate(all_highs)
        _history_lows = np.concatenate(all_lows)
        _history_closes = np.concatenate(all_closes)
        _history_timestamps = all_ts
        print(f"Loaded total {_history_closes.shape[0]} M1 OHLC candle database")
    else:
        # Fallback empty
        _history_opens = np.array([], dtype=np.float32)
        _history_highs = np.array([], dtype=np.float32)
        _history_lows = np.array([], dtype=np.float32)
        _history_closes = np.array([], dtype=np.float32)
        _history_timestamps = []
        
    return _history_opens, _history_highs, _history_lows, _history_closes, _history_timestamps

def normalize_pattern(arr):
    # Min-max scaling to range [0, 1]
    amin, amax = np.min(arr), np.max(arr)
    diff = amax - amin
    if diff < 1e-5:
        return np.zeros_like(arr)
    return (arr - amin) / diff

def search_patterns(target_prices, top_k=5, future_len=30):
    history_opens, history_highs, history_lows, history_closes, history_ts = load_all_m1_history()
    
    n = len(target_prices)
    m = len(history_closes)
    
    if n < 5 or m < n + future_len:
        return []
        
    target_norm = normalize_pattern(np.array(target_prices, dtype=np.float32))
    
    # We will do rolling min-max normalization and compute correlation
    # To make it vectorized and extremely fast:
    # Related formulas: correlation = cov(x, y) / (std(x) * std(y))
    # We can pre-normalize slices or do rolling correlation
    matches = []
    
    # Since n is relatively small (e.g. 15-50), we can run a vectorized sliding dot product
    # Shape of windows: (m - n + 1, n)
    # Using numpy stride tricks to get rolling windows
    shape = (m - n - future_len + 1, n)
    strides = (history_closes.strides[0], history_closes.strides[0])
    windows = np.lib.stride_tricks.as_strided(history_closes, shape=shape, strides=strides)
    
    # Normalize each window
    w_min = windows.min(axis=1, keepdims=True)
    w_max = windows.max(axis=1, keepdims=True)
    w_diff = w_max - w_min
    
    # Avoid division by zero
    w_diff[w_diff < 1e-5] = 1.0
    
    # Vectorized min-max scaling of all windows
    windows_norm = (windows - w_min) / w_diff
    
    # Compute Euclidean distance or Pearson Correlation
    # Let's compute mean absolute error (MAE) or Euclidean distance of normalized signals
    # Distance: sum((x - y)^2)
    dist = np.mean((windows_norm - target_norm) ** 2, axis=1)
    
    # Find indices with lowest distance
    # Sort and pick top indices, making sure they don't overlap too much
    sorted_indices = np.argsort(dist)
    
    selected_indices = []
    min_dist_between_indices = n * 2  # prevent overlapping match results
    
    for idx in sorted_indices:
        if len(selected_indices) >= top_k:
            break
            
        # Check overlaps
        overlap = False
        for s_idx in selected_indices:
            if abs(s_idx - idx) < min_dist_between_indices:
                overlap = True
                break
        if not overlap:
            selected_indices.append(int(idx))
            
    # Package matches
    results = []
    for idx in selected_indices:
        # Match slice OHLC
        match_candles = []
        for i in range(n):
            c_idx = idx + i
            match_candles.append({
                "open": float(history_opens[c_idx]),
                "high": float(history_highs[c_idx]),
                "low": float(history_lows[c_idx]),
                "close": float(history_closes[c_idx])
            })
            
        # Future slice OHLC
        future_candles = []
        for i in range(future_len):
            c_idx = idx + n + i
            future_candles.append({
                "open": float(history_opens[c_idx]),
                "high": float(history_highs[c_idx]),
                "low": float(history_lows[c_idx]),
                "close": float(history_closes[c_idx])
            })
            
        match_times = history_ts[idx : idx + n]
        future_times = history_ts[idx + n : idx + n + future_len]
        
        results.append({
            "score": float(1.0 - dist[idx]),  # Similarity score (higher is better)
            "start_time": match_times[0],
            "end_time": match_times[-1],
            "match_candles": match_candles,
            "future_candles": future_candles,
            "match_closes": [c["close"] for c in match_candles],
            "future_closes": [c["close"] for c in future_candles],
            "future_times": future_times
        })
        
    return results

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
            req = json.loads(post_data.decode('utf-8'))
            pattern = req.get("pattern", [])
            top_k = int(req.get("top_k", 5))
            future_len = int(req.get("future_len", 30))
            
            if not pattern or len(pattern) < 5:
                self.wfile.write(json.dumps({"error": "Pattern slice too short"}).encode('utf-8'))
                return
                
            matches = search_patterns(pattern, top_k=top_k, future_len=future_len)
            self.wfile.write(json.dumps({"matches": matches}).encode('utf-8'))
            
        except Exception as e:
            self.wfile.write(json.dumps({"error": str(e)}).encode('utf-8'))
