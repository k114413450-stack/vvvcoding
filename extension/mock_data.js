// Static mock K-line data for gold (XAUUSD) during high-volatility event (CPI Release)
// Timeframe: 1M. Price spikes from ~2030 to ~2075 then retraces.
const MOCK_KLINE_DATA = [
  { time: "20:00", open: 2030.50, high: 2031.20, low: 2030.10, close: 2030.80, volume: 1200 },
  { time: "20:01", open: 2030.80, high: 2031.50, low: 2030.40, close: 2031.10, volume: 950 },
  { time: "20:02", open: 2031.10, high: 2031.10, low: 2029.50, close: 2029.80, volume: 1500 },
  { time: "20:03", open: 2029.80, high: 2030.50, low: 2029.20, close: 2030.30, volume: 1100 },
  { time: "20:04", open: 2030.30, high: 2030.90, low: 2030.00, close: 2030.50, volume: 800 },
  { time: "20:05", open: 2030.50, high: 2031.80, low: 2030.20, close: 2031.40, volume: 1300 },
  { time: "20:06", open: 2031.40, high: 2032.50, low: 2031.00, close: 2032.10, volume: 1050 },
  { time: "20:07", open: 2032.10, high: 2032.10, low: 2030.80, close: 2031.20, volume: 1600 },
  { time: "20:08", open: 2031.20, high: 2031.90, low: 2031.00, close: 2031.50, volume: 720 },
  { time: "20:09", open: 2031.50, high: 2032.00, low: 2031.20, close: 2031.70, volume: 890 },
  // CPI RELEASE MOMENT (20:10) - EXPLOSIVE VOLATILITY BEGINS
  { time: "20:10", open: 2031.70, high: 2045.00, low: 2030.50, close: 2042.30, volume: 8900 },
  { time: "20:11", open: 2042.30, high: 2055.60, low: 2041.00, close: 2053.80, volume: 11200 },
  { time: "20:12", open: 2053.80, high: 2058.20, low: 2050.10, close: 2056.40, volume: 9500 },
  { time: "20:13", open: 2056.40, high: 2065.00, low: 2054.20, close: 2062.10, volume: 8800 },
  { time: "20:14", open: 2062.10, high: 2074.50, low: 2060.00, close: 2072.80, volume: 14500 },
  { time: "20:15", open: 2072.80, high: 2078.00, low: 2068.50, close: 2075.20, volume: 13200 },
  // CPI CLIMAX Retracement (20:16)
  { time: "20:16", open: 2075.20, high: 2076.00, low: 2058.00, close: 2060.50, volume: 17800 },
  { time: "20:17", open: 2060.50, high: 2063.40, low: 2050.20, close: 2052.10, volume: 15400 },
  { time: "20:18", open: 2052.10, high: 2054.80, low: 2045.00, close: 2047.60, volume: 12200 },
  { time: "20:19", open: 2047.60, high: 2051.20, low: 2044.10, close: 2049.30, volume: 8900 },
  { time: "20:20", open: 2049.30, high: 2050.00, low: 2042.80, close: 2044.20, volume: 7600 },
  { time: "20:21", open: 2044.20, high: 2047.50, low: 2043.00, close: 2046.80, volume: 6200 },
  { time: "20:22", open: 2046.80, high: 2048.90, low: 2045.50, close: 2047.90, volume: 5500 },
  { time: "20:23", open: 2047.90, high: 2052.40, low: 2047.00, close: 2051.80, volume: 6800 },
  { time: "20:24", open: 2051.80, high: 2054.00, low: 2050.80, close: 2053.10, volume: 5100 },
  { time: "20:25", open: 2053.10, high: 2053.50, low: 2048.20, close: 2049.60, volume: 4900 },
  { time: "20:26", open: 2049.60, high: 2050.20, low: 2047.00, close: 2048.40, volume: 3800 },
  { time: "20:27", open: 2048.40, high: 2049.50, low: 2047.80, close: 2049.10, volume: 3200 },
  { time: "20:28", open: 2049.10, high: 2051.80, low: 2048.80, close: 2051.20, volume: 4100 },
  { time: "20:29", open: 2051.20, high: 2052.50, low: 2050.50, close: 2051.70, volume: 2900 },
  { time: "20:30", open: 2051.70, high: 2052.20, low: 2049.80, close: 2050.30, volume: 3500 },
  { time: "20:31", open: 2050.30, high: 2050.90, low: 2049.20, close: 2049.50, volume: 2800 },
  { time: "20:32", open: 2049.50, high: 2050.40, low: 2048.60, close: 2049.00, volume: 2400 },
  { time: "20:33", open: 2049.00, high: 2049.80, low: 2048.00, close: 2048.30, volume: 3100 },
  { time: "20:34", open: 2048.30, high: 2048.80, low: 2046.20, close: 2046.90, volume: 4200 },
  { time: "20:35", open: 2046.90, high: 2047.50, low: 2045.00, close: 2045.30, volume: 5300 },
  { time: "20:36", open: 2045.30, high: 2046.80, low: 2044.20, close: 2046.10, volume: 4800 },
  { time: "20:37", open: 2046.10, high: 2047.20, low: 2045.80, close: 2046.60, volume: 3300 },
  { time: "20:38", open: 2046.60, high: 2047.00, low: 2045.50, close: 2045.80, volume: 2900 },
  { time: "20:39", open: 2045.80, high: 2046.50, low: 2045.00, close: 2045.20, volume: 3100 },
  { time: "20:40", open: 2045.20, high: 2046.00, low: 2044.60, close: 2045.40, volume: 2500 }
];

if (typeof window !== "undefined") {
  window.MOCK_KLINE_DATA = MOCK_KLINE_DATA;
}
