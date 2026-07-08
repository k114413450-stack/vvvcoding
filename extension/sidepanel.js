// ── Math & Indicator Calculators ──────────────────────────────────────────

function calcMA(data, period) {
  const ma = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ma.push(null);
    } else {
      let sum = 0;
      for (let j = 0; j < period; j++) sum += data[i - j].close;
      ma.push(sum / period);
    }
  }
  return ma;
}

function calcEMA(data, period) {
  const ema = [];
  if (data.length === 0) return ema;
  let k = 2 / (period + 1);
  let val = data[0].close;
  ema.push(val);
  for (let i = 1; i < data.length; i++) {
    val = data[i].close * k + val * (1 - k);
    ema.push(val);
  }
  return ema;
}

function calcRSI(data, period) {
  const rsi = [];
  if (data.length < period) {
    for (let i = 0; i < data.length; i++) rsi.push(50); // fallback
    return rsi;
  }
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = 0; i <= period; i++) rsi.push(50);

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i].close - data[i - 1].close;
    if (diff > 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) - diff) / period;
    }
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsi.push(100 - 100 / (1 + rs));
  }
  return rsi;
}

// ── Expression Evaluator ──────────────────────────────────────────────────

const safeRegex = /^[a-zA-Z0-9_\s\+\-\*\/\>\<\=\!\&\&\|\(\)\[\]\.\,\:\?]+$/;

function evaluateExpression(expr, context) {
  if (!expr) return false;
  if (expr === "null") return false;
  if (!safeRegex.test(expr)) {
    console.error("Formula contains unsafe characters, rejected:", expr);
    return false;
  }

  // Compile variable offsets: e.g., ind0[1] -> ind0_offset_1
  let processed = expr.replace(/([a-zA-Z0-9_]+)\[(\d+)\]/g, (m, name, offset) => {
    return `${name}_offset_${offset}`;
  });

  try {
    const fn = new Function('ctx', `with(ctx) { return ${processed}; }`);
    return fn(context);
  } catch (e) {
    return false;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────

window.addEventListener('load', () => {
  const btnAnalyze       = document.getElementById('btnAnalyze');
  const btnTest          = document.getElementById('btnTest');
  const strategyInput    = document.getElementById('strategyInput');
  const terminalOutput   = document.getElementById('terminalOutput');
  const aiAssistantCard  = document.getElementById('aiAssistantCard');
  const aiAssistantTitle = document.getElementById('aiAssistantTitle');
  const aiAssistantOptions = document.getElementById('aiAssistantOptions');
  const chartCard        = document.getElementById('chartCard');
  const miniCandleChart  = document.getElementById('miniCandleChart');
  const equityVal        = document.getElementById('equityVal');
  const tradeCountVal    = document.getElementById('tradeCountVal');
  const detectedSymbolText = document.getElementById('detectedSymbolText');

  let isCompiled       = false;
  let currentSymbol    = 'XAUUSD';
  let dataSourceName   = 'Local Data';
  let activeKLineDataset = window.MOCK_KLINE_DATA || [];
  let globalStrategyConfig = {}; // Stores the compiled strategy parameters

  // ── Symbol Detector ─────────────────────────────────────────────────────

  function detectActiveTabSymbol() {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || !tabs.length) return;
      const url   = tabs[0].url   || '';
      const title = tabs[0].title || '';

      let detected = null;
      let src      = 'Local Data';

      if (url.includes('binance.com')) {
        const m = url.match(/\/trade\/([A-Za-z0-9]+)_([A-Za-z0-9]+)/);
        if (m) { detected = (m[1] + m[2]).toUpperCase(); src = 'Binance API'; }

      } else if (url.includes('google.com')) {
        try {
          const q = new URL(url).searchParams.get('q') || '';
          const map = {
            btc:'BTCUSDT', bitcoin:'BTCUSDT',
            eth:'ETHUSDT', ethereum:'ETHUSDT',
            sol:'SOLUSDT', solana:'SOLUSDT',
            bnb:'BNBUSDT', doge:'DOGEUSDT', dogecoin:'DOGEUSDT',
            aapl:'AAPL', apple:'AAPL', tsla:'TSLA', tesla:'TSLA',
            gold:'XAUUSD', xauusd:'XAUUSD', eurusd:'EURUSD'
          };
          for (const token of q.toLowerCase().split(/[^a-z0-9]+/)) {
            if (map[token]) { detected = map[token]; src = detected.endsWith('USDT') ? 'Binance API' : 'Yahoo Finance'; break; }
          }
        } catch (_) {}

      } else if (url.includes('tradingview.com')) {
        const m = url.match(/\/symbols\/([A-Za-z0-9]+)/);
        if (m) {
          detected = m[1].toUpperCase();
          src = 'Yahoo Finance';
        } else {
          const word = title.split(/\s+/)[0].replace(/[^A-Za-z0-9]/g, '');
          if (word.length >= 3 && word.length <= 12) { detected = word.toUpperCase(); src = 'Yahoo Finance'; }
        }
      }

      if (detected && detected !== currentSymbol) {
        currentSymbol  = detected;
        dataSourceName = src;
        detectedSymbolText.textContent = `${currentSymbol} (${dataSourceName})`;
        detectedSymbolText.style.color = '#00ff88';
        loadSymbolData(currentSymbol);
      }
    });
  }

  setInterval(detectActiveTabSymbol, 2000);
  detectActiveTabSymbol();

  // ── K-Line Data Loader ────────────────────────────────────────────────

  const CRYPTO_LIST = ['BTC','ETH','SOL','BNB','ADA','XRP','DOGE','LTC','LINK','DOT','AVAX','MATIC','UNI','SUI'];

  function isCrypto(sym) {
    return sym.endsWith('USDT') || sym.endsWith('USD') || sym.endsWith('BUSD') || sym.endsWith('USDC')
        || CRYPTO_LIST.some(c => sym.startsWith(c));
  }

  function toBinanceSym(sym) {
    if (sym.endsWith('USDT')) return sym;
    if (sym.endsWith('USD'))  return sym.slice(0, -3) + 'USDT';
    if (sym.endsWith('BUSD') || sym.endsWith('USDC')) return sym.slice(0, -4) + 'USDT';
    return sym + 'USDT';
  }

  function toYahooSym(sym) {
    const map = { XAUUSD:'GC=F', GOLD:'GC=F', XAGUSD:'SI=F', EURUSD:'EURUSD=X', GBPUSD:'GBPUSD=X' };
    return map[sym] || sym;
  }

  async function loadSymbolData(symbol) {
    terminalOutput.innerHTML = `<span class="term-muted">[DATA] 正在抓取 ${symbol} 半年走势数据...</span><span class="terminal-cursor"></span>`;

    if (isCrypto(symbol)) {
      const bSym = toBinanceSym(symbol);
      try {
        const now = Date.now();
        const offset = 1000 * 60 * 60 * 1000;
        const [r1, r2] = await Promise.all([
          fetch(`https://api.binance.com/api/v3/klines?symbol=${bSym}&interval=1h&limit=1000&endTime=${now - offset}`).then(r => r.json()),
          fetch(`https://api.binance.com/api/v3/klines?symbol=${bSym}&interval=1h&limit=1000&endTime=${now}`).then(r => r.json())
        ]);
        activeKLineDataset = [...r1, ...r2].map(item => ({
          time:   new Date(item[0]).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' }),
          open:   parseFloat(item[1]),
          high:   parseFloat(item[2]),
          low:    parseFloat(item[3]),
          close:  parseFloat(item[4]),
          volume: parseFloat(item[5])
        }));
        detectedSymbolText.textContent = `${bSym} (Binance API)`;
        terminalOutput.innerHTML = `<span class="term-green2">[DATA] ${bSym} 真实行情加载成功 (${activeKLineDataset.length} 根K线)。</span>`;
      } catch (e) {
        useFallback(`Binance: ${e.message}`);
      }

    } else {
      const ySym = toYahooSym(symbol);
      try {
        const data = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${ySym}?range=6mo&interval=1h`).then(r => r.json());
        const result = data.chart.result[0];
        const ts  = result.timestamp || [];
        const q   = result.indicators.quote[0];
        activeKLineDataset = ts.map((t, i) => ({
          time:   new Date(t * 1000).toLocaleDateString([], { month:'2-digit', day:'2-digit' }),
          open:   q.open[i]  || q.close[i],
          high:   q.high[i]  || q.close[i],
          low:    q.low[i]   || q.close[i],
          close:  q.close[i],
          volume: q.volume[i] || 0
        })).filter(k => k.close != null && k.open != null);
        detectedSymbolText.textContent = `${ySym} (Yahoo Finance)`;
        terminalOutput.innerHTML = `<span class="term-green2">[DATA] ${ySym} 真实行情加载成功 (${activeKLineDataset.length} 根K线)。</span>`;
      } catch (e) {
        useFallback(`Yahoo: ${e.message}`);
      }
    }
  }

  function useFallback(reason) {
    activeKLineDataset = window.MOCK_KLINE_DATA || [];
    detectedSymbolText.textContent = 'XAUUSD (本地数据)';
    terminalOutput.innerHTML = `<span style="color:#ffd600;">[WARN] 行情获取失败，已切换本地演示数据。(${reason})</span>`;
  }

  // ── AI Compiler & Parser ───────────────────────────────────────────────

  function showSuccessSummary() {
    const buyCond = globalStrategyConfig.first_buy || '无';
    const exitCond = globalStrategyConfig.exit_all || '仅依赖止盈止损';
    const tpVal = globalStrategyConfig.pos_tp ? `${globalStrategyConfig.pos_tp} 点` : '未设置';
    const slVal = globalStrategyConfig.pos_sl ? `${globalStrategyConfig.pos_sl} 点` : '未设置';

    terminalOutput.innerHTML =
      `<span class="term-green2">[SUCCESS] AI 策略编译解析成功！</span>
=======================================
<span class="term-cyan">品种锁定</span> : ${currentSymbol}
<span class="term-cyan">交易周期</span> : 1H (1小时K线 / 半年走势)
<span class="term-cyan">买入条件</span> : ${buyCond}
<span class="term-cyan">平仓条件</span> : ${exitCond}
<span class="term-cyan">每单止盈</span> : ${tpVal}
<span class="term-cyan">每单止损</span> : ${slVal}
=======================================
[INFO] 点击下方 "RUN TEST" 启动真实数据回测`;
  }

  // Local Parser fallback if network is completely offline
  function localHeuristicCompile(text) {
    const msg = text.toLowerCase();
    const hasTPSL = msg.includes('止盈') || msg.includes('止损') || msg.includes('tp') || msg.includes('sl');

    if (!hasTPSL) {
      return {
        user_clarifications: [{
          id: "tpsl_confirm",
          title: "为了确保风控，请问您需要设置止盈止损 (TP/SL) 吗？",
          options: [
            { label: "设定 1:2 黄金盈亏比 (止盈 30 点，止损 15 点)", append: "；止盈30点，止损15点" },
            { label: "不设置，仅通过规则平仓", append: "；不设置止盈止损" },
            { label: "自定义止盈止损点数...", labelTemplate: "自定义" }
          ]
        }]
      };
    }

    let direction = "BUY";
    let first_buy = "close > close_offset_1 && close_offset_1 > close_offset_2 && close_offset_2 > close_offset_3"; 
    let exit_all = "close < close_offset_1"; 
    let indicators = {};
    let pos_tp = null;
    let pos_sl = null;

    if (msg.includes('均线') || msg.includes('ma') || msg.includes('金叉')) {
      indicators = { ind0: "MA(5)", ind1: "MA(10)" };
      first_buy = "ind0 > ind1 && ind0_offset_1 <= ind1_offset_1";
      exit_all = "ind0 < ind1 && ind0_offset_1 >= ind1_offset_1";
    }

    const tpMatch = msg.match(/止盈\s*(\d+)/);
    const slMatch = msg.match(/止损\s*(\d+)/);
    if (tpMatch) pos_tp = parseFloat(tpMatch[1]);
    if (slMatch) pos_sl = parseFloat(slMatch[1]);

    return {
      direction,
      first_buy,
      exit_all,
      indicators,
      pos_tp,
      pos_sl,
      user_clarifications: []
    };
  }

  function renderClarification(clar, strategyText) {
    aiAssistantCard.style.display = 'block';
    aiAssistantTitle.textContent  = clar.title;
    aiAssistantOptions.innerHTML  = '';

    clar.options.forEach(opt => {
      const isCustom = !opt.append && !opt.appendTemplate;
      const btn = document.createElement('button');
      btn.className   = 'ai-pill-btn';
      btn.textContent = `👉 ${opt.label}`;

      btn.onclick = () => {
        if (isCustom) {
          aiAssistantOptions.innerHTML = '';
          const wrapper = document.createElement('div');
          wrapper.style.cssText = 'display:flex;gap:6px;margin-top:4px;';

          const inp = document.createElement('input');
          inp.type = 'text';
          inp.placeholder = opt.label + '...';
          inp.style.cssText = 'flex:1;background:rgba(0,229,255,0.05);border:1px solid rgba(0,229,255,0.4);border-radius:6px;color:#e2e8f0;padding:4px 8px;font-size:0.68rem;outline:none;';

          const confirmBtn = document.createElement('button');
          confirmBtn.textContent = '确认';
          confirmBtn.className   = 'ai-pill-btn';
          confirmBtn.style.marginTop = '0';
          confirmBtn.onclick = () => {
            const val = inp.value.trim();
            if (!val) return;
            const sep = strategyText.endsWith('。') || strategyText.endsWith('.') ? ' ' : '，';
            strategyInput.value = strategyText + sep + val;
            aiAssistantCard.style.display = 'none';
            doCompile();
          };
          inp.addEventListener('keydown', e => { if (e.key === 'Enter') confirmBtn.click(); });

          wrapper.appendChild(inp);
          wrapper.appendChild(confirmBtn);
          aiAssistantOptions.appendChild(wrapper);
          inp.focus();
          return;
        }

        let appendStr = (opt.append || opt.appendTemplate || '').replace(/^;\s*/, '');
        const sep = strategyText.endsWith('。') || strategyText.endsWith('.') ? ' ' : '，';
        strategyInput.value = strategyText + sep + appendStr;
        aiAssistantCard.style.display = 'none';
        doCompile();
      };

      aiAssistantOptions.appendChild(btn);
    });
  }

  async function doCompile() {
    const text = strategyInput.value.trim();
    if (!text) {
      terminalOutput.innerHTML = `<span style="color:#ff3b5c;">[ERROR] 请先输入您的交易策略需求。</span>`;
      return;
    }

    isCompiled = false;
    chartCard.style.display = 'none';
    aiAssistantCard.style.display = 'none';

    terminalOutput.innerHTML = `<span class="term-cyan">🤖 AI is thinking...</span>
<span class="term-muted">-> 解析自然语言策略标记中...</span>
<span class="term-muted">-> 构建条件树...</span><span class="terminal-cursor"></span>`;

    await new Promise(r => setTimeout(r, 600));
    terminalOutput.innerHTML = `<span class="term-cyan">🤖 AI is translating strategy...</span>
<span class="term-muted">-> 正在构建交易规则映射关系...</span>
<span class="term-muted">-> 生成本地仿真指标计算函数...</span><span class="terminal-cursor"></span>`;

    let config = null;
    let modeUsed = '';

    try {
      console.log('[DEGEN] 发送请求到云端 AI 编译服务器...');
      const res = await fetch('https://webgame-three-fawn.vercel.app/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy: text })
      });
      
      if (!res.ok) {
        throw new Error(`HTTP Error ${res.status}`);
      }

      config = await res.json();
      console.log('[DEGEN] 云端 AI 响应成功:', config);
      modeUsed = 'Cloud AI';
    } catch (err) {
      console.warn('[DEGEN] 云端 API 异常（可能是网络离线），启用本地安全备用引擎。原因:', err.message || err);
      config = localHeuristicCompile(text);
      modeUsed = 'Local Engine';
    }

    const clar = config.user_clarifications;
    if (clar && clar.length > 0) {
      terminalOutput.innerHTML = `<span class="term-cyan">[INFO] Tokens identified (${modeUsed}).</span>
<span style="color:#ffd600;">[WAIT] 策略参数待确认，请在下方配置风控比例...</span><span class="terminal-cursor"></span>`;
      renderClarification(clar[0], text);
    } else {
      globalStrategyConfig = config;
      isCompiled = true;
      showSuccessSummary();
    }
  }

  btnAnalyze.addEventListener('click', doCompile);

  // ── Dynamic Rule-Based Backtest Canvas Animation ────────────────────────

  let animId = null;

  function startBacktestAnimation() {
    if (animId) cancelAnimationFrame(animId);
    chartCard.style.display = 'block';

    const canvas = miniCandleChart;
    const ctx    = canvas.getContext('2d');
    const w      = canvas.clientWidth;
    const h      = canvas.clientHeight;
    canvas.width  = w * devicePixelRatio;
    canvas.height = h * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const candles = activeKLineDataset;
    if (!candles.length) {
      terminalOutput.innerHTML = `<span style="color:#ff3b5c;">[ERROR] 无行情数据，请等待数据加载完成后再试。</span>`;
      loadSymbolData(currentSymbol);
      return;
    }

    // 1. Calculate indicators series on the fly
    const indicatorsData = {};
    const closes = candles.map(d => d.close);
    const indicatorsDef = globalStrategyConfig.indicators || {};

    Object.keys(indicatorsDef).forEach(key => {
      const spec = indicatorsDef[key];
      if (spec.startsWith('MA(')) {
        const p = parseInt(spec.match(/\d+/)[0]);
        indicatorsData[key] = calcMA(candles, p);
      } else if (spec.startsWith('EMA(')) {
        const p = parseInt(spec.match(/\d+/)[0]);
        indicatorsData[key] = calcEMA(candles, p);
      } else if (spec.startsWith('RSI(')) {
        const p = parseInt(spec.match(/\d+/)[0]);
        indicatorsData[key] = calcRSI(candles, p);
      }
    });

    let step     = Math.min(30, candles.length);
    let lastTime = 0;
    const SPEED  = 80; // Fast-forward speed

    let trades   = [];
    let equity   = 10000;
    let position = null;

    // Reset stat display
    equityVal.textContent    = '$10,000.00';
    tradeCountVal.textContent = '0';

    function priceToY(price, minP, rangeP) {
      return h - 15 - ((price - minP) / rangeP) * (h - 30);
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      // Grid
      ctx.strokeStyle = 'rgba(255,255,255,0.02)';
      ctx.lineWidth   = 1;
      for (let y = 20; y < h; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      const maxVis  = 35;
      const start   = Math.max(0, step - maxVis);
      const spacing = w / maxVis;

      let minP =  Infinity, maxP = -Infinity;
      for (let i = start; i < step; i++) {
        if (candles[i].low  < minP) minP = candles[i].low;
        if (candles[i].high > maxP) maxP = candles[i].high;
      }
      const buf    = (maxP - minP) * 0.1 || 1;
      minP -= buf; maxP += buf;
      const rangeP = maxP - minP;

      // Draw Candles
      for (let i = start; i < step; i++) {
        const d   = candles[i];
        const x   = (i - start) * spacing + spacing / 2;
        const up  = d.close >= d.open;
        const col = up ? '#00ff88' : '#ff3b5c';

        // Wick
        ctx.strokeStyle = col; ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(x, priceToY(d.high, minP, rangeP));
        ctx.lineTo(x, priceToY(d.low,  minP, rangeP));
        ctx.stroke();

        // Body
        ctx.fillStyle = col;
        const by = priceToY(Math.max(d.open, d.close), minP, rangeP);
        const bh = Math.max(2, Math.abs(priceToY(d.close, minP, rangeP) - priceToY(d.open, minP, rangeP)));
        ctx.fillRect(x - (spacing - 3) / 2, by, spacing - 3, bh);

        // Draw active indicators defined in the strategy (No longer hardcoded!)
        Object.keys(indicatorsData).forEach((key, indIdx) => {
          if (i > start) {
            const prevX = (i - 1 - start) * spacing + spacing / 2;
            const valCurr = indicatorsData[key][i];
            const valPrev = indicatorsData[key][i - 1];

            if (valCurr !== null && valPrev !== null && valCurr !== undefined && valPrev !== undefined) {
              ctx.strokeStyle = indIdx === 0 ? '#00e5ff' : '#b388ff';
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(prevX, priceToY(valPrev, minP, rangeP));
              ctx.lineTo(x,  priceToY(valCurr,   minP, rangeP));
              ctx.stroke();
            }
          }
        });
      }

      // Draw executed trade indicators
      trades.forEach(t => {
        const idx = candles.indexOf(t.candle);
        if (idx < start || idx >= step) return;
        const x = (idx - start) * spacing + spacing / 2;
        const y = priceToY(t.price, minP, rangeP);
        ctx.fillStyle = t.type === 'BUY' ? '#00ff88' : '#ff3b5c';
        ctx.beginPath();
        if (t.type === 'BUY') {
          ctx.moveTo(x, y + 10); ctx.lineTo(x - 4, y + 17); ctx.lineTo(x + 4, y + 17);
        } else {
          ctx.moveTo(x, y - 10); ctx.lineTo(x - 4, y - 17); ctx.lineTo(x + 4, y - 17);
        }
        ctx.closePath(); ctx.fill();
      });
    }

    function tick(ts) {
      if (!lastTime) lastTime = ts;
      if (ts - lastTime > SPEED) {
        lastTime = ts;
        step++;

        const i = step - 1;
        if (i < candles.length && i > 0) {
          const close = candles[i].close;
          const open = candles[i].open;
          const high = candles[i].high;
          const low = candles[i].low;

          // 1. Check Take Profit / Stop Loss風控
          if (position) {
            let pnl = (close - position.entryPrice) * position.size * 10;
            let shouldExit = false;

            if (globalStrategyConfig.pos_sl && pnl <= -globalStrategyConfig.pos_sl * position.size) {
              shouldExit = true;
            }
            if (globalStrategyConfig.pos_tp && pnl >= globalStrategyConfig.pos_tp * position.size) {
              shouldExit = true;
            }

            if (shouldExit) {
              equity += pnl;
              trades.push({ candle: candles[i], price: close, type: 'SELL' });
              equityVal.textContent    = `$${equity.toFixed(2)}`;
              tradeCountVal.textContent = trades.length;
              position = null;
            }
          }

          // 2. Build current evaluation context
          const context = {
            close, open, high, low,
            pos_count: position ? 1 : 0,
            balance: equity
          };

          // Load active indicator series
          Object.keys(indicatorsData).forEach(key => {
            context[key] = indicatorsData[key][i];
            for (let o = 1; o <= 5; o++) {
              const prevIdx = i - o;
              context[`${key}_offset_${o}`] = prevIdx >= 0 ? indicatorsData[key][prevIdx] : null;
            }
          });

          // Load candlestick offsets
          for (let o = 1; o <= 5; o++) {
            const prevIdx = i - o;
            context[`close_offset_${o}`] = prevIdx >= 0 ? closes[prevIdx] : null;
            context[`open_offset_${o}`] = prevIdx >= 0 ? candles[prevIdx].open : null;
            context[`high_offset_${o}`] = prevIdx >= 0 ? candles[prevIdx].high : null;
            context[`low_offset_${o}`] = prevIdx >= 0 ? candles[prevIdx].low : null;
          }

          // 3. Process custom exit rules
          if (position && evaluateExpression(globalStrategyConfig.exit_all, context)) {
            let pnl = (close - position.entryPrice) * position.size * 10;
            equity += pnl;
            trades.push({ candle: candles[i], price: close, type: 'SELL' });
            equityVal.textContent    = `$${equity.toFixed(2)}`;
            tradeCountVal.textContent = trades.length;
            position = null;
          }

          // 4. Process custom entry rules
          if (!position && evaluateExpression(globalStrategyConfig.first_buy, context)) {
            position = { entryPrice: close, size: 10 };
            trades.push({ candle: candles[i], price: close, type: 'BUY' });
            tradeCountVal.textContent = trades.length;
          }
        }

        if (step >= candles.length) {
          if (position) {
            const last   = candles[candles.length - 1];
            const profit = (last.close - position.entryPrice) * position.size * 10;
            equity += profit;
            trades.push({ candle: last, price: last.close, type: 'SELL' });
            equityVal.textContent    = `$${equity.toFixed(2)}`;
            tradeCountVal.textContent = trades.length;
          }
          draw();
          return; // done
        }
      }

      draw();
      animId = requestAnimationFrame(tick);
    }

    animId = requestAnimationFrame(tick);
  }

  btnTest.addEventListener('click', () => {
    if (!isCompiled) {
      doCompile().then(() => { if (isCompiled) startBacktestAnimation(); });
    } else {
      startBacktestAnimation();
    }
  });

  // Initial data load
  loadSymbolData(currentSymbol);
});
