// ============================================================
//  DEGEN SANDBOX — AI 策略诊断仪 (Strategy Diagnosis Engine)
//  diagnose.js — 框选、子条件追踪、AI 诊断 API 调用
// ============================================================

// ── 状态变量（挂到 window，供 ui.js 在框选时禁用图谱拖拽）──
window.diagnoseModeActive = false;
let diagSelectStartX = null;
let diagSelectStartBar = null;
let diagSelectEndBar = null;
let diagIsDragging = false;
let diagDragStartX = null;
let diagDragStartY = null;
let diagDragCurrentX = null;
let diagDragCurrentY = null;

// 浮动问题气泡
let diagPopupEl = null;

// 存储引擎每 bar 的状态快照（由 engine.js 填充）
let fullStateHistory = [];

// 存储最近一次使用的策略配置（由 ui.js 在 runLocalBacktest 后赋值）
let lastStrategyConfig = null;
let lastIndicatorsDef = {};

// ── 初始化诊断框选工具 ──
function initDiagnoseMode() {
  const canvas = document.getElementById('candleChart');
  if (!canvas) return;

  // capture 阶段优先于 ui.js 的拖拽监听，避免框选时图谱跟着移动
  canvas.addEventListener('mousedown', onDiagMouseDown, true);
  canvas.addEventListener('mousemove', onDiagMouseMove, true);
  canvas.addEventListener('mouseup', onDiagMouseUp, true);
  document.addEventListener('mouseup', onDiagMouseUp, true);
}

// 根据 canvas X 坐标找到对应的 bar 索引（参照 chart.js drawMainChart 的布局逻辑）
function xToBarIndex(canvasX) {
  const canvas = document.getElementById('candleChart');
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  
  const pad = { left: 8, right: 64 };
  const cw = w - pad.left - pad.right;
  const n = ohlc.length;
  const vBars = Math.max(20, Math.min(n, visibleBars));
  const gap = cw / vBars > 4 ? 2 : (cw / vBars > 2 ? 1 : 0.2);
  const candleW = Math.max(0.5, (cw / vBars) - gap);
  const step = candleW + gap;

  const relX = canvasX - pad.left - gap / 2;
  let idxInSlice = Math.floor(relX / step);
  idxInSlice = Math.max(0, Math.min(vBars - 1, idxInSlice));
  return scrollOffset + idxInSlice;
}

function onDiagMouseDown(e) {
  if (!window.diagnoseModeActive) return;
  e.stopImmediatePropagation();
  e.preventDefault();
  const rect = e.target.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const scaleX = (e.target.width / dpr) / rect.width;
  const relX = (e.clientX - rect.left) * scaleX;

  diagIsDragging = true;
  diagSelectStartBar = xToBarIndex(relX);
  diagSelectEndBar = null;
  diagDragStartX = e.clientX;
  diagDragStartY = e.clientY;
  diagDragCurrentX = e.clientX;
  diagDragCurrentY = e.clientY;

  // Remove old popup if present
  if (diagPopupEl) { diagPopupEl.remove(); diagPopupEl = null; }
  renderDiagSelectionOverlay();
}

function onDiagMouseMove(e) {
  if (!window.diagnoseModeActive || !diagIsDragging) return;
  e.stopImmediatePropagation();
  const rect = e.target.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const scaleX = (e.target.width / dpr) / rect.width;
  const relX = (e.clientX - rect.left) * scaleX;

  diagSelectEndBar = xToBarIndex(relX);
  diagDragCurrentX = e.clientX;
  diagDragCurrentY = e.clientY;
  renderDiagSelectionOverlay();
}

function onDiagMouseUp(e) {
  if (!window.diagnoseModeActive || !diagIsDragging) return;
  e.stopImmediatePropagation();
  diagIsDragging = false;

  const start = Math.min(diagSelectStartBar, diagSelectEndBar ?? diagSelectStartBar);
  const end   = Math.max(diagSelectStartBar, diagSelectEndBar ?? diagSelectStartBar);
  diagSelectStartBar = start;
  diagSelectEndBar   = end;

  if (end - start < 1) {
    // Too narrow — ignore
    diagSelectStartBar = null;
    diagSelectEndBar = null;
    renderDiagSelectionOverlay();
    return;
  }

  renderDiagSelectionOverlay();
  showDiagPopup(e.clientX, e.clientY);
}

// 在 candleChart 上渲染半透明蓝框和变色K线（通过覆盖 canvas 绘制）
function renderDiagSelectionOverlay() {
  renderAllCharts();

  if (!diagSelectStartBar && diagSelectStartBar !== 0) return;

  const canvas = document.getElementById('candleChart');
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.width / dpr;
  const h = canvas.height / dpr;

  const pad = { left: 8, right: 64, top: 20, bottom: 20 };
  const cw = w - pad.left - pad.right;
  const n = ohlc.length;
  const vBars = Math.max(20, Math.min(n, visibleBars));
  const gap = cw / vBars > 4 ? 2 : (cw / vBars > 2 ? 1 : 0.2);
  const candleW = Math.max(0.5, (cw / vBars) - gap);
  const step = candleW + gap;

  const barStart = Math.max(scrollOffset, Math.min(diagSelectStartBar, diagSelectEndBar ?? diagSelectStartBar));
  const barEnd   = Math.min(scrollOffset + vBars - 1, Math.max(diagSelectStartBar, diagSelectEndBar ?? diagSelectStartBar));

  // 框选区间转换为 canvas X 坐标
  const xLeft  = pad.left + gap / 2 + (barStart - scrollOffset) * step;
  const xRight = pad.left + gap / 2 + (barEnd - scrollOffset) * step + candleW;

  // 半透明蓝色遮罩
  ctx.save();
  ctx.fillStyle = 'rgba(0, 180, 255, 0.12)';
  ctx.fillRect(xLeft, pad.top, xRight - xLeft, h - pad.top - pad.bottom);

  // 蓝色边框
  ctx.strokeStyle = 'rgba(0, 220, 255, 0.7)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(xLeft, pad.top, xRight - xLeft, h - pad.top - pad.bottom);
  ctx.setLineDash([]);

  // 顶部标签
  const barCount = barEnd - barStart + 1;
  ctx.fillStyle = 'rgba(0,220,255,0.9)';
  ctx.font = `${10 * dpr}px monospace`;
  ctx.fillText(isEN ? `📐 ${barCount} Bars Selected` : `📐 ${barCount} 根K线已框选`, xLeft + 4, pad.top + 14);

  // 如果正在拖拽，绘制拖拽矩形虚线框（相对 canvas 的浮动叠加效果）
  if (diagIsDragging && diagDragStartX !== null) {
    const canvasRect = canvas.getBoundingClientRect();
    const rx = (Math.min(diagDragStartX, diagDragCurrentX) - canvasRect.left) * (canvas.width / dpr / canvasRect.width);
    const ry = (Math.min(diagDragStartY, diagDragCurrentY) - canvasRect.top)  * (canvas.height / dpr / canvasRect.height);
    const rw = Math.abs(diagDragCurrentX - diagDragStartX) * (canvas.width / dpr / canvasRect.width);
    const rh = Math.abs(diagDragCurrentY - diagDragStartY) * (canvas.height / dpr / canvasRect.height);
    ctx.strokeStyle = 'rgba(0, 230, 255, 0.9)';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(rx, ry, rw, rh);
    ctx.setLineDash([]);
  }

  ctx.restore();
}

// 在鼠标右下角弹出问题输入气泡
function showDiagPopup(mouseX, mouseY) {
  if (diagPopupEl) { diagPopupEl.remove(); diagPopupEl = null; }

  const barStart = Math.min(diagSelectStartBar, diagSelectEndBar);
  const barEnd   = Math.max(diagSelectStartBar, diagSelectEndBar);
  const barCount = barEnd - barStart + 1;

  const titleText = isEN ? "🔬 AI Strategy Diagnoser" : "🔬 AI 策略诊断仪";
  const descText = isEN 
    ? `Selected Bar #${barStart}~${barEnd} (Total ${barCount} Bars)<br>Describe your doubt, and AI will trace the logic mathematically.`
    : `已框选第 ${barStart}~${barEnd} 根 K 线（共 ${barCount} 根）<br>请描述您的疑问，AI 将结合 K 线数据和您的策略公式进行精准诊断。`;
  const placeholderText = isEN
    ? "e.g., Why did it not buy here? 6 bearish candles occurred but no entry..."
    : "例如：为什么这里没有买入？6根阴线出现了但没触发…";
  const cancelBtnText = isEN ? "Cancel" : "取消";
  const sendBtnText = isEN ? "🔍 Send" : "🔍 发送诊断";

  diagPopupEl = document.createElement('div');
  diagPopupEl.id = 'diagPopup';
  diagPopupEl.style.cssText = `
    position: fixed;
    left: ${Math.min(mouseX + 12, window.innerWidth - 310)}px;
    top: ${Math.min(mouseY + 8, window.innerHeight - 200)}px;
    width: 290px;
    background: linear-gradient(135deg, #0d1117 0%, #111722 100%);
    border: 1px solid rgba(0,220,255,0.4);
    border-radius: 8px;
    padding: 12px;
    z-index: 9999;
    box-shadow: 0 0 20px rgba(0,220,255,0.15), 0 4px 16px rgba(0,0,0,0.5);
    font-family: 'Share Tech Mono', monospace;
    font-size: 0.72rem;
    color: #fff;
    animation: fadeInDiag 0.2s ease;
  `;
  diagPopupEl.innerHTML = `
    <style>
      @keyframes fadeInDiag { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }
    </style>
    <div style="color:rgba(0,220,255,0.9); font-weight:700; margin-bottom:8px; font-size:0.75rem; display:flex; align-items:center; gap:6px;">
      <span style="display:inline-block;width:6px;height:6px;background:#00dcff;border-radius:50%;box-shadow:0 0 6px #00dcff;"></span>
      ${titleText}
    </div>
    <div style="color:rgba(255,255,255,0.5); font-size:0.65rem; margin-bottom:8px;">
      ${descText}
    </div>
    <textarea id="diagQuestion" placeholder="${placeholderText}" 
      style="width:100%; box-sizing:border-box; height:68px; background:#060b12; border:1px solid rgba(0,220,255,0.3); 
             border-radius:5px; color:#e0f7ff; padding:7px 8px; font-family:inherit; font-size:0.7rem; 
             resize:none; outline:none; line-height:1.45; margin-bottom:8px;"></textarea>
    <div style="display:flex; gap:6px; justify-content:flex-end; align-items:center;">
      <button onclick="closeDiagPopup()" style="background:transparent; border:1px solid rgba(255,255,255,0.1); 
        color:rgba(255,255,255,0.4); border-radius:4px; padding:4px 10px; cursor:pointer; font-size:0.65rem; font-family:inherit;">
        ${cancelBtnText}
      </button>
      <button onclick="submitDiagnosis()" id="diagSubmitBtn" style="background:linear-gradient(90deg,#006080,#004d6b); 
        border:1px solid rgba(0,220,255,0.5); color:#00dcff; border-radius:4px; padding:4px 12px; 
        cursor:pointer; font-weight:700; font-size:0.68rem; font-family:inherit;">
        ${sendBtnText}
      </button>
    </div>
  `;
  document.body.appendChild(diagPopupEl);

  setTimeout(() => {
    const ta = document.getElementById('diagQuestion');
    if (ta) ta.focus();
    // Allow submitting with Ctrl+Enter
    if (ta) ta.addEventListener('keydown', e => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submitDiagnosis();
    });
  }, 80);
}

function closeDiagPopup() {
  if (diagPopupEl) { diagPopupEl.remove(); diagPopupEl = null; }
  diagSelectStartBar = null;
  diagSelectEndBar = null;
  renderAllCharts();
}

// ── 子条件追踪器 (SubExpression Tracer) ──
function traceSubExpressions(formula, context) {
  if (!formula || formula === 'null') return {};
  const result = {};
  // Split on && or || boundaries, preserving sub-expressions
  const parts = formula.split(/(\&\&|\|\|)/);
  let current = '';
  for (const part of parts) {
    const t = part.trim();
    if (t === '&&' || t === '||') {
      current = current.trim();
      if (current) {
        try {
          const val = evaluateExpression(current, context);
          result[current] = val;
        } catch (_) { result[current] = 'error'; }
      }
      current = '';
    } else {
      current += ' ' + t;
    }
  }
  current = current.trim();
  if (current) {
    try { result[current] = evaluateExpression(current, context); }
    catch (_) { result[current] = 'error'; }
  }
  return result;
}

// ── 主诊断发送函数 ──
async function submitDiagnosis() {
  const ta = document.getElementById('diagQuestion');
  const question = ta ? ta.value.trim() : '';
  const submitBtn = document.getElementById('diagSubmitBtn');
  if (submitBtn) { submitBtn.textContent = '⏳ 诊断中...'; submitBtn.disabled = true; }

  const barStart = Math.min(diagSelectStartBar, diagSelectEndBar);
  const barEnd   = Math.max(diagSelectStartBar, diagSelectEndBar);

  // Build per-bar snapshots with subexpression traces
  const selectedBars = [];
  const config = lastStrategyConfig || {};
  const dir = config.direction || currentDirection || 'BUY';

  for (let i = barStart; i <= barEnd; i++) {
    if (i < 0 || i >= ohlc.length) continue;
    const bar = ohlc[i];
    const snap = fullStateHistory[i] || {};
    const indicators = activeIndicators || {};

    // Rebuild context (mirrors engine.js context object)
    const ctx = {
      close: bar.close,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      volume: bar.volume || 0,
      pos_count: snap.pos_count || 0,
      last_entry: snap.last_entry || 0,
      float_pnl: snap.float_pnl || 0,
      balance: snap.balance || 10000,
      max_float_pnl: snap.max_float_pnl || 0,
      bars_since_entry: snap.bars_since_entry || 0,
    };

    // Inject indicator values
    Object.keys(indicators).forEach(key => {
      ctx[key] = indicators[key][i];
      for (let o = 1; o <= 5; o++) {
        const pIdx = i - o;
        ctx[`${key}_offset_${o}`] = pIdx >= 0 ? indicators[key][pIdx] : null;
      }
    });

    // Inject OHLC offsets
    for (let o = 1; o <= 5; o++) {
      const pIdx = i - o;
      ctx[`close_offset_${o}`] = pIdx >= 0 ? ohlc[pIdx].close : null;
      ctx[`open_offset_${o}`]  = pIdx >= 0 ? ohlc[pIdx].open  : null;
      ctx[`high_offset_${o}`]  = pIdx >= 0 ? ohlc[pIdx].high  : null;
      ctx[`low_offset_${o}`]   = pIdx >= 0 ? ohlc[pIdx].low   : null;
    }

    const entryFormula = dir === 'SELL' ? config.first_sell : config.first_buy;
    const addFormula   = dir === 'SELL' ? config.add_sell   : config.add_buy;
    const exitFormula  = config.exit_all;

    selectedBars.push({
      bar_index: i,
      close: bar.close,
      open: bar.open,
      high: bar.high,
      low: bar.low,
      volume: bar.volume || 0,
      indicators: Object.fromEntries(Object.keys(indicators).map(k => [k, indicators[k][i]])),
      state: {
        pos_count: ctx.pos_count,
        last_entry: ctx.last_entry,
        float_pnl: ctx.float_pnl,
        max_float_pnl: ctx.max_float_pnl,
        bars_since_entry: ctx.bars_since_entry,
      },
      trace: {
        first_entry: traceSubExpressions(entryFormula, ctx),
        add_layer:   traceSubExpressions(addFormula, ctx),
        exit_all:    traceSubExpressions(exitFormula, ctx),
      },
      eval: {
        first_entry: evaluateExpression(entryFormula, ctx),
        add_layer:   evaluateExpression(addFormula, ctx),
        exit_all:    evaluateExpression(exitFormula, ctx),
      }
    });
  }

  // Close popup
  if (diagPopupEl) { diagPopupEl.remove(); diagPopupEl = null; }

  // Show loading state in panel
  showDiagPanel('loading', null);

  try {
    const payload = {
      user_question: question || '为什么这个区间没有触发入场或出场？',
      direction: dir,
      strategy_config: {
        first_buy: config.first_buy || null,
        first_sell: config.first_sell || null,
        add_buy: config.add_buy || null,
        add_sell: config.add_sell || null,
        exit_all: config.exit_all || null,
        max_layers: config.max_layers || 1,
        lot_multiplier: config.lot_multiplier || 1,
        pos_sl: config.pos_sl || null,
        pos_tp: config.pos_tp || null,
        pos_trail_trigger: config.pos_trail_trigger || null,
        pos_trail_callback: config.pos_trail_callback || null,
      },
      indicators_def: lastIndicatorsDef,
      selected_bars: selectedBars,
    };

    const res = await fetch('/api/diagnose', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    showDiagPanel('result', data);
  } catch (err) {
    showDiagPanel('error', { message: err.toString() });
  }

  // Reset selection
  diagSelectStartBar = null;
  diagSelectEndBar = null;
  renderAllCharts();
}

// ── 诊断面板渲染 ──
function showDiagPanel(state, data) {
  const panel = document.getElementById('diagPanel');
  if (!panel) return;
  panel.style.display = 'flex';

  if (state === 'loading') {
    panel.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:12px;color:rgba(0,220,255,0.7);">
        <div style="width:32px;height:32px;border:2px solid rgba(0,220,255,0.3);border-top-color:#00dcff;border-radius:50%;animation:spin 0.9s linear infinite;"></div>
        <div style="font-size:0.72rem;">${isEN ? "AI is analyzing formula execution..." : "AI 正在分析 K 线数据和策略公式..."}</div>
      </div>
    `;
    return;
  }

  if (state === 'error') {
    panel.innerHTML = `
      <div style="padding:12px;color:rgba(255,100,100,0.8);font-size:0.72rem;">
        ❌ ${isEN ? "Diagnosis failed: " : "诊断请求失败："}${data?.message || 'Network error'}<br><br>
        <span style="color:rgba(255,255,255,0.3);">${isEN ? "Make sure backend server is active." : "请确认后端服务正常运行后重试。"}</span>
      </div>
    `;
    return;
  }

  // Render result
  const r = data;
  const suggestionsHtml = (r.suggestions || []).map((s, idx) => `
    <button onclick="applyDiagSuggestion(${idx})" data-suggestion="${encodeURIComponent(JSON.stringify(s))}"
      style="display:block;width:100%;text-align:left;background:rgba(0,80,100,0.25);border:1px solid rgba(0,200,255,0.2);
             border-radius:5px;color:rgba(0,210,255,0.85);padding:7px 9px;margin-bottom:5px;cursor:pointer;
             font-family:'Share Tech Mono',monospace;font-size:0.67rem;line-height:1.4; transition:background 0.2s;">
      <span style="color:#00ff88;margin-right:4px;">▷ ${idx+1}.</span> ${s.label}
      <div style="color:rgba(255,255,255,0.35);font-size:0.62rem;margin-top:3px;">${s.prompt_hint}</div>
    </button>
  `).join('');

  const traceHtml = (r.bar_traces || []).map(bt => `
    <div style="margin-bottom:8px;padding:7px 8px;background:rgba(255,255,255,0.02);border-radius:5px;border-left:2px solid rgba(0,200,255,0.3);">
      <div style="color:rgba(255,255,255,0.5);font-size:0.62rem;margin-bottom:4px;">📍 Bar #${bt.bar_index}  close=$${bt.close?.toFixed(2) || '?'}</div>
      ${Object.entries(bt.trace_first_entry || {}).map(([expr, val]) =>
        `<div style="font-size:0.62rem;color:${val===true?'#00ff88':val===false?'#ff5c5c':'#ffcc00'};">
           ${val===true?'✓':val===false?'✗':'?'} ${expr}
         </div>`
      ).join('')}
    </div>
  `).join('');

  panel.innerHTML = `
    <div style="display:flex;flex-direction:column;height:100%;overflow:hidden;">
      <!-- Header -->
      <div style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.05);
                  display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <div style="font-size:0.72rem;font-weight:700;color:rgba(0,220,255,0.9);display:flex;align-items:center;gap:5px;">
          <span style="width:6px;height:6px;background:#00dcff;border-radius:50%;box-shadow:0 0 5px #00dcff;display:inline-block;"></span>
          ${isEN ? "🔬 AI Strategy Diagnosis" : "🔬 AI 策略诊断报告"}
        </div>
        <button onclick="document.getElementById('diagPanel').style.display='none'"
          style="background:none;border:none;color:rgba(255,255,255,0.3);cursor:pointer;font-size:14px;padding:0 2px;">✕</button>
      </div>

      <!-- Scrollable body -->
      <div style="flex:1;overflow-y:auto;padding:10px 12px;">

        <!-- Conclusion -->
        <div style="background:rgba(255,80,80,0.07);border:1px solid rgba(255,100,100,0.2);border-radius:5px;
                    padding:8px 10px;margin-bottom:10px;font-size:0.7rem;line-height:1.5;color:rgba(255,200,200,0.9);">
          <div style="font-weight:700;color:#ff6680;margin-bottom:3px;">❌ ${isEN ? "Conclusion" : "诊断结论"}</div>
          ${r.conclusion || 'N/A'}
        </div>

        <!-- Explanation -->
        <div style="font-size:0.68rem;color:rgba(255,255,255,0.65);line-height:1.6;margin-bottom:10px;
                    padding:8px 10px;background:rgba(255,255,255,0.02);border-radius:5px;">
          <div style="font-weight:700;color:rgba(255,255,255,0.8);margin-bottom:4px;">💡 ${isEN ? "Root Cause Analysis" : "原因解析"}</div>
          ${r.explanation || 'N/A'}
        </div>

        <!-- Bar Traces -->
        ${traceHtml ? `
          <div style="font-size:0.65rem;color:rgba(255,255,255,0.4);margin-bottom:6px;font-weight:700;">📊 ${isEN ? "Per-Bar Evaluator" : "逐 Bar 条件求值"}</div>
          ${traceHtml}
        ` : ''}

        <!-- Suggestions -->
        ${suggestionsHtml ? `
          <div style="font-size:0.65rem;color:rgba(0,210,255,0.6);margin-bottom:6px;font-weight:700;">🔧 ${isEN ? "Prompt Suggestions (Click to Apply)" : "提示词优化建议（点击一键应用）"}</div>
          ${suggestionsHtml}
        ` : ''}

        <!-- Re-select -->
        <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.05);">
          <button onclick="activateDiagnoseMode()"
            style="width:100%;background:rgba(0,80,100,0.3);border:1px solid rgba(0,200,255,0.2);border-radius:4px;
                   color:rgba(0,200,255,0.6);padding:6px;font-size:0.65rem;cursor:pointer;font-family:'Share Tech Mono',monospace;">
            🔍 重新框选诊断其他区间
          </button>
        </div>
      </div>
    </div>
  `;
}

// 应用建议 → 将新提示词填入输入框并重跑
function applyDiagSuggestion(idx) {
  const btns = document.querySelectorAll('#diagPanel [data-suggestion]');
  if (!btns[idx]) return;
  const s = JSON.parse(decodeURIComponent(btns[idx].getAttribute('data-suggestion')));
  if (!s || !s.new_prompt) return;

  const ta = document.getElementById('strategyInput');
  if (ta) {
    ta.value = s.new_prompt;
    ta.style.border = '1px solid rgba(0,255,136,0.5)';
    setTimeout(() => { ta.style.border = ''; }, 1500);
  }

  // Auto-trigger backtest
  const btn = document.getElementById('btnRun');
  if (btn) btn.click();
}

// 激活/停用框选模式
function activateDiagnoseMode() {
  window.diagnoseModeActive = true;
  if (typeof window.resetChartPanDrag === 'function') window.resetChartPanDrag();
  diagSelectStartBar = null;
  diagSelectEndBar = null;

  // 自动暂停模拟回放，防止数据滚动冲突
  if (isPlaying) {
    isPlaying = false;
    const playBtn = document.getElementById('btnPlayPause');
    if (playBtn) {
      playBtn.textContent = '▶ 播放';
      playBtn.style.color = 'var(--green)';
      playBtn.style.borderColor = 'var(--green)';
      playBtn.style.background = 'rgba(0, 255, 136, 0.05)';
    }
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
  }

  const btn = document.getElementById('btnDiagnose');
  if (btn) {
    btn.style.background = 'rgba(0,180,255,0.15)';
    btn.style.borderColor = 'rgba(0,200,255,0.7)';
    btn.style.color = '#00dcff';
    btn.textContent = '🔍 框选中... (再次点击退出)';
    btn.onclick = deactivateDiagnoseMode;
  }

  const canvas = document.getElementById('candleChart');
  if (canvas) canvas.style.cursor = 'crosshair';
}

function deactivateDiagnoseMode() {
  window.diagnoseModeActive = false;
  if (typeof window.resetChartPanDrag === 'function') window.resetChartPanDrag();
  diagSelectStartBar = null;
  diagSelectEndBar = null;

  const btn = document.getElementById('btnDiagnose');
  if (btn) {
    btn.style.background = '';
    btn.style.borderColor = '';
    btn.style.color = '';
    btn.textContent = '🔍 框选诊断';
    btn.onclick = activateDiagnoseMode;
  }

  const canvas = document.getElementById('candleChart');
  if (canvas) canvas.style.cursor = 'crosshair';

  if (diagPopupEl) { diagPopupEl.remove(); diagPopupEl = null; }
  renderAllCharts();
}
