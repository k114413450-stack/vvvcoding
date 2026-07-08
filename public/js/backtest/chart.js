function drawNeonCandle(ctx, x, w, open, close, high, low, yScale, bullish) {
      const color = bullish ? COLORS.green : COLORS.red;
      const yOpen = yScale(open);
      const yClose = yScale(close);
      const yHigh = yScale(high);
      const yLow = yScale(low);
      const top = Math.min(yOpen, yClose);
      const bot = Math.max(yOpen, yClose);
      const bodyH = Math.max(bot - top, 2);
      const cx = x + w / 2;

      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 10;
      ctx.shadowColor = color;
      if (bullish) {
        // Hollow Bullish
        ctx.strokeRect(x, top, w, bodyH);
      } else {
        // Filled Bearish
        ctx.fillStyle = color;
        ctx.fillRect(x, top, w, bodyH);
      }
      
      // Shadow lines
      ctx.beginPath();
      ctx.moveTo(cx, yHigh);
      ctx.lineTo(cx, top);
      ctx.moveTo(cx, bot);
      ctx.lineTo(cx, yLow);
      ctx.stroke();
      ctx.restore();
    }

    // Viewport control variables
    let visibleBars = 150;
    let scrollOffset = 0;
        let highlightIndex = null;

    function drawMainChart(canvas, ohlcData) {
      const { ctx, w, h } = setupCanvas(canvas);
      const pad = { top: 20, right: 64, bottom: 20, left: 8 };
      const cw = w - pad.left - pad.right;
      const ch = h - pad.top - pad.bottom;
      
      const n = ohlcData.length;
      if (n === 0) {
        ctx.clearRect(0, 0, w, h);
        return { pad, cw, candleW: 5, gap: 2 };
      }

      // Constrain scrollOffset and visibleBars
      visibleBars = Math.max(20, Math.min(n, visibleBars));
      scrollOffset = Math.max(0, Math.min(n - visibleBars, scrollOffset));

      const sliceStart = scrollOffset;
      const sliceEnd = Math.min(n, scrollOffset + visibleBars);
      const visibleOHLC = ohlcData.slice(sliceStart, sliceEnd);

      const minP = Math.min(...visibleOHLC.map(d => d.low)) - 2;
      const maxP = Math.max(...visibleOHLC.map(d => d.high)) + 2;
      const yScale = p => pad.top + ch - ((p - minP) / (maxP - minP)) * ch;
      
      const visibleN = visibleOHLC.length;
      const gap = cw / visibleN > 4 ? 2 : (cw / visibleN > 2 ? 1 : 0.2);
      const candleW = Math.max(0.5, (cw / visibleN) - gap);

      ctx.clearRect(0, 0, w, h);

      // Grids
      for (let i = 0; i <= 5; i++) {
        const y = pad.top + (ch / 5) * i;
        ctx.strokeStyle = COLORS.grid;
        ctx.beginPath();
        ctx.moveTo(pad.left, y);
        ctx.lineTo(pad.left + cw, y);
        ctx.stroke();
        ctx.fillStyle = COLORS.gridText;
        ctx.font = '10px monospace';
        ctx.fillText((maxP - ((maxP - minP) / 5) * i).toFixed(2), w - pad.right + 8, y + 3);
      }

      // Draw K-lines inside viewport
      visibleOHLC.forEach((d, indexInSlice) => {
        const x = pad.left + indexInSlice * (candleW + gap) + gap / 2;
        drawNeonCandle(ctx, x, candleW, d.open, d.close, d.high, d.low, yScale, d.close >= d.open);
      });

      // Draw Trailing Stop Loss (TSL) glowing dashed trail inside viewport
      if (trailingSLHistory && trailingSLHistory.length > 0) {
        const slPts = [];
        const drawLimit = Math.min(simIndex, sliceEnd);
        for (let i = sliceStart; i < drawLimit; i++) {
          const v = trailingSLHistory[i];
          const indexInSlice = i - sliceStart;
          const x = pad.left + indexInSlice * (candleW + gap) + gap / 2 + candleW / 2;
          if (v != null) {
            slPts.push([x, yScale(v)]);
          } else {
            if (slPts.length >= 2) {
              ctx.save();
              ctx.strokeStyle = 'rgba(255, 214, 0, 0.4)';
              ctx.lineWidth = 1.0;
              ctx.setLineDash([3, 3]);
              ctx.beginPath();
              slPts.forEach(([px, py], idx) => (idx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
              ctx.stroke();
              ctx.restore();
            }
            slPts.length = 0;
          }
        }
        if (slPts.length >= 2) {
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 214, 0, 0.7)';
          ctx.lineWidth = 1.4;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          slPts.forEach(([px, py], idx) => (idx === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
          ctx.stroke();
          ctx.restore();
        }

        // Draw current tick right-axis TSL badge pointer
        const currentSL = trailingSLHistory[simIndex];
        if (currentSL != null && simIndex >= sliceStart && simIndex < sliceEnd) {
          const slY = yScale(currentSL);
          ctx.save();
          ctx.fillStyle = 'rgba(255, 214, 0, 0.12)';
          ctx.strokeStyle = '#ffd600';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.rect(pad.left + cw + 2, slY - 7, 56, 14);
          ctx.fill();
          ctx.stroke();
          
          ctx.fillStyle = '#ffd600';
          ctx.font = '8px monospace';
          ctx.fillText('TSL ' + currentSL.toFixed(1), pad.left + cw + 6, slY + 3);
          ctx.restore();
        }
      }

      // Draw Backtest Trades Markers (▲ & ▼) inside viewport
      backtestTrades.forEach(t => {
        if (t.index >= sliceStart && t.index < sliceEnd) {
          const indexInSlice = t.index - sliceStart;
          const indexMapping = currentTF === 'M5' ? Math.floor(indexInSlice) : indexInSlice; // Adjusted for TF aggregation
          const x = pad.left + indexMapping * (candleW + gap) + gap / 2 + candleW / 2;
          const y = yScale(t.price);
           
          ctx.save();
          ctx.textAlign = 'center';
          ctx.font = '12px Space Grotesk';
           
          if (t.type.startsWith('BUY')) {
            ctx.fillStyle = COLORS.green;
            ctx.shadowBlur = 10;
            ctx.shadowColor = COLORS.green;
            ctx.fillText('▲', x, y + 16);
          } else if (t.type.startsWith('SELL')) {
            ctx.fillStyle = COLORS.red;
            ctx.shadowBlur = 10;
            ctx.shadowColor = COLORS.red;
            ctx.fillText('▼', x, y - 10);
          } else if (t.type === 'EXIT') {
            const isExitOfSell = currentDirection === 'SELL';
            ctx.fillStyle = isExitOfSell ? COLORS.green : COLORS.red;
            ctx.shadowBlur = 10;
            ctx.shadowColor = ctx.fillStyle;
            ctx.fillText(isExitOfSell ? '▲' : '▼', x, isExitOfSell ? y + 16 : y - 10);
          }
          ctx.restore();
        }
      });

      // Draw highlight line for located trades
      if (highlightIndex != null) {
        if (highlightIndex >= sliceStart && highlightIndex < sliceEnd) {
          const idxIn = highlightIndex - sliceStart;
          const xh = pad.left + idxIn * (candleW + gap) + gap / 2 + candleW / 2;
          ctx.save();
          ctx.strokeStyle = 'rgba(255, 214, 0, 0.95)';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.moveTo(xh, pad.top); ctx.lineTo(xh, pad.top + ch); ctx.stroke();
          ctx.restore();
        }
      }

      return { pad, cw, candleW, gap };
    }

    function drawGlowLine(ctx, points, color, blur = 10, width = 1.5) {
      const valid = points.filter(p => p[1] != null);
      if (valid.length < 2) return;
      ctx.save();
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.shadowBlur = blur;
      ctx.shadowColor = color;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      valid.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.stroke();
      ctx.restore();
    }

    function drawEquityChart(canvas, equityList, layout) {
      const { ctx, w, h } = setupCanvas(canvas);
      if (equityList.length === 0) {
        ctx.clearRect(0, 0, w, h);
        return;
      }
      const { pad, cw, candleW, gap } = layout;
      ctx.clearRect(0, 0, w, h);
      
      const minVal = Math.min(...equityList) - 50;
      const maxVal = Math.max(...equityList) + 50;
      const ch = h - 24;
      const yScale = v => 12 + ch - ((v - minVal) / (maxVal - minVal)) * ch;

      // Draw baseline of $10,000
      const baselineY = yScale(10000);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.beginPath();
      ctx.moveTo(pad.left, baselineY);
      ctx.lineTo(pad.left + cw, baselineY);
      ctx.stroke();

      const pts = equityList.map((v, i) => [
        pad.left + i * (candleW + gap) + gap / 2 + candleW / 2,
        yScale(v)
      ]);
      drawGlowLine(ctx, pts, COLORS.cyan, 14, 1.8);

      const lastEquity = equityList[equityList.length - 1];
      document.getElementById('equityText').textContent = `$${lastEquity.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    }

    function renderTerminalTable(trades) {
      const tbody = document.getElementById('tradeHistoryBody');
      tbody.innerHTML = '';
      
      if (trades.length === 0) {
        tbody.innerHTML = `<tr style="color: var(--text-dim);"><td colspan="7" style="padding: 12px; text-align: center;">暂无成交订单记录，请运行上方策略回测。</td></tr>`;
        document.getElementById('terminalSummary').textContent = "最终净值: $10,000.00";
        return;
      }
      
      let currentClose = 10000;
      if (ohlc && ohlc.length > 0) {
        const idx = Math.max(0, Math.min(ohlc.length - 1, simIndex));
        currentClose = ohlc[idx].close;
      }
      
      const multiplier = currentDirection === 'SELL' ? -1 : 1;
      
      // Scan trades to find currently open positions at this playback state
      const openPositions = {};
      trades.forEach(t => {
        if (t.type.includes('FIRST') || t.type.includes('ADD')) {
          openPositions[t.ticket] = {
            price: t.price,
            lots: t.lots || 0.1,
            type: t.type
          };
        } else if (t.type === 'EXIT' && t.relatedTicket) {
          delete openPositions[t.relatedTicket];
        }
      });
      
      let html = '';
      
      trades.forEach(t => {
        const isExit = t.type === 'EXIT';
        
        let ticketLabel = t.ticket || '-';
        let typeLabel = '';
        let lotsLabel = t.lots ? t.lots.toFixed(2) : '0.10';
        let floatPnlLabel = '-';
        let floatPnlClass = '';
        let realizedPnlLabel = '-';
        let realizedPnlClass = '';
        
        if (t.type.includes('FIRST')) {
          typeLabel = t.type.includes('SELL') ? '<span style="color: var(--red);">SELL (首单)</span>' : '<span style="color: var(--green);">BUY (首单)</span>';
          
          // Check if still open
          if (openPositions[t.ticket]) {
            const floatPnl = (currentClose - t.price) * (t.lots || 0.1) * 100 * multiplier;
            floatPnlLabel = (floatPnl >= 0 ? '+' : '') + floatPnl.toFixed(2) + ' USD';
            floatPnlClass = floatPnl >= 0 ? 'neon-green' : 'neon-pink';
          } else {
            // Find corresponding EXIT trade
            const exitTrade = trades.find(et => et.type === 'EXIT' && et.relatedTicket === t.ticket);
            if (exitTrade) {
              realizedPnlLabel = (exitTrade.pnl >= 0 ? '+' : '') + exitTrade.pnl.toFixed(2) + ' USD';
              realizedPnlClass = exitTrade.pnl >= 0 ? 'neon-green' : 'neon-pink';
            }
          }
        } else if (t.type.includes('ADD')) {
          typeLabel = t.type.includes('SELL') ? '<span style="color: var(--red-dim);">SELL (加仓)</span>' : '<span style="color: var(--green-dim);">BUY (加仓)</span>';
          
          // Check if still open
          if (openPositions[t.ticket]) {
            const floatPnl = (currentClose - t.price) * (t.lots || 0.1) * 100 * multiplier;
            floatPnlLabel = (floatPnl >= 0 ? '+' : '') + floatPnl.toFixed(2) + ' USD';
            floatPnlClass = floatPnl >= 0 ? 'neon-green' : 'neon-pink';
          } else {
            // Find corresponding EXIT trade
            const exitTrade = trades.find(et => et.type === 'EXIT' && et.relatedTicket === t.ticket);
            if (exitTrade) {
              realizedPnlLabel = (exitTrade.pnl >= 0 ? '+' : '') + exitTrade.pnl.toFixed(2) + ' USD';
              realizedPnlClass = exitTrade.pnl >= 0 ? 'neon-green' : 'neon-pink';
            }
          }
        } else if (isExit) {
          ticketLabel = t.relatedTicket ? `${t.relatedTicket} (平)` : '-';
          typeLabel = t.label ? `<span style="color: var(--cyan);">${t.label}</span>` : '<span style="color: var(--cyan);">CLOSE (全平)</span>';
          lotsLabel = t.lots ? t.lots.toFixed(2) : '-';
          
          const profit = t.pnl !== undefined ? t.pnl : ((equityHistory[t.index] || 10000) - (equityHistory[t.index - 1] || 10000));
          realizedPnlLabel = (profit >= 0 ? '+' : '') + profit.toFixed(2) + ' USD';
          realizedPnlClass = profit >= 0 ? 'neon-green' : 'neon-pink';
        }
        
        html += `
          <tr style="border-bottom: 1px dashed rgba(255,255,255,0.03);">
                    <td style="padding: 6px 4px; color: var(--text-dim);">
                      <button class="pill" onclick="locateTrade(${t.index})" title="定位到图表" style="margin-right:6px;padding:2px 6px;">🔎</button>${ticketLabel}
                    </td>
                    <td>${t.index} min</td>
                    <td>${typeLabel} <span style="margin-left:8px; cursor:help; color:var(--text-dim);" title="${(t.explain||'').replace(/"/g,'&quot;')}">？</span></td>
                    <td>$${t.price.toFixed(2)}</td>
                    <td>${lotsLabel}</td>
                    <td style="text-align: right;" class="${floatPnlClass}">${floatPnlLabel}</td>
                    <td style="text-align: right;" class="${realizedPnlClass}">${realizedPnlLabel}</td>
                  </tr>
                `;
      });
      
      tbody.innerHTML = html;
      
      const finalEquity = equityHistory[equityHistory.length - 1] || 10000;
      const netProfit = finalEquity - 10000;
      const sign = netProfit >= 0 ? '+' : '';
      document.getElementById('terminalSummary').textContent = `最终净值: $${finalEquity.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})} | 净利润: ${sign}$${netProfit.toLocaleString('en-US', {minimumFractionDigits:2, maximumFractionDigits:2})}`;
    }

    // Locate a trade on the chart and briefly highlight it
    function locateTrade(index) {
      if (typeof index !== 'number') return;
      highlightIndex = index;
      // center the located bar
      visibleBars = Math.max(20, visibleBars);
      scrollOffset = Math.max(0, index - Math.floor(visibleBars/2));
      // ensure ohlc contains up to that index so markers render
      if (typeof rawOHLC !== 'undefined' && rawOHLC.length > 0) {
        const currentM1Slice = rawOHLC.slice(0, index + 1);
        if (currentTF === 'M5') {
          ohlc = aggregateToM5(currentM1Slice);
        } else {
          ohlc = [...currentM1Slice];
        }
      }
      renderAllCharts();
      // clear highlight after 3s
      setTimeout(() => { highlightIndex = null; renderAllCharts(); }, 3000);
    }
    window.locateTrade = locateTrade;

    function switchSubTab(tabId) {
      activeSubTab = tabId;
      const container = document.getElementById('subChartTabs');
      if (container) {
        const buttons = container.querySelectorAll('button');
        buttons.forEach(btn => {
          const btnTab = btn.getAttribute('data-tab');
          if (btnTab === tabId || (tabId === 'equity' && btn.id === 'tabEquity')) {
            btn.style.borderColor = 'var(--cyan)';
            btn.style.color = 'var(--cyan)';
            btn.style.background = 'rgba(0,229,255,0.05)';
          } else {
            btn.style.borderColor = 'var(--border)';
            btn.style.color = 'var(--text-secondary)';
            btn.style.background = 'transparent';
          }
        });
      }
      renderAllCharts();
    }

    function drawIndicatorChart(canvas, layout) {
      const { ctx, w, h } = setupCanvas(canvas);
      ctx.clearRect(0, 0, w, h);
      
      if (!activeIndicators || !activeIndicators[activeSubTab]) return;
      
      const { pad, cw, candleW, gap } = layout;
      const ch = h - 24;

      const indData = activeIndicators[activeSubTab].slice(0, ohlc.length);
      const spec = globalStrategyConfig.indicators ? globalStrategyConfig.indicators[activeSubTab] : '';
      
      const isRSI = spec && spec.includes('RSI');
      const isKDJ = spec && spec.includes('KDJ');
      const isCCI = spec && spec.includes('CCI');
      const isMACD = spec && spec.includes('MACD');
      const isOscillating = isRSI || isKDJ || isCCI || isMACD;

      let minY = 0, maxY = 100;
      if (isRSI || isKDJ) {
        minY = 0;
        maxY = 100;
      } else if (isCCI) {
        minY = -250;
        maxY = 250;
      } else if (isMACD) {
        const visibleInd = indData.slice(scrollOffset, scrollOffset + visibleBars).filter(v => v != null);
        if (visibleInd.length > 0) {
          const maxVal = Math.max(...visibleInd.map(Math.abs));
          minY = -maxVal - 0.2;
          maxY = maxVal + 0.2;
        } else {
          minY = -1;
          maxY = 1;
        }
      } else {
        // Price-based
        const visibleInd = indData.slice(scrollOffset, scrollOffset + visibleBars).filter(v => v != null);
        if (visibleInd.length > 0) {
          minY = Math.min(...visibleInd) - 2;
          maxY = Math.max(...visibleInd) + 2;
        } else {
          minY = 2000;
          maxY = 2500;
        }
      }
      
      const yScale = v => 12 + ch - ((v - minY) / Math.max(0.001, maxY - minY)) * ch;

      // Draw grids & thresholds
      ctx.save();
      ctx.lineWidth = 1;
      
      if (isRSI) {
        ctx.setLineDash([4, 4]);
        // 70 line
        ctx.strokeStyle = 'rgba(255, 59, 92, 0.3)';
        ctx.beginPath(); ctx.moveTo(pad.left, yScale(70)); ctx.lineTo(pad.left + cw, yScale(70)); ctx.stroke();
        ctx.fillStyle = 'rgba(255, 59, 92, 0.55)';
        ctx.font = '9px monospace';
        ctx.fillText('70', pad.left + cw + 4, yScale(70) + 3);

        // 50 middle line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath(); ctx.moveTo(pad.left, yScale(50)); ctx.lineTo(pad.left + cw, yScale(50)); ctx.stroke();

        // 30 line
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
        ctx.beginPath(); ctx.moveTo(pad.left, yScale(30)); ctx.lineTo(pad.left + cw, yScale(30)); ctx.stroke();
        ctx.fillStyle = 'rgba(0, 255, 136, 0.55)';
        ctx.fillText('30', pad.left + cw + 4, yScale(30) + 3);
      } else if (isKDJ) {
        ctx.setLineDash([4, 4]);
        // 80 line
        ctx.strokeStyle = 'rgba(255, 59, 92, 0.3)';
        ctx.beginPath(); ctx.moveTo(pad.left, yScale(80)); ctx.lineTo(pad.left + cw, yScale(80)); ctx.stroke();
        ctx.fillStyle = 'rgba(255, 59, 92, 0.55)';
        ctx.font = '9px monospace';
        ctx.fillText('80', pad.left + cw + 4, yScale(80) + 3);

        // 50 middle line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath(); ctx.moveTo(pad.left, yScale(50)); ctx.lineTo(pad.left + cw, yScale(50)); ctx.stroke();

        // 20 line
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
        ctx.beginPath(); ctx.moveTo(pad.left, yScale(20)); ctx.lineTo(pad.left + cw, yScale(20)); ctx.stroke();
        ctx.fillStyle = 'rgba(0, 255, 136, 0.55)';
        ctx.fillText('20', pad.left + cw + 4, yScale(20) + 3);
      } else if (isCCI) {
        ctx.setLineDash([4, 4]);
        // 100 line
        ctx.strokeStyle = 'rgba(255, 59, 92, 0.3)';
        ctx.beginPath(); ctx.moveTo(pad.left, yScale(100)); ctx.lineTo(pad.left + cw, yScale(100)); ctx.stroke();
        ctx.fillStyle = 'rgba(255, 59, 92, 0.55)';
        ctx.font = '9px monospace';
        ctx.fillText('100', pad.left + cw + 4, yScale(100) + 3);

        // 0 line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.beginPath(); ctx.moveTo(pad.left, yScale(0)); ctx.lineTo(pad.left + cw, yScale(0)); ctx.stroke();

        // -100 line
        ctx.strokeStyle = 'rgba(0, 255, 136, 0.3)';
        ctx.beginPath(); ctx.moveTo(pad.left, yScale(-100)); ctx.lineTo(pad.left + cw, yScale(-100)); ctx.stroke();
        ctx.fillStyle = 'rgba(0, 255, 136, 0.55)';
        ctx.fillText('-100', pad.left + cw + 4, yScale(-100) + 3);
      } else if (isMACD) {
        // 0 line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath(); ctx.moveTo(pad.left, yScale(0)); ctx.lineTo(pad.left + cw, yScale(0)); ctx.stroke();
      } else {
        // Price-based: draw thin guidelines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        for (let i = 1; i < 4; i++) {
          const y = 12 + (ch / 4) * i;
          ctx.beginPath(); ctx.moveTo(pad.left, y); ctx.lineTo(pad.left + cw, y); ctx.stroke();
        }

        // Draw translucent price line for relative comparison
        const pricePts = [];
        for (let i = scrollOffset; i < Math.min(ohlc.length, scrollOffset + visibleBars); i++) {
          const indexInSlice = i - scrollOffset;
          const x = pad.left + indexInSlice * (candleW + gap) + gap/2 + candleW/2;
          pricePts.push([x, yScale(ohlc[i].close)]);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        pricePts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
        ctx.stroke();
      }
      ctx.restore();

      // Plot actual indicator line
      const pts = [];
      for (let i = scrollOffset; i < Math.min(ohlc.length, scrollOffset + visibleBars); i++) {
        const v = indData[i];
        if (v == null) {
          pts.push([null, null]);
        } else {
          const indexInSlice = i - scrollOffset;
          const x = pad.left + indexInSlice * (candleW + gap) + gap/2 + candleW/2;
          pts.push([x, yScale(v)]);
        }
      }

      // Color and drawing style selection
      let lineCol = COLORS.magenta;
      if (spec.includes('KDJ_K')) lineCol = '#00e5ff'; // Cyan
      else if (spec.includes('KDJ_D')) lineCol = '#ffd600'; // Yellow
      else if (spec.includes('KDJ_J')) lineCol = '#d500f9'; // Magenta
      else if (spec.includes('MACD_DIF')) lineCol = '#00e5ff'; // DIF Cyan
      else if (spec.includes('MACD_DEA')) lineCol = '#ff6d00'; // DEA Orange
      else if (spec.includes('CCI')) lineCol = '#00e676'; // CCI Green
      else if (spec.includes('BOLL_MID')) lineCol = 'rgba(255, 255, 255, 0.5)';
      else if (spec.includes('BOLL_UP') || spec.includes('BOLL_DOWN')) lineCol = 'rgba(0, 229, 255, 0.4)';

      if (spec.includes('MACD_BAR')) {
        // Draw MACD histogram bars
        for (let i = scrollOffset; i < Math.min(ohlc.length, scrollOffset + visibleBars); i++) {
          const v = indData[i];
          if (v != null) {
            const indexInSlice = i - scrollOffset;
            const x = pad.left + indexInSlice * (candleW + gap) + gap/2;
            const zeroY = yScale(0);
            const valY = yScale(v);
            
            ctx.fillStyle = v >= 0 ? 'rgba(0, 255, 136, 0.45)' : 'rgba(255, 59, 92, 0.45)';
            ctx.strokeStyle = v >= 0 ? '#00552b' : '#550012';
            ctx.lineWidth = 1;
            
            ctx.beginPath();
            ctx.rect(x, Math.min(zeroY, valY), candleW, Math.abs(zeroY - valY));
            ctx.fill();
            ctx.stroke();
          }
        }
      } else {
        drawGlowLine(ctx, pts, lineCol, 12, 1.6);
      }

      ctx.fillStyle = COLORS.gridText;
      ctx.font = '10px monospace';
      ctx.fillText(maxY.toFixed(2), w - pad.right + 8, 15);
      ctx.fillText(minY.toFixed(2), w - pad.right + 8, h - 12);

      // Update header text to show current value
      const lastVal = indData[indData.length - 1];
      if (lastVal != null) {
        document.getElementById('equityText').innerHTML = `${spec}: <span class="neon-pink">${lastVal.toFixed(2)}</span>`;
      } else {
        document.getElementById('equityText').innerHTML = `${spec}: <span class="neon-pink">--</span>`;
      }
    }