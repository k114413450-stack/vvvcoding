// manual_ui.js — 价格行为学手动秒级训练器 (Degen Trainer) 前端业务控制器
// TICK级仿真引擎 v2.0: 每根M1蜡烛分12个tick播放，200ms/tick → 每根蜡烛2.4秒真实时间

(function () {
  const SYMBOLS = [
    { code: "XAUUSD", name: "黄金 (XAUUSD)", desc: "避险金价，秒级多空超级短线对战。" },
    { code: "BTCUSD", name: "比特币 (BTCUSD)", desc: "加密货币之王，巨额振幅插针洗盘。" },
    { code: "ETHUSD", name: "以太坊 (ETHUSD)", desc: "主流山寨领头羊，剧烈波动绞杀合约。" }
  ];

  const VOLATILE_DATES = ["2026_03_11", "2026_04_17", "2026_05_19", "2026_02_13", "2026_01_15"];

  // ═══════════════════════════════════════════════════════
  // 2. 全局状态
  // ═══════════════════════════════════════════════════════
  let currentSymbol   = SYMBOLS[0];
  let currentScenario = null;
  let allCandles     = [];   // 全天完整M1数据
  window.ohlc        = [];   // 图表渲染数组 (含当前正在构建的蜡烛)
  window.backtestTrades  = [];
  window.activeIndicators = { rsi: [], macd: [] };
  window.activeSubTab     = 'rsi';
  window.scrollOffset     = 0;
  window.visibleBars      = 100;
  window.globalStrategyConfig = { indicators: { rsi: 'RSI(14)' } };

  // 交易账户
  let accountBalance   = 10000.00;
  let totalRealizedPnL = 0.00;
  let currentEquity    = 10000.00;
  let maxDrawdown      = 0.0;
  let peakEquity       = 10000.00;
  let ticketCounter    = 600001;
  let activeTickets    = [];
  let historyTickets   = [];

  // ─── Tick引擎控制变量 ───
  const TICKS_PER_CANDLE = 60;   // 每根M1蜡烛 60个tick
  const TICK_MS          = 1000; // 每个tick间隔 1000ms → 每根蜡烛 = 60秒 (真实M1时间)

  let currentBarIndex = 0;  // 当前"已完结"的蜡烛索引
  let endBarIndex     = 0;  // 战役结束蜡烛索引 (bestStart + windowSize)
  let currentTickIdx  = 0;  // 当前蜡烛内第几个tick (0 ~ TICKS_PER_CANDLE-1)
  let currentPrice    = 0;  // 当前Tick价格 (实时更新)
  let buildingHigh    = 0;  // 当前蜡烛已走过的最高价 (随tick实时增长，不泄露未来)
  let buildingLow     = 0;  // 当前蜡烛已走过的最低价
  let isPlaying       = false;
  let tickTimer       = null;

  // 图表拖拽 / 滚轮翻页控制
  let userPanning     = false;    // 用户正在手动拖拽中
  let panResumeTimer  = null;     // 拖拽停止后重新跟踪的计时器
  const PAN_MARGIN    = 5;        // 最新K线应保留的右侧空白柱数

  // ═══════════════════════════════════════════════════════
  // 3. 初始化
  // ═══════════════════════════════════════════════════════
  window.addEventListener("load", () => {
    renderSymbolList();
    
    // 默认加载黄金的一个随机剧烈波动场景
    const initialSc = getRandomVolatileScenario(currentSymbol);
    loadScenario(initialSc);
    
    bindEvents();
  });

  // 随机生成一个剧烈波动场景定义
  function getRandomVolatileScenario(sym) {
    const randomDate = VOLATILE_DATES[Math.floor(Math.random() * VOLATILE_DATES.length)];
    const dateLabel = randomDate.replace(/_/g, "-");
    return {
      id: "sc_random_" + sym.code + "_" + randomDate,
      symbol: sym.code,
      date: randomDate,
      name: `${sym.name} - 随机高能爆发盘面`,
      desc: `当前对战时间: ${dateLabel}。系统已为您自动锁定当日振幅最大的 35 根 M1 蜡烛区间，迎接秒级行情冲锋！`
    };
  }

  // 渲染左侧交易品种列表 (demo.html premium watch-item style)
  function renderSymbolList() {
    const listEl = document.getElementById("symbolList");
    if (!listEl) return;
    listEl.innerHTML = "";

    SYMBOLS.forEach(sym => {
      const li = document.createElement("li");
      li.className = "watch-item" + (sym.code === currentSymbol.code ? " active" : "");
      li.innerHTML = `
        <span class="watch-dot" aria-hidden="true"></span>
        <span class="watch-symbol">${sym.name}</span>
        <span class="watch-value" style="font-size:0.6rem; color:var(--text-dim);">${sym.desc}</span>
      `;
      li.addEventListener("click", () => {
        document.querySelectorAll("#symbolList li").forEach(el => {
          el.classList.remove("active");
        });
        li.classList.add("active");
        
        currentSymbol = sym;
        const sc = getRandomVolatileScenario(sym);
        loadScenario(sc);
      });
      listEl.appendChild(li);
    });
  }


  // ═══════════════════════════════════════════════════════
  // 4. 加载战役数据
  // ═══════════════════════════════════════════════════════
  async function loadScenario(sc) {
    pauseReplay();
    currentScenario = sc;

    document.getElementById("currScenarioName").textContent = sc.name;
    document.getElementById("currScenarioDesc").textContent = sc.desc;
    document.getElementById("tradeHistoryBody").innerHTML = `
      <tr style="color: var(--text-dim);"><td colspan="7" style="padding: 12px; text-align: center;">正在向服务器拉取 ${sc.name} 行情历史数据...</td></tr>
    `;

    try {
      const symbol = sc.symbol || "XAUUSD";
      const res  = await fetch(`/api/history?symbol=${symbol}&start=${sc.date}&end=${sc.date}`);
      const data = await res.json();
      if (!res.ok || !data.candles || data.candles.length === 0) {
        throw new Error(data.error || "No data loaded");
      }

      const fullCandles = data.candles;

      // 计算全天指标 (保持指标连续性)
      const fullCloses  = fullCandles.map(c => c.close);
      const fullRsi     = calcRSI(fullCloses, 14);
      const fullMacdObj = calcMACD(fullCloses, 12, 26, 9);

      // 扫描最大波幅 35 根区间
      const windowSize = 35;
      let maxDiff = -1, bestStart = 0;
      for (let i = 0; i <= fullCandles.length - windowSize; i++) {
        const sl   = fullCandles.slice(i, i + windowSize);
        const diff = Math.max(...sl.map(c => c.high)) - Math.min(...sl.map(c => c.low));
        if (diff > maxDiff) { maxDiff = diff; bestStart = i; }
      }

      // 使用全天数据，从爆发点起播
      allCandles = fullCandles;
      window.activeIndicators.rsi  = fullRsi;
      window.activeIndicators.macd = fullMacdObj.macd;

      currentBarIndex = bestStart;
      endBarIndex     = bestStart + windowSize;
      currentTickIdx  = 0;

      // 重置账户
      accountBalance   = 10000.00;
      totalRealizedPnL = 0.00;
      currentEquity    = 10000.00;
      maxDrawdown      = 0.0;
      peakEquity       = 10000.00;
      activeTickets    = [];
      historyTickets   = [];
      window.backtestTrades = [];

      // 初始化 ohlc：显示 bestStart 前的所有历史蜡烛
      window.ohlc = allCandles.slice(0, currentBarIndex + 1);
      currentPrice = allCandles[currentBarIndex].close;

      updateTerminalDisplay();
      renderScene(currentPrice);
      playReplay();
    } catch (err) {
      document.getElementById("tradeHistoryBody").innerHTML = `
        <tr style="color: #ff3b5c;"><td colspan="7" style="padding: 12px; text-align: center;">加载失败: ${err.message}。请重试或检查后端代理。</td></tr>
      `;
    }
  }

  // ═══════════════════════════════════════════════════════
  // 5. Tick引擎核心 — 合成当前蜡烛内的价格运动
  // ═══════════════════════════════════════════════════════

  /**
   * 根据蜡烛 OHLC 和当前 tick 序号，生成模拟价格
   * 路径模型: open → wick_extreme → close
   * 前半段走到wick极端，后半段收回到close
   */
  function synthTickPrice(candle, tickIdx) {
    const { open, high, low, close } = candle;
    const t = tickIdx / TICKS_PER_CANDLE; // 0.0 ~ 1.0
    const bullish = close >= open;

    // 判断wick方向：bull走upper wick, bear走lower wick
    const wickExtreme = bullish ? high : low;

    let price;
    if (t <= 0.5) {
      // 前半段: open → wickExtreme
      const frac = t * 2; // 0→1
      price = open + (wickExtreme - open) * easeInOut(frac);
    } else {
      // 后半段: wickExtreme → close
      const frac = (t - 0.5) * 2; // 0→1
      price = wickExtreme + (close - wickExtreme) * easeInOut(frac);
    }

    // 加入轻微随机噪声 (±0.5点以内，模拟真实tick抖动)
    const noise = (Math.random() - 0.5) * 0.5;
    return Math.round((price + noise) * 100) / 100;
  }

  function easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  // ═══════════════════════════════════════════════════════
  // 6. 主Tick循环
  // ═══════════════════════════════════════════════════════
  function onTick() {
    if (currentBarIndex >= endBarIndex) {
      triggerGameOver(false);
      return;
    }

    const candle = allCandles[currentBarIndex];

    // 新蜗烛开始时重置已见极値，从 open 起算
    if (currentTickIdx === 0) {
      buildingHigh = candle.open;
      buildingLow  = candle.open;
    }

    currentPrice = synthTickPrice(candle, currentTickIdx);

    // 随 tick 实时更新已见极値（不使用未来的真实 high/low）
    buildingHigh = Math.max(buildingHigh, currentPrice);
    buildingLow  = Math.min(buildingLow,  currentPrice);

    // 正在构建的蜗烛：只反映已经走过的价格路径
    const buildingCandle = {
      open:  candle.open,
      high:  buildingHigh,
      low:   buildingLow,
      close: currentPrice,
      time:  candle.time
    };
    // ohlc = 历史已完结蜡烛 + 当前正在构建的蜡烛
    window.ohlc = allCandles.slice(0, currentBarIndex).concat([buildingCandle]);

    // 自动滚动视口（仅在用户未手动拖拽时）
    if (!userPanning) {
      const displayIdx = window.ohlc.length - 1;
      const visBars    = window.visibleBars || 100;
      // 保留右侧 PAN_MARGIN 根马香空间，防止最新K线房跟在最右边界外
      const targetOffset = Math.max(0, displayIdx - (visBars - PAN_MARGIN - 1));
      window.scrollOffset = targetOffset;
    }

    // 重绘场景
    renderScene(currentPrice);

    // 更新浮动盈亏
    updateFloatingPnL(currentPrice);

    // 推进tick
    currentTickIdx++;
    if (currentTickIdx >= TICKS_PER_CANDLE) {
      // 蜡烛完结，推进到下一根
      currentTickIdx = 0;
      currentBarIndex++;
    }
  }

  // ═══════════════════════════════════════════════════════
  // 7. 场景渲染 (每Tick调用)
  // ═══════════════════════════════════════════════════════
  function renderScene(price) {
    const spread = 0.50;

    // 更新K线图
    const canvas = document.getElementById("candleChart");
    drawBgMesh(document.getElementById('bgMesh'));
    const layout = drawMainChart(canvas, window.ohlc, price);

    // 更新RSI / MACD子图 — slice to the visible window matching scrollOffset
    const scrollOff = window.scrollOffset || 0;
    const visBars   = window.visibleBars  || 100;
    const rsiSlice  = (window.activeIndicators.rsi  || []).slice(scrollOff, scrollOff + visBars);
    const macdArr   = (window.activeIndicators.macd || []).slice(scrollOff, scrollOff + visBars);
    drawRSI(document.getElementById('rsiChart'), rsiSlice, layout);
    drawMACD(document.getElementById('macdChart'), { macd: macdArr, signal: macdArr, hist: macdArr.map(() => 0) }, layout);

    // 更新价格标签 (header lastPrice)
    const lastPriceEl = document.getElementById("lastPrice");
    if (lastPriceEl) lastPriceEl.textContent = price.toFixed(2);

    // 更新 MT5 买卖报价
    document.getElementById("mt5BidPrice").textContent = price.toFixed(2);
    document.getElementById("mt5AskPrice").textContent = (price + spread).toFixed(2);
  }

  // ═══════════════════════════════════════════════════════
  // 8. 浮动盈亏更新
  // ═══════════════════════════════════════════════════════
  function updateFloatingPnL(price) {
    const spread = 0.50;
    let totalFloatingPnL = 0;

    activeTickets.forEach(t => {
      const mult     = t.type === 'BUY' ? 1 : -1;
      const refPrice = t.type === 'BUY' ? price : (price + spread);
      t.floatingPnL  = (refPrice - t.entryPrice) * t.lots * 100 * mult;
      totalFloatingPnL += t.floatingPnL;
    });

    currentEquity = accountBalance + totalRealizedPnL + totalFloatingPnL;

    if (currentEquity > peakEquity) peakEquity = currentEquity;
    const dd = ((peakEquity - currentEquity) / peakEquity) * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;

    if (currentEquity <= 0) {
      currentEquity = 0;
      triggerGameOver(true);
      return;
    }

    document.getElementById("lblAccountEquity").textContent = currentEquity.toFixed(2);
    const flEl = document.getElementById("lblFloatingPnL");
    flEl.textContent = (totalFloatingPnL >= 0 ? "+" : "") + totalFloatingPnL.toFixed(2);
    flEl.style.color = totalFloatingPnL >= 0 ? "#00ff88" : "#ff3b5c";

    updateTerminalTable(totalFloatingPnL);
  }

  // ═══════════════════════════════════════════════════════
  // 9. 手动下单
  // ═══════════════════════════════════════════════════════
  function handleManualOrder(type) {
    if (allCandles.length === 0 || currentPrice === 0) return;
    const lotsInput = document.getElementById("mt5LotsInput");
    const lots      = parseFloat(lotsInput.value) || 0.1;
    const ticketId  = ++ticketCounter;

    const order = {
      ticket:     ticketId,
      type:       type,
      entryPrice: currentPrice,
      lots:       lots,
      entryIndex: currentBarIndex,
      closePrice: null,
      closeIndex: null,
      floatingPnL: 0,
      realizedPnL: 0,
      status: 'OPEN'
    };
    activeTickets.push(order);

    window.backtestTrades.push({
      index: currentBarIndex,
      price: currentPrice,
      type:  type === 'BUY' ? 'BUY_MANUAL' : 'SELL_MANUAL'
    });

    // 闪烁反馈
    const btn = document.getElementById(type === 'BUY' ? 'mt5BuyBtn' : 'mt5SellBtn');
    btn.style.filter = "brightness(1.5) contrast(1.2)";
    setTimeout(() => btn.style.filter = "none", 120);

    updateTerminalDisplay();
  }

  // 手动平仓所有订单
  function handleCloseAll() {
    if (activeTickets.length === 0) return;

    activeTickets.forEach(t => {
      t.status     = 'CLOSED';
      t.closePrice = currentPrice;
      t.closeIndex = currentBarIndex;

      const multiplier = t.type === 'BUY' ? 1 : -1;
      t.realizedPnL    = (currentPrice - t.entryPrice) * t.lots * 100 * multiplier;
      totalRealizedPnL += t.realizedPnL;

      historyTickets.push(t);
      window.backtestTrades.push({
        index: currentBarIndex,
        price: currentPrice,
        type:  'EXIT'
      });
    });

    activeTickets = [];
    updateTerminalDisplay();
  }

  window.restartCurrentScenario = () => {
    closeGameOverModal();
    loadScenario(currentScenario);
  };

  // ═══════════════════════════════════════════════════════
  // 10. 播放/暂停控制
  // ═══════════════════════════════════════════════════════
  function playReplay() {
    if (isPlaying) return;
    isPlaying = true;
    document.getElementById("btnPlayPause").textContent = "⏸ Pause";
    tickTimer = setInterval(onTick, TICK_MS);
  }

  function pauseReplay() {
    if (!isPlaying) return;
    isPlaying = false;
    document.getElementById("btnPlayPause").textContent = "▶ Play";
    clearInterval(tickTimer);
    tickTimer = null;
  }

  // ═══════════════════════════════════════════════════════
  // 11. 结算逻辑
  // ═══════════════════════════════════════════════════════
  function triggerGameOver(isBlown) {
    pauseReplay();
    handleCloseAll();

    const overlay = document.getElementById("gameOverOverlay");
    overlay.style.display = "flex";

    document.getElementById("gameOverScenarioName").textContent = `战役: ${currentScenario.name} (${currentScenario.date})`;

    const netProfit  = currentEquity - 10000.00;
    const returnRate = (netProfit / 10000.00) * 100;

    document.getElementById("goFinalEquity").textContent = `$${currentEquity.toFixed(2)}`;
    document.getElementById("goNetProfit").textContent   = (netProfit >= 0 ? "+" : "") + `$${netProfit.toFixed(2)}`;
    document.getElementById("goNetProfit").style.color   = netProfit >= 0 ? "#00ff88" : "#ff3b5c";
    document.getElementById("goTradeCount").textContent  = `${historyTickets.length} 笔`;
    document.getElementById("goReturnRate").textContent  = (returnRate >= 0 ? "+" : "") + `${returnRate.toFixed(2)}%`;
    document.getElementById("goReturnRate").style.color  = returnRate >= 0 ? "#00ff88" : "#ff3b5c";
    document.getElementById("goDrawdown").textContent    = `${maxDrawdown.toFixed(1)}%`;

    let rank = "B", label = "平平无奇幸存者 (保本就是胜利)";
    if (isBlown)          { rank = "D"; label = "爆仓大队长 😭 (学费已交齐)"; }
    else if (returnRate >= 8.0) { rank = "S"; label = "👑 交易之神 (秒级超短天才)"; }
    else if (returnRate >= 1.0) { rank = "A"; label = "金牌收割者 (多空收割机器)"; }
    else if (returnRate >= 0)   { rank = "B"; label = "平平无奇幸存者 (保本就是胜利)"; }
    else                        { rank = "C"; label = "韭菜接盘侠 (交纳行情体验费)"; }

    const rankEl = document.getElementById("gameOverRank");
    rankEl.textContent = rank;
    rankEl.style.color = rank === "S" ? "#ffd600" : (rank === "A" || rank === "B") ? "#00ff88" : "#ff3b5c";
    document.getElementById("gameOverRankLabel").textContent = label;
  }

  window.closeGameOverModal = () => {
    document.getElementById("gameOverOverlay").style.display = "none";
  };

  window.shareResultToForum = () => {
    const netProfit  = currentEquity - 10000.00;
    const returnRate = (netProfit / 10000.00) * 100;
    const rankText   = document.getElementById("gameOverRankLabel").textContent;
    const copyText   = `⚔️ VIBCODING 手动挑战大字报 ⚔️\n--------------------------\n战役名称: ${currentScenario.name}\n最终评级: ${rankText}\n交易笔数: ${historyTickets.length} 笔\n最终业绩: ${returnRate >= 0 ? '+' : ''}${returnRate.toFixed(2)}% ($${netProfit.toFixed(2)})\n最大回撤: ${maxDrawdown.toFixed(1)}%\n--------------------------\n快来加入对战，看谁才是真正的交易之神！ 👉 http://localhost:3000/trade.html`;

    navigator.clipboard.writeText(copyText)
      .then(()  => alert("大字报已成功复制到剪贴板！可立即发帖或发群晒单 🚀"))
      .catch(()  => alert("复制失败，请手动选择复制。"));
  };

  // ═══════════════════════════════════════════════════════
  // 12. 终端明细渲染
  // ═══════════════════════════════════════════════════════
  function updateTerminalDisplay() {
    document.getElementById("lblAccountEquity").textContent = currentEquity.toFixed(2);
    document.getElementById("lblFloatingPnL").textContent   = "0.00";
    document.getElementById("lblFloatingPnL").style.color   = "var(--text)";
    updateTerminalTable(0);
  }

  function updateTerminalTable(totalFloatingPnL) {
    const tbody = document.getElementById("tradeHistoryBody");
    if (!tbody) return;

    if (activeTickets.length === 0 && historyTickets.length === 0) {
      tbody.innerHTML = `<tr style="color: var(--text-dim);"><td colspan="7" style="padding: 12px; text-align: center;">暂无成交明细，点击 BUY / SELL 进场。</td></tr>`;
      return;
    }

    let html = "";
    activeTickets.forEach(t => {
      html += `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.03); background: rgba(0,255,136,0.02);">
          <td style="padding: 6px 4px; color:var(--text-dim);">${t.ticket}</td>
          <td style="color:${t.type === 'BUY' ? '#00ff88' : '#ff3b5c'}; font-weight:bold;">${t.type}</td>
          <td>${t.entryPrice.toFixed(2)}</td>
          <td>${t.lots.toFixed(1)}</td>
          <td style="text-align:right;">${t.entryIndex}</td>
          <td style="text-align:right; font-weight:bold; color:${t.floatingPnL >= 0 ? '#00ff88' : '#ff3b5c'};">${t.floatingPnL >= 0 ? '+' : ''}${t.floatingPnL.toFixed(2)}</td>
          <td style="text-align:right; color:var(--text-dim);">--</td>
        </tr>
      `;
    });

    historyTickets.forEach(t => {
      html += `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.02); color: rgba(255,255,255,0.6);">
          <td style="padding: 6px 4px; color:var(--text-dim);">${t.ticket}</td>
          <td style="color:${t.type === 'BUY' ? 'rgba(0,255,136,0.5)' : 'rgba(255,59,92,0.5)'};">${t.type}</td>
          <td>${t.entryPrice.toFixed(2)}</td>
          <td>${t.lots.toFixed(1)}</td>
          <td style="text-align:right; color:var(--text-dim);">${t.entryIndex} -> ${t.closeIndex}</td>
          <td style="text-align:right; color:var(--text-dim);">已平仓</td>
          <td style="text-align:right; font-weight:bold; color:${t.realizedPnL >= 0 ? '#00ff88' : '#ff3b5c'};">${t.realizedPnL >= 0 ? '+' : ''}${t.realizedPnL.toFixed(2)}</td>
        </tr>
      `;
    });

    tbody.innerHTML = html;
  }

  // ═══════════════════════════════════════════════════════
  // 13. 事件绑定
  // ═══════════════════════════════════════════════════════
  function bindEvents() {
    document.getElementById("btnPlayPause").addEventListener("click", () => {
      if (isPlaying) pauseReplay(); else playReplay();
    });

    // 隐藏调速滑块（固定真实时间）
    ["playbackSpeed", "speedVal"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = "none";
    });
    const speedLbl = document.getElementById("playbackSpeed")?.previousElementSibling;
    if (speedLbl) speedLbl.style.display = "none";

    // 交易按钮
    document.getElementById("mt5BuyBtn").addEventListener("click",  () => handleManualOrder("BUY"));
    document.getElementById("mt5SellBtn").addEventListener("click", () => handleManualOrder("SELL"));
    document.getElementById("btnManualCloseAll").addEventListener("click", handleCloseAll);

    // 键盘快捷键
    document.addEventListener("keydown", e => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.code === "KeyB")  handleManualOrder("BUY");
      else if (e.code === "KeyS")  handleManualOrder("SELL");
      else if (e.code === "KeyC")  handleCloseAll();
      else if (e.code === "Space") { e.preventDefault(); isPlaying ? pauseReplay() : playReplay(); }
      // 方向键左右手动平移
      else if (e.code === "ArrowLeft")  { e.preventDefault(); manualPan(-3); }
      else if (e.code === "ArrowRight") { e.preventDefault(); manualPan(+3); }
    });

    // 图表拖拽 / 滚轮翻页
    bindChartPan();
  }

  // ════════════════════════════════════════════════════════
  // 图表手动拖拽 / 滚轮中心
  // ════════════════════════════════════════════════════════
  function manualPan(delta) {
    const maxOff = Math.max(0, (window.ohlc || []).length - 1);
    window.scrollOffset = Math.max(0, Math.min(maxOff, (window.scrollOffset || 0) + delta));
    userPanning = true;
    clearTimeout(panResumeTimer);
    // 停止3秒后自动恢复跟踪
    panResumeTimer = setTimeout(() => { userPanning = false; }, 3000);
    // 立即重绘
    if (currentPrice > 0) renderScene(currentPrice);
  }

  function bindChartPan() {
    const canvas = document.getElementById('candleChart');
    if (!canvas) return;

    // ─ 滚轮翻页 ─
    canvas.addEventListener('wheel', e => {
      e.preventDefault();
      // deltaX for trackpad horizontal, deltaY for mouse wheel
      const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const step = Math.sign(raw) * Math.max(1, Math.round(Math.abs(raw) / 30));
      manualPan(step);
    }, { passive: false });

    // ─ 鼠标拖拽 ─
    let dragStartX   = 0;
    let dragStartOff = 0;
    let isDragging   = false;

    canvas.addEventListener('mousedown', e => {
      // \u4e2d\u952e\u62d6\u62fd (button=1)\uff0c\u907f\u514d\u4e0e\u5de6\u952e BUY/SELL \u51b2\u7a81
      if (e.button !== 1) return;
      isDragging   = true;
      dragStartX   = e.clientX;
      dragStartOff = window.scrollOffset || 0;
      canvas.style.cursor = 'grabbing';
      e.preventDefault();
    });

    window.addEventListener('mousemove', e => {
      if (!isDragging) return;
      // \u52a8\u6001\u8ba1\u7b97 candleW \u4fdd\u8bc1\u4efb\u610f\u5c4f\u5e55\u5bbd\u5ea6\u4e0b\u62d6\u62fd\u7075\u654f\u5ea6\u6b63\u786e
      const cw       = canvas.clientWidth - 8 - 64; // pad.left + pad.right
      const visBars  = window.visibleBars || 100;
      const gap      = 3;
      const candleW  = Math.max(4, cw / visBars - gap);
      const dx      = e.clientX - dragStartX;
      const barsMoved = Math.round(-dx / (candleW + 3));
      const newOff    = Math.max(0, Math.min((window.ohlc || []).length - 1, dragStartOff + barsMoved));
      if (newOff !== window.scrollOffset) {
        window.scrollOffset = newOff;
        userPanning = true;
        clearTimeout(panResumeTimer);
        if (currentPrice > 0) renderScene(currentPrice);
      }
    });

    window.addEventListener('mouseup', () => {
      if (!isDragging) return;
      isDragging = false;
      canvas.style.cursor = 'crosshair';
      // 3秒后转回自动跟踪
      clearTimeout(panResumeTimer);
      panResumeTimer = setTimeout(() => { userPanning = false; }, 3000);
    });

    // ─ 触摸屏滑动 (mobile) ─
    let touchStartX   = 0;
    let touchStartOff = 0;

    canvas.addEventListener('touchstart', e => {
      touchStartX   = e.touches[0].clientX;
      touchStartOff = window.scrollOffset || 0;
      userPanning = true;
      clearTimeout(panResumeTimer);
    }, { passive: true });

    canvas.addEventListener('touchmove', e => {
      const dx = e.touches[0].clientX - touchStartX;
      const barsMoved = Math.round(-dx / 11);
      window.scrollOffset = Math.max(0, Math.min((window.ohlc || []).length - 1, touchStartOff + barsMoved));
      if (currentPrice > 0) renderScene(currentPrice);
    }, { passive: true });

    canvas.addEventListener('touchend', () => {
      panResumeTimer = setTimeout(() => { userPanning = false; }, 3000);
    }, { passive: true });

    // 默认cursor设为十字准星形
    canvas.style.cursor = 'crosshair';
  }

  // ═══════════════════════════════════════════════════════
  // 14. 技术指标计算
  // ═══════════════════════════════════════════════════════
  function calcRSI(closes, period = 14) {
    const rsi = [];
    let avgGain = 0, avgLoss = 0;
    for (let i = 0; i < closes.length; i++) {
      if (i === 0) { rsi.push(null); continue; }
      const change = closes[i] - closes[i - 1];
      const gain   = change > 0 ? change : 0;
      const loss   = change < 0 ? -change : 0;
      if (i <= period) {
        avgGain += gain;
        avgLoss += loss;
        if (i === period) {
          avgGain /= period;
          avgLoss /= period;
          const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
          rsi.push(100 - 100 / (1 + rs));
        } else {
          rsi.push(null);
        }
      } else {
        avgGain = (avgGain * (period - 1) + gain) / period;
        avgLoss = (avgLoss * (period - 1) + loss) / period;
        const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
        rsi.push(100 - 100 / (1 + rs));
      }
    }
    return rsi;
  }

  function calcMACD(closes, fast = 12, slow = 26, signal = 9) {
    const ema = (arr, p) => {
      const k = 2 / (p + 1), out = [];
      arr.forEach((v, i) => out.push(i === 0 ? v : v * k + out[i - 1] * (1 - k)));
      return out;
    };
    const e12   = ema(closes, fast);
    const e26   = ema(closes, slow);
    const macd  = e12.map((v, i) => v - e26[i]);
    const sig   = ema(macd, signal);
    const hist  = macd.map((v, i) => v - sig[i]);
    return { macd, signal: sig, hist };
  }

})();
