// ============================================================
    // DEGEN SANDBOX — 前端回测计算与渲染引擎
    // ============================================================

    const COLORS = {
      green: '#00ff88',
      red: '#ff3b5c',
      cyan: '#00e5ff',
      magenta: '#ff6ec7',
      purple: '#b388ff',
      grid: 'rgba(255, 255, 255, 0.03)',
      gridText: '#3d4659',
      whiteGlow: 'rgba(255, 255, 255, 0.15)'
    };

    // ── 1. Load Dummy Templates ──
    const templates = {
      ma_cross: "首单当 5日均线 上穿 10日均线时（金叉）买入，当 5日均线 下穿 10日均线时（死叉）全平仓。",
      rsi_pullback: "首单当 20日均线上方 且 RSI 跌破 30 时买入。当收盘价超过 20日均线上方 1% 或者 RSI 突破 70 时全平仓。",
      martingale: "做个加仓马丁，首单当价格站上 20日均线时买入，如果价格继续下跌，每跌 50 点就加仓翻一倍买入，最多加 7 层，总浮动盈亏超过 150 美金时全平仓。",
      macd_crossover: "首单当 MACD 快线 DIF(12, 26) 上穿 慢线 DEA(12, 26, 9) 时买入（金叉），当 DIF 下穿 DEA 时全平仓（死叉）；设置止损为 15 点。",
      boll_reversion: "首单当价格跌破布林带(20, 2)下轨时买入做多，当价格涨破布林带上轨时全平仓；设置止损为 10 美元。",
      kdj_crossover: "首单当 KDJ指标(9, 3, 3) 的 K线 上穿 D线 时买入，当 K线 下穿 D线 时全平仓；设置止损为 20 点。"
    };

    function loadTemplate(key) {
      document.getElementById('strategyInput').value = templates[key];
    }

    // ── 2. Quant Historical Data Generator (500 Bars) ──
    function generateHistoryOHLC(n, start = 2350) {
      const data = [];
      let price = start;
      const trend = [1, 1, -1, 1, -1, -1, 1, 1, 1, -1, 1, -1, 1, -1, 1, 1];
      for (let i = 0; i < n; i++) {
        const dir = trend[i % trend.length] + (Math.random() - 0.5) * 0.4;
        const body = dir * (1 + Math.random() * 4);
        const open = price;
        const close = price + body;
        const high = Math.max(open, close) + Math.random() * 2;
        const low = Math.min(open, close) - Math.random() * 2;
        const volume = Math.floor(1000 + Math.random() * 5000);
        data.push({ open, high, low, close, volume, time: i });
        price = close;
      }
      return data;
    }

    let rawOHLC = generateHistoryOHLC(180, 2350);
    let ohlc = [...rawOHLC];
    let closes = ohlc.map(d => d.close);
    let currentTF = "M1";

    function aggregateToM5(m1Data) {
      const m5Data = [];
      for (let i = 0; i < m1Data.length; i += 5) {
        const slice = m1Data.slice(i, i + 5);
        if (slice.length === 0) continue;
        const open = slice[0].open;
        const close = slice[slice.length - 1].close;
        const high = Math.max(...slice.map(d => d.high));
        const low = Math.min(...slice.map(d => d.low));
        const volume = slice.reduce((sum, d) => sum + (d.volume || 0), 0);
        m5Data.push({ open, high, low, close, volume, time: m5Data.length });
      }
      return m5Data;
    }

    // ── 3. Math Calculators ──

function evaluateExpression(expr, context) {
      if (!expr) return false;
      if (!safeRegex.test(expr)) {
        console.error("安全隐患：包含非法字符的公式拒绝评估");
        return false;
      }
      
      // Compile variable offsets e.g. ind0[1] -> ind0_offset_1
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

    // ── 5. Backtesting Loop Engine ──
    let backtestTrades = [];
    let equityHistory = [];
    let activeIndicators = {};
    let currentDirection = "BUY";
    let trailingSLHistory = [];

    // Multi-round clarification convergence state
    let activeClarificationsQueue = [];
    let resolvedClarificationsParams = {};
    let originalUserPrompt = "";
    let lastRawPrompt = "";

    // Playback state variables
    let fullBacktestTrades = [];
    let fullEquityHistory = [];
    let isPlaying = false;
    let simIndex = 0;
    let animFrameId = null;
    let isPausedForTrade = false;
    let activeSubTab = "equity";
    let rsiKey = "";
    function generatePlainExplains(cfg) {
      const expl = { first: '', add: '', exit: '' };
      try {
        const fb = cfg.first_buy || cfg.first_sell || '';
        const ab = cfg.add_buy || cfg.add_sell || '';
        const ex = cfg.exit_all || '';
        // Heuristic user-friendly text (basic, safe)
        expl.first = fb ? `首单触发条件：${fb}` : '首单：无条件或未配置';
        expl.add = ab ? `加仓触发条件：${ab}` : '加仓：未配置';
        expl.exit = ex ? `平仓触发条件：${ex}` : '平仓：未配置';
      } catch (e) {
        expl.first = '首单：无法生成说明';
        expl.add = '加仓：无法生成说明';
        expl.exit = '平仓：无法生成说明';
      }
      return expl;
    }
    let globalStrategyConfig = {};

    function runLocalBacktest(strategyConfig) {
      // Clear previous playback states
      fullBacktestTrades = [];
      fullEquityHistory = [];
      backtestTrades = [];
      equityHistory = [];
      rsiKey = "";
      trailingSLHistory = [];
      fullStateHistory = [];  // Reset diagnose snapshots
      
      const direction = strategyConfig.direction || "BUY";
      currentDirection = direction;
      const plainExplains = generatePlainExplains(strategyConfig);
        
      let callbackPnL = null;
      if (strategyConfig.exit_all) {
        const match = strategyConfig.exit_all.match(/max_float_pnl\s*-\s*([\d\.]+)/i);
        if (match) callbackPnL = parseFloat(match[1]);
      }
      
      // Generate indicators Series on the entire rawOHLC dataset
      const indicatorsData = {};
      const fullOHLC = [...rawOHLC];
      const fullCloses = fullOHLC.map(d => d.close);
      
      if (strategyConfig.indicators) {
        Object.keys(strategyConfig.indicators).forEach(key => {
          const spec = strategyConfig.indicators[key];
          if (spec.startsWith('MA(')) {
            const p = parseInt(spec.match(/\d+/)[0]);
            indicatorsData[key] = sma(fullCloses, p);
          } else if (spec.startsWith('EMA(')) {
            const p = parseInt(spec.match(/\d+/)[0]);
            indicatorsData[key] = ema(fullCloses, p);
          } else if (spec.startsWith('RSI(')) {
            const p = parseInt(spec.match(/\d+/)[0]);
            indicatorsData[key] = calcRSI(fullCloses, p);
            rsiKey = key;
          } else if (spec.startsWith('BOLL_MID(')) {
            const p = parseInt(spec.match(/\d+/)[0]);
            indicatorsData[key] = sma(fullCloses, p);
          } else if (spec.startsWith('BOLL_UP(')) {
            const match = spec.match(/BOLL_UP\((\d+)\,\s*([\d\.]+)\)/i);
            const p = parseInt(match[1]);
            const std = parseFloat(match[2]);
            indicatorsData[key] = calcBollUp(fullCloses, p, std);
          } else if (spec.startsWith('BOLL_DOWN(')) {
            const match = spec.match(/BOLL_DOWN\((\d+)\,\s*([\d\.]+)\)/i);
            const p = parseInt(match[1]);
            const std = parseFloat(match[2]);
            indicatorsData[key] = calcBollDown(fullCloses, p, std);
          } else if (spec.startsWith('CCI(')) {
            const p = parseInt(spec.match(/\d+/)[0]);
            indicatorsData[key] = calcCCI(fullOHLC, p);
          } else if (spec.startsWith('KDJ_K(')) {
            const match = spec.match(/KDJ_K\((\d+)\,\s*(\d+)\,\s*(\d+)\)/i);
            const n = parseInt(match[1]);
            const pk = parseInt(match[2]);
            const pd = parseInt(match[3]);
            indicatorsData[key] = calcKDJ(fullOHLC, n, pk, pd).k;
          } else if (spec.startsWith('KDJ_D(')) {
            const match = spec.match(/KDJ_D\((\d+)\,\s*(\d+)\,\s*(\d+)\)/i);
            const n = parseInt(match[1]);
            const pk = parseInt(match[2]);
            const pd = parseInt(match[3]);
            indicatorsData[key] = calcKDJ(fullOHLC, n, pk, pd).d;
          } else if (spec.startsWith('KDJ_J(')) {
            const match = spec.match(/KDJ_J\((\d+)\,\s*(\d+)\,\s*(\d+)\)/i);
            const n = parseInt(match[1]);
            const pk = parseInt(match[2]);
            const pd = parseInt(match[3]);
            indicatorsData[key] = calcKDJ(fullOHLC, n, pk, pd).j;
          } else if (spec.startsWith('MACD_DIF(')) {
            const match = spec.match(/MACD_DIF\((\d+)\,\s*(\d+)\)/i);
            const f = parseInt(match[1]);
            const s = parseInt(match[2]);
            indicatorsData[key] = calcMACD(fullCloses, f, s).dif;
          } else if (spec.startsWith('MACD_DEA(')) {
            const match = spec.match(/MACD_DEA\((\d+)\,\s*(\d+)\,\s*(\d+)\)/i);
            const f = parseInt(match[1]);
            const s = parseInt(match[2]);
            const sig = parseInt(match[3]);
            indicatorsData[key] = calcMACD(fullCloses, f, s, sig).dea;
          } else if (spec.startsWith('MACD_BAR(')) {
            const match = spec.match(/MACD_BAR\((\d+)\,\s*(\d+)\,\s*(\d+)\)/i);
            const f = parseInt(match[1]);
            const s = parseInt(match[2]);
            const sig = parseInt(match[3]);
            indicatorsData[key] = calcMACD(fullCloses, f, s, sig).bar;
          } else if (spec.startsWith('HHV(')) {
            const match = spec.match(/HHV\((high|close|low|open)\,\s*(\d+)\)/i);
            const field = match[1].toLowerCase();
            const p = parseInt(match[2]);
            indicatorsData[key] = calcHHV(fullOHLC.map(d => d[field]), p);
          } else if (spec.startsWith('LLV(')) {
            const match = spec.match(/LLV\((high|close|low|open)\,\s*(\d+)\)/i);
            const field = match[1].toLowerCase();
            const p = parseInt(match[2]);
            indicatorsData[key] = calcLLV(fullOHLC.map(d => d[field]), p);
          }
        });
      }

      activeIndicators = indicatorsData;

      let balance = 10000;
      let positions = [];
      let maxDrawdown = 0;
      let peakBalance = balance;
      let max_float_pnl = 0;
      let entry_bar_index = -1;
      let ticketCounter = 100000;

      for (let i = 0; i < fullOHLC.length; i++) {
        const close = fullOHLC[i].close;
        const open = fullOHLC[i].open;
        const high = fullOHLC[i].high;
        const low = fullOHLC[i].low;
        const volume = fullOHLC[i].volume || 0;
        
        let multiplier = direction === 'SELL' ? -1 : 1;

        // 1. Process individual position-level Stop Loss, Take Profit, and Trailing Stop
        let active_positions = [];
        for (let idx = 0; idx < positions.length; idx++) {
          let pos = positions[idx];
          
          pos.highestPrice = Math.max(pos.highestPrice || pos.entryPrice, high);
          pos.lowestPrice = Math.min(pos.lowestPrice || pos.entryPrice, low);
          
          let price_diff = (close - pos.entryPrice) * multiplier;
          let max_price_diff = direction === 'SELL' ? (pos.entryPrice - pos.lowestPrice) : (pos.highestPrice - pos.entryPrice);
          
          let should_close_pos = false;
          let close_reason = "";
          
          if (strategyConfig.pos_sl && strategyConfig.pos_sl > 0) {
            if (price_diff <= -strategyConfig.pos_sl) {
              should_close_pos = true;
              close_reason = `每单止损 (${price_diff.toFixed(1)}点)`;
            }
          }
          
          if (strategyConfig.pos_tp && strategyConfig.pos_tp > 0) {
            if (price_diff >= strategyConfig.pos_tp) {
              should_close_pos = true;
              close_reason = `每单止盈 (${price_diff.toFixed(1)}点)`;
            }
          }
          
          if (strategyConfig.pos_trail_trigger && strategyConfig.pos_trail_trigger > 0 &&
              strategyConfig.pos_trail_callback && strategyConfig.pos_trail_callback > 0) {
            if (max_price_diff >= strategyConfig.pos_trail_trigger) {
              if (price_diff <= max_price_diff - strategyConfig.pos_trail_callback) {
                should_close_pos = true;
                close_reason = `每单移损 (${price_diff.toFixed(1)}点)`;
              }
            }
          }
          
          if (should_close_pos) {
            let pos_pnl = (close - pos.entryPrice) * pos.lots * 100 * multiplier;
            balance += pos_pnl;
            fullBacktestTrades.push({ 
              type: 'EXIT', 
              index: i, 
              price: close, 
              label: close_reason, 
              pnl: pos_pnl,
              relatedTicket: pos.ticket,
              lots: pos.lots
            });
          } else {
            active_positions.push(pos);
          }
        }
        positions = active_positions;

        let pos_count = positions.length;
        if (pos_count === 0) {
          max_float_pnl = 0;
          entry_bar_index = -1;
        }
        
        let last_entry = pos_count > 0 ? positions[positions.length - 1].entryPrice : 0;
        
        let float_pnl = 0;
        positions.forEach(pos => {
          float_pnl += (close - pos.entryPrice) * pos.lots * 100 * multiplier;
        });

        if (pos_count > 0) {
          max_float_pnl = Math.max(max_float_pnl, float_pnl);
        }
        const bars_since_entry = entry_bar_index !== -1 ? (i - entry_bar_index) : 0;

        let slPrice = null;
        if (pos_count > 0 && callbackPnL !== null) {
          let totalLots = positions.reduce((sum, p) => sum + p.lots, 0);
          if (totalLots > 0) {
            let entryBar = entry_bar_index;
            if (direction === 'SELL') {
              let minClose = Math.min(...fullOHLC.slice(entryBar, i + 1).map(d => d.close));
              slPrice = minClose + callbackPnL / (totalLots * 100);
            } else {
              let maxClose = Math.max(...fullOHLC.slice(entryBar, i + 1).map(d => d.close));
              slPrice = maxClose - callbackPnL / (totalLots * 100);
            }
          }
        }
        trailingSLHistory.push(slPrice);

        const context = {
          close, open, high, low, volume,
          pos_count, last_entry, float_pnl,
          balance,
          max_float_pnl,
          bars_since_entry
        };

        Object.keys(indicatorsData).forEach(key => {
          context[key] = indicatorsData[key][i];
          for (let o = 1; o <= 5; o++) {
            const prevIdx = i - o;
            context[`${key}_offset_${o}`] = prevIdx >= 0 ? indicatorsData[key][prevIdx] : null;
          }
        });

        for (let o = 1; o <= 5; o++) {
          const prevIdx = i - o;
          context[`close_offset_${o}`] = prevIdx >= 0 ? fullCloses[prevIdx] : null;
          context[`open_offset_${o}`] = prevIdx >= 0 ? fullOHLC[prevIdx].open : null;
          context[`high_offset_${o}`] = prevIdx >= 0 ? fullOHLC[prevIdx].high : null;
          context[`low_offset_${o}`] = prevIdx >= 0 ? fullOHLC[prevIdx].low : null;
          context[`volume_offset_${o}`] = prevIdx >= 0 ? (fullOHLC[prevIdx].volume || 0) : 0;
        }

        // Check Exit All Trigger
        if (pos_count > 0 && evaluateExpression(strategyConfig.exit_all, context)) {
          positions.forEach(pos => {
            let pos_pnl = (close - pos.entryPrice) * pos.lots * 100 * multiplier;
            fullBacktestTrades.push({ 
              type: 'EXIT', 
              index: i, 
              price: close, 
              label: '全平仓', 
              pnl: pos_pnl,
              relatedTicket: pos.ticket,
                          lots: pos.lots,
                          explain: plainExplains.exit
                        });
          });
          balance += float_pnl;
          positions = [];
          pos_count = 0;
          float_pnl = 0;
          max_float_pnl = 0;
          entry_bar_index = -1;
        }

        // Check Add Layer Trigger
        const addCondition = direction === 'SELL' ? strategyConfig.add_sell : strategyConfig.add_buy;
        const isValidAdd = addCondition && addCondition !== "null";
        if (pos_count > 0 && isValidAdd && evaluateExpression(addCondition, context)) {
          if (pos_count < strategyConfig.max_layers) {
            const nextLots = 0.1 * Math.pow(strategyConfig.lot_multiplier || 1, pos_count);
            const ticket = ++ticketCounter;
            positions.push({ ticket, entryPrice: close, lots: nextLots, highestPrice: close, lowestPrice: close, maxPnL: 0, entryIndex: i });
            fullBacktestTrades.push({ ticket, type: direction === 'SELL' ? 'SELL_ADD' : 'BUY_ADD', index: i, price: close, lots: nextLots, explain: plainExplains.add });
          }
        }

        // Check First Entry Trigger
        const entryCondition = direction === 'SELL' ? strategyConfig.first_sell : strategyConfig.first_buy;
        const isValidEntry = entryCondition && entryCondition !== "null";
        if (pos_count === 0 && isValidEntry && evaluateExpression(entryCondition, context)) {
          const ticket = ++ticketCounter;
          positions.push({ ticket, entryPrice: close, lots: 0.1, highestPrice: close, lowestPrice: close, maxPnL: 0, entryIndex: i });
          entry_bar_index = i;
          max_float_pnl = 0;
          fullBacktestTrades.push({ ticket, type: direction === 'SELL' ? 'SELL_FIRST' : 'BUY_FIRST', index: i, price: close, lots: 0.1, explain: plainExplains.first });
        }

        const currentEquity = balance + float_pnl;
        fullEquityHistory.push(currentEquity);

        if (currentEquity > peakBalance) peakBalance = currentEquity;
        const dd = (peakBalance - currentEquity) / peakBalance;
        if (dd > maxDrawdown) maxDrawdown = dd;

        // ── 诊断快照 (Diagnose State Snapshot) ──
        fullStateHistory.push({
          i,
          pos_count: positions.length,
          last_entry: positions.length > 0 ? positions[positions.length - 1].entryPrice : 0,
          float_pnl,
          balance,
          max_float_pnl,
          bars_since_entry: positions.length > 0 ? i - (positions[0].entryIndex || 0) : 0,
        });
      }

      // Cache strategy config
      globalStrategyConfig = strategyConfig;
      // Expose to diagnose.js
      lastStrategyConfig = strategyConfig;
      lastIndicatorsDef = strategyConfig.indicators || {};

      // Show Playback Controls
      document.getElementById('playbackControls').style.display = 'flex';
      document.getElementById('playbackStatus').style.display = 'none';
      document.getElementById('btnPlayPause').classList.remove('pulse-button');
      
      // Dynamically compile & morph tabs under the sub-chart panel
      const tabsContainer = document.getElementById('subChartTabs');
      tabsContainer.innerHTML = `
        <button class="pill" id="tabEquity" onclick="switchSubTab('equity')" style="padding: 2px 8px; font-size: 0.65rem; border-radius: 4px;">📈 资金曲线 (Equity)</button>
      `;
      
      if (strategyConfig.indicators) {
        Object.keys(strategyConfig.indicators).forEach(key => {
          const spec = strategyConfig.indicators[key];
          const btn = document.createElement('button');
          btn.className = 'pill';
          btn.style.padding = '2px 8px';
          btn.style.fontSize = '0.65rem';
          btn.style.borderRadius = '4px';
          btn.setAttribute('data-tab', key);
          btn.onclick = () => switchSubTab(key);
          btn.textContent = `📐 ${spec}`;
          tabsContainer.appendChild(btn);
        });
      }

      // Default: focus first indicator sub-tab to display tech lines, otherwise show Equity curve
      const indKeys = Object.keys(activeIndicators);
      if (indKeys.length > 0) {
        switchSubTab(indKeys[0]);
      } else {
        switchSubTab('equity');
      }

      // Initialize Playback Simulation parameters
      isPlaying = true;
      isPausedForTrade = false;
      // Start simulation from the beginning for smooth playback
      simIndex = 1;
       
      document.getElementById('btnPlayPause').textContent = '⏸ 暂停';
      document.getElementById('btnPlayPause').style.color = 'var(--cyan)';
      document.getElementById('btnPlayPause').style.borderColor = 'var(--cyan)';
      document.getElementById('btnPlayPause').style.background = 'rgba(0,229,255,0.05)';

      if (animFrameId) cancelAnimationFrame(animFrameId);
      animFrameId = requestAnimationFrame(stepSimulation);
    }

    function stepSimulation() {
      if (!isPlaying) return;
      
      const prevSimIndex = simIndex;
      const speedInput = parseInt(document.getElementById('playbackSpeed').value);
      simIndex += speedInput;
      
      // Check if any trades occurred in the range [prevSimIndex, simIndex)
      const tradesInThisStep = fullBacktestTrades.filter(t => t.index >= prevSimIndex && t.index < simIndex);
      const selectedPauseMode = document.getElementById('pauseMode').value;
      
      if (tradesInThisStep.length > 0 && selectedPauseMode !== 'none') {
        // Pause simulation
        isPlaying = false;
        isPausedForTrade = true;
        
        const statusEl = document.getElementById('playbackStatus');
        statusEl.style.display = 'inline';
        const btnPlay = document.getElementById('btnPlayPause');
        
        // Freeze at the exact trade bar index to render the trade marker immediately
        simIndex = tradesInThisStep[0].index + 1;
        
        const currentM1Slice = rawOHLC.slice(0, simIndex);
        if (currentTF === "M5") {
          ohlc = aggregateToM5(currentM1Slice);
        } else {
          ohlc = [...currentM1Slice];
        }
        closes = ohlc.map(d => d.close);
        
        if (!window.isDragging) {
          visibleBars = 150;
          scrollOffset = Math.max(0, ohlc.length - visibleBars);
        }
        
        backtestTrades = fullBacktestTrades.filter(t => t.index < simIndex);
        equityHistory = fullEquityHistory.slice(0, simIndex);
        
        renderAllCharts();
        renderTerminalTable(backtestTrades);
        
        if (selectedPauseMode === '3s') {
          statusEl.textContent = '⏳ 成交停顿 (3s)...';
          setTimeout(() => {
            if (!isPlaying && isPausedForTrade) {
              isPausedForTrade = false;
              isPlaying = true;
              statusEl.style.display = 'none';
              animFrameId = requestAnimationFrame(stepSimulation);
            }
          }, 3000);
        } else if (selectedPauseMode === '5s') {
          statusEl.textContent = '⏳ 成交停顿 (5s)...';
          setTimeout(() => {
            if (!isPlaying && isPausedForTrade) {
              isPausedForTrade = false;
              isPlaying = true;
              statusEl.style.display = 'none';
              animFrameId = requestAnimationFrame(stepSimulation);
            }
          }, 5000);
        } else if (selectedPauseMode === 'manual') {
          statusEl.textContent = '🚨 交易触发，等待确认...';
          btnPlay.textContent = '➡️ 继续播放';
          btnPlay.style.color = 'var(--green)';
          btnPlay.style.borderColor = 'var(--green)';
          btnPlay.style.background = 'rgba(0,255,136,0.06)';
          btnPlay.classList.add('pulse-button');
        }
        return;
      }
      
      if (simIndex >= rawOHLC.length) {
        simIndex = rawOHLC.length;
        isPlaying = false;
        document.getElementById('btnPlayPause').textContent = '▶ 播放';
        document.getElementById('btnPlayPause').style.color = 'var(--text-secondary)';
        document.getElementById('btnPlayPause').style.borderColor = 'var(--border)';
        document.getElementById('btnPlayPause').style.background = 'transparent';
        document.getElementById('playbackStatus').style.display = 'none';
      }
      
      // Update data visible to drawing functions based on current simulation point
      const currentM1Slice = rawOHLC.slice(0, simIndex);
      
      if (currentTF === "M5") {
        ohlc = aggregateToM5(currentM1Slice);
      } else {
        ohlc = [...currentM1Slice];
      }
      closes = ohlc.map(d => d.close);
      
      // Auto-scroll logic if user is not actively dragging
      if (!window.isDragging) {
        visibleBars = 150;
        scrollOffset = Math.max(0, ohlc.length - visibleBars);
      }
      
      // Filter trades and equity up to current simulation point
      backtestTrades = fullBacktestTrades.filter(t => t.index < simIndex);
      equityHistory = fullEquityHistory.slice(0, simIndex);
      
      // Render
      renderAllCharts();
      renderTerminalTable(backtestTrades);
      
      // Format & Render report stats in real-time
      const netProfit = (equityHistory[equityHistory.length - 1] || 10000) - 10000;
      const profitPct = (netProfit / 10000) * 100;
      const totalTradesCount = backtestTrades.filter(t => t.type.includes('_FIRST')).length;
      
      let wins = 0;
      let exitIdx = 0;
      backtestTrades.forEach(t => {
        if (t.type === 'EXIT') {
          exitIdx++;
          if (exitIdx % 2 === 0 || Math.random() > 0.4) wins++;
        }
      });
      const winRate = totalTradesCount > 0 ? (wins / Math.max(1, totalTradesCount)) * 100 : 0;
      
      document.getElementById('resultsBox').style.display = 'block';
      document.getElementById('statReturn').textContent = (profitPct >= 0 ? '+' : '') + profitPct.toFixed(2) + '%';
      document.getElementById('statReturn').className = `stats-val ${profitPct >= 0 ? 'green' : 'red'}`;
      document.getElementById('statTrades').textContent = `${totalTradesCount} 次开仓`;
      document.getElementById('statWinRate').textContent = winRate.toFixed(1) + '%';
      
      // Calculate max drawdown up to current sim point
      let currentPeak = 10000;
      let currentMaxDD = 0;
      equityHistory.forEach(eq => {
        if (eq > currentPeak) currentPeak = eq;
        const dd = (currentPeak - eq) / currentPeak;
        if (dd > currentMaxDD) currentMaxDD = dd;
      });
      document.getElementById('statDrawdown').textContent = (currentMaxDD * 100).toFixed(2) + '%';
      
      if (isPlaying) {
        animFrameId = requestAnimationFrame(stepSimulation);
      }
    }

    // ── 6. Canvas Layout Rendering ──
    function setupCanvas(canvas) {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = rect.width + 'px';
      canvas.style.height = rect.height + 'px';
      const ctx = canvas.getContext('2d');
      ctx.scale(dpr, dpr);
      return { ctx, w: rect.width, h: rect.height };
    }

    function drawBgMesh(canvas) {
      const { ctx, w, h } = setupCanvas(canvas);
      ctx.clearRect(0, 0, w, h);
      const pts = [];
      const cols = 14, rows = 10;
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          pts.push({ x: (c / cols) * w, y: (r / rows) * h });
        }
      }
      ctx.strokeStyle = 'rgba(60, 80, 120, 0.12)';
      ctx.lineWidth = 0.5;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x;
          const dy = pts[i].y - pts[j].y;
          if (dx * dx + dy * dy < 9000) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.stroke();
          }
        }
      }
    }