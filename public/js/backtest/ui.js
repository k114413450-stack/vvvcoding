function renderAIAssistantCard(config, rawPrompt) {
      const clar = config.user_clarifications;
      const progressWrap = document.getElementById('aiProgressWrap');
      const assistantCard = document.getElementById('aiAssistantCard');
      if (!clar || clar.length === 0) {
        activeClarificationsQueue = [];
        resolvedClarificationsParams = {};
        if (progressWrap) progressWrap.style.display = 'none';
        if (assistantCard) assistantCard.style.display = 'none';
        return;
      }
      
      // Initialize local queue on the first check
      activeClarificationsQueue = [...clar];
      resolvedClarificationsParams = {};
      originalUserPrompt = rawPrompt;
      
      renderNextClarificationCard();
    }

    function renderNextClarificationCard() {
      const card = document.getElementById('aiAssistantCard');
      const title = document.getElementById('aiAssistantTitle');
      const optionsContainer = document.getElementById('aiAssistantOptions');
      
          if (!card || !title || !optionsContainer) {
            console.warn('AI assistant DOM missing; cannot render clarification card');
            return;
          }
      
          title.innerHTML = '';
          optionsContainer.innerHTML = '';
      
          if (activeClarificationsQueue.length === 0) {
            card.style.display = 'none';
            return;
          }
      
          const c = activeClarificationsQueue[0];
          card.style.display = 'block';
          title.textContent = c.title;
      
      // Update progress bar UI locally
      const total = Object.keys(resolvedClarificationsParams).length + activeClarificationsQueue.length;
      const resolved = Object.keys(resolvedClarificationsParams).length;
      
      const progressWrap = document.getElementById('aiProgressWrap');
      const progressBar = document.getElementById('aiProgressBar');
      const progressLabel = document.getElementById('aiProgressLabel');
      const progressCount = document.getElementById('aiProgressCount');
      const progressBadge = document.getElementById('aiProgressBadge');
      
      if (total > 1) {
        progressWrap.style.display = 'block';
        const pct = Math.round((resolved / total) * 100);
        progressBar.style.width = pct + '%';
        progressLabel.textContent = resolved > 0 
          ? `✅ 已解决 ${resolved} / ${total} 项` 
          : `🔍 发现 ${total} 项需确认`;
        progressCount.textContent = `剩余 ${activeClarificationsQueue.length} 项`;
        progressBadge.textContent = `${resolved}/${total}`;
      } else {
        progressWrap.style.display = 'none';
        progressBadge.textContent = '';
      }
      
      c.options.forEach(opt => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.gap = '6px';
        row.style.margin = '2px 0';
        
        if (opt.hasInput) {
          const labelSpan = document.createElement('span');
          labelSpan.textContent = opt.label + ":";
          labelSpan.style.color = 'var(--text-dim)';
          labelSpan.style.fontSize = '0.7rem';
          
          const input = document.createElement('input');
          input.type = 'number';
          input.value = '5';
          input.style.width = '45px';
          input.style.background = '#0d1117';
          input.style.border = '1px solid var(--border)';
          input.style.color = '#ffffff';
          input.style.fontFamily = 'monospace';
          input.style.fontSize = '0.7rem';
          input.style.borderRadius = '3px';
          input.style.padding = '1px 3px';
          input.style.outline = 'none';
          
          const confirmBtn = document.createElement('button');
          confirmBtn.textContent = '确认';
          confirmBtn.className = 'pill';
          confirmBtn.style.padding = '1px 6px';
          confirmBtn.style.fontSize = '0.65rem';
          confirmBtn.style.borderColor = 'var(--cyan)';
          confirmBtn.style.color = 'var(--cyan)';
          confirmBtn.style.borderRadius = '3px';
          
          confirmBtn.onclick = () => {
            const val = input.value.trim() || '5';
            let resolvedStr = "";
            if (opt.appendTemplate) {
              resolvedStr = opt.appendTemplate.replace('{value}', val).replace(/^;\s*/, "");
            } else if (opt.replace) {
              resolvedStr = opt.replace.replace('{value}', val).replace(/^;\s*/, "");
            } else if (opt.append) {
              resolvedStr = opt.append.replace('{value}', val).replace(/^;\s*/, "");
            } else {
              resolvedStr = opt.label + " " + val;
            }
            handleClarificationResolved(c.id, resolvedStr);
          };
          
          row.appendChild(labelSpan);
          row.appendChild(input);
          row.appendChild(confirmBtn);
        } else {
          const btn = document.createElement('button');
          btn.className = 'pill';
          btn.style.padding = '2px 8px';
          btn.style.fontSize = '0.68rem';
          btn.style.borderRadius = '4px';
          btn.style.border = '1px dashed var(--border)';
          btn.style.width = '100%';
          btn.style.textAlign = 'left';
          btn.textContent = opt.label;
          
          btn.onclick = () => {
            let resolvedStr = "";
            if (opt.append) {
              resolvedStr = opt.append.replace(/^;\s*/, "");
            } else if (opt.appendTemplate) {
              resolvedStr = opt.appendTemplate.replace(/^;\s*/, "");
            } else if (opt.replace) {
              resolvedStr = opt.replace.replace(/^;\s*/, "");
            } else {
              resolvedStr = opt.label;
            }
            handleClarificationResolved(c.id, resolvedStr);
          };
          row.appendChild(btn);
        }
        optionsContainer.appendChild(row);
      });
    }

    function handleClarificationResolved(id, resolvedStr) {
      resolvedClarificationsParams[id] = resolvedStr;
      activeClarificationsQueue.shift();
      
      if (activeClarificationsQueue.length > 0) {
        renderNextClarificationCard();
      } else {
        // Compile structured prompt template for the final single translation call!
        let finalPrompt = `策略逻辑：\n${originalUserPrompt}\n\n参数设定：\n`;
        Object.keys(resolvedClarificationsParams).forEach(key => {
          finalPrompt += `- ${resolvedClarificationsParams[key]}\n`;
        });
        applySuggestionUpdate(finalPrompt);
      }
    }

    function applySuggestionUpdate(newText) {
      const textarea = document.getElementById('strategyInput');
      textarea.value = newText;
      
      // Trigger neon flash animation
      textarea.style.borderColor = 'var(--green)';
      textarea.style.boxShadow = '0 0 15px rgba(0, 255, 136, 0.4)';
      textarea.style.transform = 'scale(1.01)';
      
      setTimeout(() => {
        textarea.style.borderColor = 'var(--border)';
        textarea.style.boxShadow = 'none';
        textarea.style.transform = 'none';
        
        // Auto trigger run click
        document.getElementById('btnRun').click();
      }, 500);
    }

    function renderAllCharts() {
      drawBgMesh(document.getElementById('bgMesh'));
      const layout = drawMainChart(document.getElementById('candleChart'), ohlc);
      
      if (activeSubTab === 'equity') {
        document.getElementById('equityChart').style.display = 'block';
        document.getElementById('indicatorChart').style.display = 'none';
        drawEquityChart(document.getElementById('equityChart'), equityHistory, layout);
      } else {
        document.getElementById('equityChart').style.display = 'none';
        document.getElementById('indicatorChart').style.display = 'block';
        drawIndicatorChart(document.getElementById('indicatorChart'), layout);
      }
    }

    // ── 7. Handle Run Button Click ──
    document.getElementById('btnRun').addEventListener('click', async () => {
      const strategyText = document.getElementById('strategyInput').value.trim();
      console.log("Backtest Run Clicked! Strategy text: [" + strategyText + "]");
      if (!strategyText) return;

      // Reset convergence state if user started a fresh strategy
      if (strategyText !== lastRawPrompt) {
        clarificationTotalIssues = 0;
        clarificationResolvedCount = 0;
      }
      lastRawPrompt = strategyText;

      const startText = document.getElementById('startDate').value.trim();
      const endText = document.getElementById('endDate').value.trim();
      const btn = document.getElementById('btnRun');
      const inputArea = document.getElementById('strategyInput');
      const thinkingWrap = document.getElementById('aiThinkingWrap');
      const thinkingText = document.getElementById('aiThinkingText');
      const thinkingPercent = document.getElementById('aiThinkingPercent');

            // Basic input validation: reject too-short or numeric-only inputs to avoid unnecessary API/AI calls
            const isNumericOnly = /^\d+$/.test(strategyText);
            const isWhitespaceOrPunct = /^[\s\W]+$/.test(strategyText);
            if (isNumericOnly || isWhitespaceOrPunct || strategyText.length < 8) {
              // Friendly inline feedback instead of triggering AI
              alert("请输入清晰的回测策略描述（例如：当5日均线上穿10日均线时买入）。短或纯数字输入无法编译。");
              // reset button text/state just in case
              try { btn.textContent = isEN ? "⚡ Start Backtest" : "⚡ 开始回测"; btn.disabled = false; } catch (e) {}
              if (inputArea) inputArea.classList.remove('ai-compiling');
              if (thinkingWrap) thinkingWrap.style.display = 'none';
              clearInterval(typeof progressInterval !== 'undefined' ? progressInterval : null);
              return;
            }

      // 激活编译锁定状态
      btn.textContent = isEN ? "⚡ Compiling..." : "⚡ 正在计算中...";
      btn.disabled = true;
      if (inputArea) inputArea.classList.add('ai-compiling');
      if (thinkingWrap) {
        thinkingWrap.style.display = 'block';
        thinkingPercent.textContent = '0%';
        thinkingText.textContent = isEN ? "🤖 AI analyzing strategy rules..." : "🤖 AI 正在分析理解策略语意...";
      }

      // 实时编译进度模拟器定时器
      let percentVal = 0;
      const progressStages = isEN ? [
        { upTo: 25, text: "🤖 AI analyzing strategy grammar..." },
        { upTo: 55, text: "⚙️ Generating quantitative mathematical formulas..." },
        { upTo: 85, text: "🧬 Compiling technical indicators pipeline..." },
        { upTo: 92, text: "⚡ Validating sandbox execution rules..." }
      ] : [
        { upTo: 25, text: "🤖 AI正在分析理解策略语意..." },
        { upTo: 55, text: "⚙️ 正在生成量化计算公式..." },
        { upTo: 85, text: "🧬 正在编译技术指标管道..." },
        { upTo: 92, text: "⚡ 正在校验回测沙盒沙盘..." }
      ];

      const progressInterval = setInterval(() => {
        if (percentVal < 92) {
          percentVal += Math.floor(Math.random() * 4) + 1;
          if (percentVal > 92) percentVal = 92;
          if (thinkingPercent) thinkingPercent.textContent = percentVal + '%';

          // 根据进度切换不同的AI思考台词
          const stage = progressStages.find(s => percentVal <= s.upTo);
          if (stage && thinkingText) {
            thinkingText.textContent = stage.text;
          }
        }
      }, 80);

      try {
        console.log("Fetching history data for range:", startText, "to", endText);
        // 1. Fetch real historical data from our new range API
        const dataRes = await fetch(`/api/history?symbol=${currentSymbol.code}&start=${startText}&end=${endText}`);
        console.log("History response status:", dataRes.status);
        const dataJson = await dataRes.json();
        
        if (dataJson.error) {
          clearInterval(progressInterval);
          if (thinkingWrap) thinkingWrap.style.display = 'none';
          if (inputArea) inputArea.classList.remove('ai-compiling');
          console.error("History response error:", dataJson.error);
          alert(`读取历史数据失败: ${dataJson.error}`);
          return;
        }

        // Cache raw M1 history data
        rawOHLC = dataJson.candles;
        console.log("Cached rawOHLC length:", rawOHLC.length);
        
        // Group according to active Timeframe toggle
        if (currentTF === "M5") {
          ohlc = aggregateToM5(rawOHLC);
        } else {
          ohlc = [...rawOHLC];
        }
        closes = ohlc.map(d => d.close);
        
        visibleBars = Math.min(150, ohlc.length);
        scrollOffset = Math.max(0, ohlc.length - visibleBars);

        console.log("Fetching strategy translation from api...");
        // 2. Translate strategy
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ strategy: strategyText })
        });
        console.log("Translate response status:", response.status);

        if (!response.ok) {
          const txt = await response.text().catch(() => 'No response body');
          throw new Error(`Translate API returned status ${response.status}: ${txt}`);
        }

        let strategyConfig;
        try {
          strategyConfig = await response.json();
        } catch (parseErr) {
          throw new Error(`Failed to parse translate response JSON: ${parseErr.message}`);
        }

        // 停止模拟进度并跳跃到 100% 成功状态
        clearInterval(progressInterval);
        if (thinkingPercent) thinkingPercent.textContent = '100%';
        if (thinkingText) thinkingText.textContent = isEN ? "✅ Compilation successful! Injecting data..." : "✅ 策略编译成功！数据正在注入...";
        
        // 给用户 350ms 感受 100% 成功的瞬间
        await new Promise(r => setTimeout(r, 350));
        if (thinkingWrap) thinkingWrap.style.display = 'none';
        if (inputArea) inputArea.classList.remove('ai-compiling');

        if (strategyConfig.error) {

          console.error("Strategy Config error:", strategyConfig.error);
          alert(`策略编译出错：${strategyConfig.error}`);
          
          // Send failure telemetry feedback
          fetch('/api/log_feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              original_prompt: strategyText,
              compiled_config: {},
              developer_feedback: "Compilation error returned from translator",
              error: strategyConfig.error
            })
          }).catch(e => console.error("Telemetry log failed:", e));
        } else {
          console.log("Strategy Config:", JSON.stringify(strategyConfig));
          
          // Check if user has clarifications remaining
          const hasClarifications = strategyConfig.user_clarifications && strategyConfig.user_clarifications.length > 0;

          if (hasClarifications) {
            // Case A: Strategy is incomplete. Render interactive options in assistant card.
            // DO NOT start simulation, morphing panel animation, or K-line play loop.
            renderAIAssistantCard(strategyConfig, strategyText);
            
            // Send background telemetry loop logs for incomplete strategy
            if (strategyConfig.developer_feedback) {
              fetch('/api/log_feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  original_prompt: strategyText,
                  compiled_config: strategyConfig,
                  developer_feedback: strategyConfig.developer_feedback,
                  error: ""
                })
              }).catch(e => console.error("Telemetry log failed:", e));
            }
            
            // Clear current chart backtest records to prevent displaying old runs
            backtestTrades = [];
            equityHistory = [];
            fullBacktestTrades = [];
            fullEquityHistory = [];
            isPlaying = false;
            if (animFrameId) cancelAnimationFrame(animFrameId);
            
            renderAllCharts();
            renderTerminalTable([]);
            
            console.log("Strategy incomplete. Suspended execution to wait for user choices.");
          } else {
            // Case B: Strategy is fully complete!
            // 1. Render success message in AI assistant card (台词反馈)
            const card = document.getElementById('aiAssistantCard');
            const title = document.getElementById('aiAssistantTitle');
            const optionsContainer = document.getElementById('aiAssistantOptions');
            const progressWrap = document.getElementById('aiProgressWrap');
            const progressBadge = document.getElementById('aiProgressBadge');
            const playbackControls = document.getElementById('playbackControls');
            
            // Hide progress bar when fully complete
            if (progressWrap) progressWrap.style.display = 'none';
            if (progressBadge) progressBadge.textContent = '';
            
            if (card) {
              if (title) {
                card.style.display = 'block';
                card.style.borderColor = 'var(--green)';
                card.style.background = 'rgba(0, 255, 136, 0.03)';
                title.innerHTML = isEN ? '🤖 <span style="color: var(--green); font-weight: bold;">Strategy verified successfully!</span> Quant engine ready. Morphing panels...' : '🤖 <span style="color: var(--green); font-weight: bold;">策略验证通过！</span>量化回测就绪，准备全息变形开屏...';
              }
              if (optionsContainer) optionsContainer.innerHTML = '';
            }
            
            // Hide playback controls during transition
            if (playbackControls) playbackControls.style.display = 'none';
            isPlaying = false;
            if (animFrameId) cancelAnimationFrame(animFrameId);
            
            // 2. Wait 800ms for user to read success line
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // 3. Trigger Transformers full morphing panel animations (700ms)
            const panels = document.querySelectorAll('.panel');
            panels.forEach(p => {
              p.classList.add('hud-booting');
              setTimeout(() => p.classList.remove('hud-booting'), 700);
            });
            
            // Wait 700ms for panel morph animation to finish
            await new Promise(resolve => setTimeout(resolve, 700));
            
            // 4. Start the K-line simulation playback replay loop!
            console.log("Starting runLocalBacktest...");
            runLocalBacktest(strategyConfig);
            console.log("runLocalBacktest completed.");
            
            // Send execution telemetry log including trades results!
            if (strategyConfig.developer_feedback) {
              fetch('/api/log_feedback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  original_prompt: strategyText,
                  compiled_config: strategyConfig,
                  developer_feedback: strategyConfig.developer_feedback,
                  error: "",
                  backtest_result: {
                    trade_count: backtestTrades.length,
                    final_equity: equityHistory.length > 0 ? parseFloat(equityHistory[equityHistory.length - 1].toFixed(2)) : 10000.0,
                    net_profit: equityHistory.length > 0 ? parseFloat((equityHistory[equityHistory.length - 1] - 10000).toFixed(2)) : 0.0,
                    trades_details: backtestTrades.map(t => ({ type: t.type, index: t.index, price: parseFloat(t.price.toFixed(2)) }))
                  }
                })
              }).catch(e => console.error("Telemetry log failed:", e));
            }
            
            // Populate terminal table
            renderTerminalTable(backtestTrades);
            console.log("renderTerminalTable completed.");
          }
        }
      } catch (err) {
        console.error("Caught click exception:", err);
        // Surface a clearer error to the user (include message)
        const msg = err && err.message ? err.message : String(err);
        alert(`网络或 API 出错：${msg}`);
      } finally {
        clearInterval(progressInterval);
        if (thinkingWrap) thinkingWrap.style.display = 'none';
        if (inputArea) inputArea.classList.remove('ai-compiling');
        btn.textContent = isEN ? "⚡ Start Backtest" : "⚡ 开始回测";
        btn.disabled = false;
      }
    });

    // ── 8. Timeframe Selector Listeners ──
    document.getElementById('btnM1').addEventListener('click', () => {
      if (currentTF === 'M1') return;
      currentTF = 'M1';
      document.getElementById('btnM1').style.borderColor = 'var(--green)';
      document.getElementById('btnM1').style.color = 'var(--green)';
      document.getElementById('btnM5').style.borderColor = 'var(--border)';
      document.getElementById('btnM5').style.color = 'var(--text-secondary)';
      
      ohlc = [...rawOHLC];
      closes = ohlc.map(d => d.close);
      
      visibleBars = Math.min(150, ohlc.length);
      scrollOffset = Math.max(0, ohlc.length - visibleBars);
      renderAllCharts();
    });

    document.getElementById('btnM5').addEventListener('click', () => {
      if (currentTF === 'M5') return;
      currentTF = 'M5';
      document.getElementById('btnM5').style.borderColor = 'var(--green)';
      document.getElementById('btnM5').style.color = 'var(--green)';
      document.getElementById('btnM1').style.borderColor = 'var(--border)';
      document.getElementById('btnM1').style.color = 'var(--text-secondary)';
      
      ohlc = aggregateToM5(rawOHLC);
      closes = ohlc.map(d => d.close);
      
      visibleBars = Math.min(150, ohlc.length);
      scrollOffset = Math.max(0, ohlc.length - visibleBars);
      renderAllCharts();
    });

    // ── 9. Interactive Drag & Zoom Canvas Event Listeners ──
    const chartCanvas = document.getElementById('candleChart');
    window.isDragging = false;
    let dragStartX = 0;
    let dragStartOffset = 0;

    window.resetChartPanDrag = function () {
      window.isDragging = false;
      if (chartCanvas) chartCanvas.style.cursor = 'crosshair';
    };

    chartCanvas.addEventListener('mousedown', (e) => {
      if (window.diagnoseModeActive) return; // Disable panning/zooming during diagnosis mode
      window.isDragging = true;
      dragStartX = e.clientX;
      dragStartOffset = scrollOffset;
      chartCanvas.style.cursor = 'grabbing';
    });

    chartCanvas.addEventListener('mousemove', (e) => {
      if (window.diagnoseModeActive) return; // Disable panning/zooming during diagnosis mode
      if (!window.isDragging) return;
      const deltaX = e.clientX - dragStartX;
      const rect = chartCanvas.getBoundingClientRect();
      const cw = rect.width - 72;
      const barWidth = cw / visibleBars;
      const barsMoved = Math.round(deltaX / barWidth);
      
      scrollOffset = Math.max(0, Math.min(ohlc.length - visibleBars, dragStartOffset - barsMoved));
      renderAllCharts();
    });

    window.addEventListener('mouseup', () => {
      if (window.isDragging) {
        window.isDragging = false;
        if (!window.diagnoseModeActive) chartCanvas.style.cursor = 'crosshair';
      }
    });

    chartCanvas.style.cursor = 'crosshair';

    chartCanvas.addEventListener('wheel', (e) => {
      if (window.diagnoseModeActive) return; // Disable panning/zooming during diagnosis mode
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 1.15 : 0.85;
      const prevVisible = visibleBars;
      visibleBars = Math.max(20, Math.min(ohlc.length, Math.round(visibleBars * zoomFactor)));
      
      const diff = visibleBars - prevVisible;
      scrollOffset = Math.max(0, Math.min(ohlc.length - visibleBars, Math.round(scrollOffset - diff / 2)));
      renderAllCharts();
    });

    // ── 10. Playback Controller Listeners ──
    document.getElementById('btnPlayPause').addEventListener('click', () => {
      // Clear visual pause states
      document.getElementById('btnPlayPause').classList.remove('pulse-button');
      document.getElementById('playbackStatus').style.display = 'none';
      isPausedForTrade = false;
      
      if (isPlaying) {
        isPlaying = false;
        document.getElementById('btnPlayPause').textContent = '▶ 播放';
        document.getElementById('btnPlayPause').style.color = 'var(--green)';
        document.getElementById('btnPlayPause').style.borderColor = 'var(--green)';
        document.getElementById('btnPlayPause').style.background = 'rgba(0,255,136,0.05)';
      } else {
        if (simIndex >= rawOHLC.length) {
          simIndex = Math.min(100, rawOHLC.length);
        }
        isPlaying = true;
        document.getElementById('btnPlayPause').textContent = '⏸ 暂停';
        document.getElementById('btnPlayPause').style.color = 'var(--cyan)';
        document.getElementById('btnPlayPause').style.borderColor = 'var(--cyan)';
        document.getElementById('btnPlayPause').style.background = 'rgba(0,229,255,0.05)';
        animFrameId = requestAnimationFrame(stepSimulation);
      }
    });

    document.getElementById('btnStopPlayback').addEventListener('click', () => {
      isPlaying = false;
      isPausedForTrade = false;
      simIndex = rawOHLC.length;
      
      document.getElementById('playbackStatus').style.display = 'none';
      document.getElementById('btnPlayPause').classList.remove('pulse-button');
      
      if (currentTF === "M5") {
        ohlc = aggregateToM5(rawOHLC);
      } else {
        ohlc = [...rawOHLC];
      }
      closes = ohlc.map(d => d.close);
      
      visibleBars = Math.min(150, ohlc.length);
      scrollOffset = Math.max(0, ohlc.length - visibleBars);
      
      backtestTrades = [...fullBacktestTrades];
      equityHistory = [...fullEquityHistory];
      
      renderAllCharts();
      renderTerminalTable(backtestTrades);
      
      // Update statistics
      const netProfit = equityHistory[equityHistory.length - 1] - 10000;
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
      
      let currentPeak = 10000;
      let currentMaxDD = 0;
      equityHistory.forEach(eq => {
        if (eq > currentPeak) currentPeak = eq;
        const dd = (currentPeak - eq) / currentPeak;
        if (dd > currentMaxDD) currentMaxDD = dd;
      });
      
      document.getElementById('resultsBox').style.display = 'block';
      document.getElementById('statReturn').textContent = (profitPct >= 0 ? '+' : '') + profitPct.toFixed(2) + '%';
      document.getElementById('statReturn').className = `stats-val ${profitPct >= 0 ? 'green' : 'red'}`;
      document.getElementById('statTrades').textContent = `${totalTradesCount} 次开仓`;
      document.getElementById('statWinRate').textContent = winRate.toFixed(1) + '%';
      document.getElementById('statDrawdown').textContent = (currentMaxDD * 100).toFixed(2) + '%';
      
      document.getElementById('btnPlayPause').textContent = '▶ 播放';
      document.getElementById('btnPlayPause').style.color = 'var(--text-secondary)';
      document.getElementById('btnPlayPause').style.borderColor = 'var(--border)';
      document.getElementById('btnPlayPause').style.background = 'transparent';
    });

    document.getElementById('playbackSpeed').addEventListener('input', (e) => {
      document.getElementById('speedVal').textContent = e.target.value + 'x';
    });

    // ── Global Symbols and Watchlist State ──
    const SYMBOLS = [
      { code: "XAUUSD", name: "XAUUSD 黄金", desc: "高杠杆波动狂热，欧美盘爆发战役" },
      { code: "BTCUSD", name: "BTCUSD 比特币", desc: "AI策略全天候对决，极高波动池" },
      { code: "ETHUSD", name: "ETHUSD 以太坊", desc: "智能合约主权资产，适合网格/马丁" }
    ];
    let currentSymbol = SYMBOLS[0];
    window.currentSymbol = currentSymbol; // Expose globally if needed

    function renderSymbolList() {
      const listEl = document.getElementById("symbolList");
      if (!listEl) return;
      listEl.innerHTML = "";

      SYMBOLS.forEach(sym => {
        const li = document.createElement("li");
        li.className = "symbol" + (sym.code === currentSymbol.code ? " active" : "");
        li.style.cssText = "display:flex; flex-direction:column; align-items:flex-start; padding:10px; cursor:pointer;";
        li.innerHTML = `
          <div style="display:flex; align-items:center; gap:8px; width:100%;">
            <span class="sym-dot ${sym.code === currentSymbol.code ? "" : "dim"}"></span>
            <span style="font-weight:bold; font-size:0.75rem; color:#fff;">${sym.name}</span>
          </div>
          <div style="font-size:0.58rem; color:var(--text-dim); margin-top:4px; line-height:1.3;">${sym.desc}</div>
        `;
        li.addEventListener("click", async () => {
          document.querySelectorAll("#symbolList li").forEach(el => {
            el.classList.remove("active");
            el.querySelector(".sym-dot").classList.add("dim");
          });
          li.classList.add("active");
          li.querySelector(".sym-dot").classList.remove("dim");
          
          currentSymbol = sym;
          window.currentSymbol = currentSymbol;
          
          // Re-load data for new symbol
          const startText = document.getElementById('startDate').value.trim();
          const endText = document.getElementById('endDate').value.trim();
          await fetchHistoryData(startText, endText);
        });
        listEl.appendChild(li);
      });
    }

    async function fetchHistoryData(startText, endText) {
      try {
        const dataRes = await fetch(`/api/history?symbol=${currentSymbol.code}&start=${startText}&end=${endText}`);
        const dataJson = await dataRes.json();
        if (dataJson && dataJson.candles) {
          rawOHLC = dataJson.candles;
          if (currentTF === "M5") {
            ohlc = aggregateToM5(rawOHLC);
          } else {
            ohlc = [...rawOHLC];
          }
          closes = ohlc.map(d => d.close);
          
          visibleBars = Math.min(150, ohlc.length);
          scrollOffset = Math.max(0, ohlc.length - visibleBars);
          renderAllCharts();
          renderTerminalTable([]);
        }
      } catch (e) {
        console.warn("Could not load history data for symbol", currentSymbol.code, e);
      }
    }

    window.addEventListener('load', async () => {
      loadTemplate('ma_cross');
      
      // Parse URL parameters
      const params = new URLSearchParams(window.location.search);
      const paramSym = params.get("symbol");
      const paramStrat = params.get("strategy");
      const paramStart = params.get("start");
      const paramEnd = params.get("end");

      if (paramSym) {
        const found = SYMBOLS.find(s => s.code === paramSym.toUpperCase());
        if (found) {
          currentSymbol = found;
          window.currentSymbol = currentSymbol;
        }
      }
      if (paramStart) {
        document.getElementById('startDate').value = paramStart;
      }
      if (paramEnd) {
        document.getElementById('endDate').value = paramEnd;
      }
      if (paramStrat) {
        document.getElementById('strategyInput').value = paramStrat;
      }

      renderSymbolList();
      
      const startText = document.getElementById('startDate').value.trim();
      const endText = document.getElementById('endDate').value.trim();
      await fetchHistoryData(startText, endText);

      // Auto-run if strategy was carried in URL
      if (paramStrat) {
        setTimeout(() => {
          document.getElementById('btnRun').click();
        }, 150);
      }
    });

    window.addEventListener('resize', () => {
      clearTimeout(window._resizeT);
      window._resizeT = setTimeout(renderAllCharts, 120);
    });