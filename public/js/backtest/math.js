const isEN = window.location.pathname.includes('/en/');
function sma(values, period) {
      return values.map((_, i) => {
        if (i < period - 1) return null;
        const slice = values.slice(i - period + 1, i + 1);
        return slice.reduce((a, b) => a + b, 0) / period;
      });
    }

    function ema(values, period) {
      const k = 2 / (period + 1);
      const out = [];
      values.forEach((v, i) => {
        if (i === 0) out.push(v);
        else out.push(v * k + out[i - 1] * (1 - k));
      });
      return out;
    }

    function calcRSI(closes, period = 14) {
      const rsi = [];
      for (let i = 0; i < closes.length; i++) {
        if (i < period) { rsi.push(null); continue; }
        let gain = 0, loss = 0;
        for (let j = i - period + 1; j <= i; j++) {
          const d = closes[j] - closes[j - 1];
          if (d >= 0) gain += d; else loss -= d;
        }
        const rs = loss === 0 ? 100 : gain / loss;
        rsi.push(100 - 100 / (1 + rs));
      }
      return rsi;
    }

    function calcStdDev(values, period) {
      return values.map((_, i) => {
        if (i < period - 1) return null;
        const slice = values.slice(i - period + 1, i + 1);
        const mean = slice.reduce((a, b) => a + b, 0) / period;
        const variance = slice.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / period;
        return Math.sqrt(variance);
      });
    }

    function calcBollUp(values, period, std) {
      const mid = sma(values, period);
      const dev = calcStdDev(values, period);
      return values.map((v, i) => {
        if (mid[i] == null || dev[i] == null) return null;
        return mid[i] + std * dev[i];
      });
    }

    function calcBollDown(values, period, std) {
      const mid = sma(values, period);
      const dev = calcStdDev(values, period);
      return values.map((v, i) => {
        if (mid[i] == null || dev[i] == null) return null;
        return mid[i] - std * dev[i];
      });
    }

    function calcCCI(ohlcData, period = 14) {
      const tp = ohlcData.map(d => (d.high + d.low + d.close) / 3);
      const tpSma = sma(tp, period);
      return ohlcData.map((_, i) => {
        if (i < period - 1) return null;
        const slice = tp.slice(i - period + 1, i + 1);
        const mean = tpSma[i];
        const meanDev = slice.reduce((sum, v) => sum + Math.abs(v - mean), 0) / period;
        if (meanDev === 0) return 0;
        return (tp[i] - mean) / (0.015 * meanDev);
      });
    }

    function calcKDJ(ohlcData, n = 9, pk = 3, pd = 3) {
      const kArr = [];
      const dArr = [];
      const jArr = [];
      
      let kVal = 50;
      let dVal = 50;
      
      for (let i = 0; i < ohlcData.length; i++) {
        if (i < n - 1) {
          kArr.push(null);
          dArr.push(null);
          jArr.push(null);
          continue;
        }
        
        const slice = ohlcData.slice(i - n + 1, i + 1);
        const lows = slice.map(d => d.low);
        const highs = slice.map(d => d.high);
        const llv = Math.min(...lows);
        const hhv = Math.max(...highs);
        
        let rsv = 50;
        if (hhv !== llv) {
          rsv = ((ohlcData[i].close - llv) / (hhv - llv)) * 100;
        }
        
        kVal = (2 * kVal + rsv) / pk;
        dVal = (2 * dVal + kVal) / pd;
        const jVal = 3 * kVal - 2 * dVal;
        
        kArr.push(kVal);
        dArr.push(dVal);
        jArr.push(jVal);
      }
      return { k: kArr, d: dArr, j: jArr };
    }

    function calcMACD(closes, fast = 12, slow = 26, signal = 9) {
      const emaFast = ema(closes, fast);
      const emaSlow = ema(closes, slow);
      const dif = closes.map((_, i) => emaFast[i] - emaSlow[i]);
      const dea = ema(dif, signal);
      const bar = closes.map((_, i) => 2 * (dif[i] - dea[i]));
      return { dif, dea, bar };
    }

    function calcHHV(values, period) {
      return values.map((_, i) => {
        if (i < period - 1) return null;
        return Math.max(...values.slice(i - period + 1, i + 1));
      });
    }

    function calcLLV(values, period) {
      return values.map((_, i) => {
        if (i < period - 1) return null;
        return Math.min(...values.slice(i - period + 1, i + 1));
      });
    }

    // ── 4. Expression Parsing Sandbox ──
    const safeRegex = /^[a-zA-Z0-9_\s\+\-\*\/\>\<\=\!\&\|\(\)\[\]\.\,]+$/;