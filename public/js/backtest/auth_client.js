// auth_client.js — K线回测主页的原生 JS 会员面板及 PayPal 支付对接

(function () {
  // 全局共享状态
  window.diagnoseModeActive = false; // 用于与 ui.js/chart.js 联动
  let currentUser = null;
  let isRealUser = false;
  let selectedTier = "3_months";
  let paypalButtonRendered = null;

  const TIERS = {
    "1_month": { name: "1 Month VIP", nameZh: "1 个月 VIP 体验", price: 19.00, days: 30, desc: "短期体验与AI策略诊断" },
    "3_months": { name: "3 Months VIP", nameZh: "3 个月 黄金会员", price: 49.00, days: 90, desc: "热销推荐，回测诊断标配" },
    "12_months": { name: "12 Months VIP", nameZh: "12 个月 至尊会员", price: 129.00, days: 365, desc: "超值年费，策略无限制演习" }
  };

  const isEN = window.location.pathname.includes('/en/');
  const isZh = !isEN;

  // 1. 在页面加载时初始化会籍卡片和弹窗 DOM
  window.addEventListener("load", () => {
    injectAccountCardContainer();
    injectModalDOMs();
    refreshSession();
  });

  // 在侧边栏标题下方插入用户会籍账户卡片容器
  function injectAccountCardContainer() {
    // 如果页面已经包含 id=saasAccountCard（例如 trade.html/backtest.html 的静态模板），不要重复插入
    if (document.getElementById("saasAccountCard")) return;

    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;
    const brand = sidebar.querySelector(".brand-title");
    if (!brand) return;

    const card = document.createElement("div");
    card.id = "saasAccountCard";
    card.style.cssText = `
      margin: 8px 0 16px 0;
      padding: 12px;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.02);
      font-family: 'Share Tech Mono', monospace;
      font-size: 0.72rem;
    `;
    brand.after(card);
  }

  // 动态向 body 追加登录/注册和定价弹窗 HTML 结构与样式
  function injectModalDOMs() {
    const style = document.createElement("style");
    style.innerHTML = `
      .saas-overlay {
        position: fixed; inset: 0; z-index: 10000;
        display: flex; align-items: center; justify-content: center;
        background: rgba(4, 7, 12, 0.8); backdrop-filter: blur(10px);
        font-family: 'Share Tech Mono', monospace;
        color: #fff;
      }
      .saas-modal {
        background: linear-gradient(135deg, #0d1117 0%, #111722 100%);
        border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
        padding: 24px; width: 100%; max-width: 420px; box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        position: relative; animation: saasFadeIn 0.25s ease;
      }
      @keyframes saasFadeIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      .saas-input {
        width: 100%; box-sizing: border-box; background: #060b12; border: 1px solid rgba(255,255,255,0.1);
        border-radius: 6px; color: #fff; padding: 9px 12px; font-family: inherit; font-size: 0.72rem;
        outline: none; margin-bottom: 12px; transition: border-color 0.2s;
      }
      .saas-input:focus { border-color: #00ff88; }
      .saas-btn {
        width: 100%; border: none; padding: 10px; border-radius: 6px; font-weight: bold;
        font-family: inherit; font-size: 0.72rem; cursor: pointer; transition: filter 0.2s;
      }
      .saas-btn-primary { background: linear-gradient(90deg, #9333ea, #059669); color: #fff; }
      .saas-btn-primary:hover { filter: brightness(1.15); }
      .saas-tier-btn {
        width: 100%; text-align: left; padding: 12px; border: 1px solid rgba(255,255,255,0.08);
        border-radius: 8px; background: rgba(255,255,255,0.02); color: #fff; font-family: inherit;
        cursor: pointer; display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;
      }
      .saas-tier-active { border-color: #00ff88; background: rgba(0,255,136,0.05); }
    `;
    document.head.appendChild(style);

    // 1. Auth Modal Overlay
    const authOverlay = document.createElement("div");
    authOverlay.id = "saasAuthOverlay";
    authOverlay.className = "saas-overlay";
    authOverlay.style.display = "none";
    authOverlay.innerHTML = `
      <div class="saas-modal">
        <button onclick="closeAuthModal()" style="position:absolute; right:16px; top:16px; background:none; border:none; color:rgba(255,255,255,0.4); cursor:pointer; font-size:16px;">✕</button>
        <h3 id="authModalTitle" style="margin-top:0; margin-bottom:6px; font-size:0.85rem; color:#00ff88;">登录 VIBCODING 账户</h3>
        <p id="authModalDesc" style="font-size:0.62rem; color:rgba(255,255,255,0.4); margin-bottom:16px; line-height:1.4;">登录您的真实邮箱以激活支付和会籍</p>
        
        <div id="authErrorMsg" style="display:none; padding:8px; border:1px solid rgba(255,50,50,0.3); background:rgba(255,50,50,0.05); color:#ff6b6b; font-size:0.65rem; border-radius:5px; margin-bottom:12px;"></div>

        <form id="authForm" onsubmit="handleAuthSubmit(event)">
          <div id="usernameInputGroup" style="display:none;">
            <label style="display:block; font-size:0.6rem; color:rgba(255,255,255,0.5); margin-bottom:4px; font-weight:bold;">用户名 (Username)</label>
            <input type="text" id="authUsername" class="saas-input" placeholder="起一个酷炫的用户名">
          </div>
          <div>
            <label style="display:block; font-size:0.6rem; color:rgba(255,255,255,0.5); margin-bottom:4px; font-weight:bold;">电子邮箱 (Email)</label>
            <input type="email" id="authEmail" class="saas-input" placeholder="e.g. Satoshi_Quant@mail.com" required>
          </div>
          <div>
            <label style="display:block; font-size:0.6rem; color:rgba(255,255,255,0.5); margin-bottom:4px; font-weight:bold;">登录密码 (Password)</label>
            <input type="password" id="authPassword" class="saas-input" placeholder="••••••••" required>
          </div>
          <button type="submit" id="authSubmitBtn" class="saas-btn saas-btn-primary" style="margin-top:8px;">立即登录 ⚡</button>
        </form>
        
        <div style="margin-top:16px; text-align:center; font-size:0.65rem;">
          <span id="authSwitchText" style="color:rgba(255,255,255,0.4);">还没有账号？</span>
          <button onclick="toggleAuthMode()" id="authSwitchBtn" style="background:none; border:none; color:#00e5ff; font-weight:bold; cursor:pointer; font-family:inherit;">现在注册</button>
        </div>
      </div>
    `;
    document.body.appendChild(authOverlay);

    // 2. Pricing Modal Overlay
    const pricingOverlay = document.createElement("div");
    pricingOverlay.id = "saasPricingOverlay";
    pricingOverlay.className = "saas-overlay";
    pricingOverlay.style.display = "none";
    pricingOverlay.innerHTML = `
      <div class="saas-modal" style="max-width: 460px; display:flex; flex-direction:column; gap:16px;">
        <button onclick="closePricingModal()" style="position:absolute; right:16px; top:16px; background:none; border:none; color:rgba(255,255,255,0.4); cursor:pointer; font-size:16px; z-index:20;">✕</button>
        
        <div>
          <h3 style="margin-top:0; margin-bottom:4px; font-size:0.85rem; color:#ffd600; display:flex; align-items:center; gap:6px;">
            👑 升级 VIBCODING VIP 会员
          </h3>
          <p style="font-size:0.62rem; color:rgba(255,255,255,0.4); margin:0; line-height:1.45;">
            ${isEN ? "Unlock unlimited access and precision AI diagnostics." : "购买一次性充值包（不自动续费），解锁全部限制，畅享 AI 策略诊断功能。"}
          </p>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px;">
          ${Object.entries(TIERS).map(([key, t]) => `
            <button id="tier_${key}" onclick="selectPricingTier('${key}')" class="saas-tier-btn ${selectedTier === key ? 'saas-tier-active' : ''}">
              <div style="text-align:left;">
                <div style="font-size:0.7rem; font-weight:bold;">${isEN ? t.name : t.nameZh}</div>
                <div style="font-size:0.58rem; color:rgba(255,255,255,0.4); margin-top:2px;">${t.desc}</div>
              </div>
              <div style="text-align:right;">
                <div style="font-size:0.75rem; font-weight:bold; color:#00ff88;">$${t.price}</div>
                <div style="font-size:0.55rem; color:rgba(255,255,255,0.3);">USD</div>
              </div>
            </button>
          `).join('')}
        </div>

        <div id="pricingErrorMsg" style="display:none; padding:8px; border:1px solid rgba(255,50,50,0.3); background:rgba(255,50,50,0.05); color:#ff6b6b; font-size:0.65rem; border-radius:5px;"></div>
        <div id="pricingStatusMsg" style="display:none; text-align:center; font-size:0.65rem; color:rgba(255,255,255,0.5);"></div>

        <div style="position:relative; width:100%; min-height:50px;">
          <div id="paypal-button-container-html" style="width:100%;"></div>
        </div>

        <div style="text-align:center; font-size:0.58rem; color:rgba(255,255,255,0.3);">
          ${isEN ? "Protected by PayPal. One-time payment, no auto-renewal." : "支付受 PayPal 安全保护。一次性付费，到期不会自动划扣续费。"}
        </div>
      </div>
    `;
    document.body.appendChild(pricingOverlay);
  }

  // 3. 获取并同步用户会籍会话
  async function refreshSession() {
    try {
      const res = await fetch("/api/auth/session");
      if (res.ok) {
        const data = await res.json();
        if (data.loggedIn && data.user) {
          currentUser = data.user;
          isRealUser = true;
          renderAccountCard();
          return;
        }
      }
    } catch (e) {
      console.error("Session sync failed", e);
    }
    currentUser = null;
    isRealUser = false;
    renderAccountCard();
  }
  window.refreshSession = refreshSession; // 暴露全局

  // 4. 渲染侧边栏会籍卡片
  function renderAccountCard() {
    const card = document.getElementById("saasAccountCard");
    if (!card) return;

      // elements that may exist in the static template (trade/backtest) and should be synchronised
      const profileNameEl = document.getElementById("profileName");
      const profileAvatarEl = document.getElementById("profileAvatar");
      const vipBadgeEl = document.getElementById("vipBadge");
      const profileBalanceEl = document.getElementById("profileBalance");

      if (isRealUser && currentUser) {
        const isVIP = currentUser.vipTier === "VIP";
        const expStr = currentUser.vipExpiresAt ? new Date(currentUser.vipExpiresAt).toISOString().split("T")[0] : "";

        if (isVIP) {
          card.style.border = "1px solid rgba(255, 214, 0, 0.45)";
          card.style.boxShadow = "0 0 16px rgba(255, 214, 0, 0.22), inset 0 0 10px rgba(255, 214, 0, 0.06)";
          card.style.background = "linear-gradient(135deg, rgba(28, 22, 6, 0.8) 0%, rgba(14, 11, 3, 0.95) 100%)";
        } else {
          card.style.border = "1px solid rgba(255, 255, 255, 0.1)";
          card.style.boxShadow = "0 4px 15px rgba(0, 0, 0, 0.4), inset 0 0 6px rgba(255, 255, 255, 0.02)";
          card.style.background = "linear-gradient(135deg, rgba(15, 23, 42, 0.5) 0%, rgba(8, 12, 21, 0.7) 100%)";
        }

        // keep the existing card markup but update values; many pages already render profile card in HTML
        const usernameSafe = (currentUser.username || "guest");
        const avatarUrl = currentUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(usernameSafe)}`;
        const balanceText = currentUser.balance ? `${currentUser.balance} VC` : (profileBalanceEl ? profileBalanceEl.textContent : "0 VC");

        // If the page provides static profile elements (trade/backtest), update them in-place and keep the original layout
        if (profileNameEl) {
          try {
            profileNameEl.textContent = usernameSafe;
            if (profileAvatarEl) profileAvatarEl.src = avatarUrl;
            if (profileBalanceEl) profileBalanceEl.textContent = balanceText;
            if (vipBadgeEl) {
              vipBadgeEl.textContent = isVIP ? 'VIP GOLD' : '';
              vipBadgeEl.style.display = isVIP ? '' : 'none';
            }
            // Keep card container styles (border/background) already set above
          } catch (e) {
            // ignore DOM errors
          }
        } else {
          // fallback for pages without the static template (demo.html etc.) — render full inline card
          card.innerHTML = `
            <div class="profile-avatar-ring" aria-hidden="true">
            <img class="profile-avatar" id="profileAvatar" src="${avatarUrl}" alt="Avatar" />
          </div>
          <div class="vip-gold-pill" id="vipBadge">${isVIP ? 'VIP GOLD' : ''}</div>
          <div class="profile-name" id="profileName">${usernameSafe}</div>
          <div class="profile-balance">
            <span class="coin-stack" aria-hidden="true">🪙</span>
            <span class="vc" id="profileBalance">${balanceText}</span>
          </div>
          `;
        }

      } else {
        card.style.border = "1px solid rgba(0, 229, 255, 0.22)";
        card.style.boxShadow = "0 0 12px rgba(0, 229, 255, 0.08), 0 4px 15px rgba(0, 0, 0, 0.4)";
        card.style.background = "linear-gradient(135deg, rgba(10, 18, 30, 0.5) 0%, rgba(5, 9, 16, 0.75) 100%)";
        card.innerHTML = `
          <div style="color:rgba(255,255,255,0.4); font-size:0.62rem; margin-bottom:6px; text-align:center;">👤 未登录真实账户</div>
          <div style="display:flex; gap:4px;">
            <button onclick="openAuthModal()" style="flex:1; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:#fff; border-radius:4px; padding:4px 0; cursor:pointer; font-family:inherit; font-size:0.62rem;">
              🔑 登录账户
            </button>
            <button onclick="openPricingModal()" style="flex:1; background:rgba(0,255,136,0.1); border:1px solid rgba(0,255,136,0.3); color:#00ff88; border-radius:4px; padding:4px 0; font-weight:bold; cursor:pointer; font-family:inherit; font-size:0.62rem;">
              👑 升级 VIP
            </button>
          </div>
        `;

        // ensure static profile area shows guest/defaults when not logged in
        try {
          if (profileNameEl) profileNameEl.textContent = 'guest';
          if (profileAvatarEl) profileAvatarEl.src = `https://api.dicebear.com/7.x/bottts/svg?seed=guest`;
          if (vipBadgeEl) vipBadgeEl.textContent = '';
          if (profileBalanceEl) profileBalanceEl.textContent = '0 VC';
        } catch (e) {}
      }
    }

  // 5. 模态框打开与关闭控制
  window.openAuthModal = () => {
    document.getElementById("saasAuthOverlay").style.display = "flex";
    document.getElementById("saasPricingOverlay").style.display = "none";
  };
  window.closeAuthModal = () => {
    document.getElementById("saasAuthOverlay").style.display = "none";
  };

  window.openPricingModal = () => {
    document.getElementById("saasPricingOverlay").style.display = "flex";
    document.getElementById("saasAuthOverlay").style.display = "none";
    initPaypalSDK();
  };
  window.closePricingModal = () => {
    document.getElementById("saasPricingOverlay").style.display = "none";
  };

  // 6. 注册与登录模式切换
  let isLoginView = true;
  window.toggleAuthMode = () => {
    isLoginView = !isLoginView;
    const title = document.getElementById("authModalTitle");
    const desc = document.getElementById("authModalDesc");
    const submitBtn = document.getElementById("authSubmitBtn");
    const switchBtn = document.getElementById("authSwitchBtn");
    const switchTxt = document.getElementById("authSwitchText");
    const userGroup = document.getElementById("usernameInputGroup");

    document.getElementById("authErrorMsg").style.display = "none";

    if (isLoginView) {
      title.textContent = isZh ? "登录 VIBCODING 账户" : "Log In to VIBCODING";
      desc.textContent = isZh ? "登录您的真实邮箱以激活支付和会籍" : "Log in with your real email to access VIP features";
      submitBtn.textContent = isZh ? "立即登录 ⚡" : "Log In ⚡";
      switchBtn.textContent = isZh ? "现在注册" : "Sign Up now";
      switchTxt.textContent = isZh ? "还没有账号？" : "Don't have an account? ";
      userGroup.style.display = "none";
    } else {
      title.textContent = isZh ? "创建 VIBCODING 账户" : "Create Account";
      desc.textContent = isZh ? "注册一个专属账户，开始升级 VIP 体验" : "Sign up to unlock strategy trace and unlimited backtests";
      submitBtn.textContent = isZh ? "立即注册 🚀" : "Register 🚀";
      switchBtn.textContent = isZh ? "现在登录" : "Log In";
      switchTxt.textContent = isZh ? "已经有账号了？" : "Already have an account? ";
      userGroup.style.display = "block";
    }
  };

  // 7. 处理注册/登录提交
  window.handleAuthSubmit = async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("authErrorMsg");
    const submitBtn = document.getElementById("authSubmitBtn");
    
    errorEl.style.display = "none";
    submitBtn.disabled = true;
    submitBtn.textContent = isZh ? "请稍候..." : "Loading...";

    const email = document.getElementById("authEmail").value.trim();
    const password = document.getElementById("authPassword").value;
    const username = document.getElementById("authUsername").value.trim();

    const endpoint = isLoginView ? "/api/auth/login" : "/api/auth/register";
    const body = isLoginView ? { email, password } : { email, password, username };

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Request failed");

      if (data.success && data.user) {
        currentUser = data.user;
        isRealUser = true;
        renderAccountCard();
        closeAuthModal();
      }
    } catch (err) {
      errorEl.textContent = err.message;
      errorEl.style.display = "block";
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = isLoginView 
        ? (isZh ? "立即登录 ⚡" : "Log In ⚡") 
        : (isZh ? "立即注册 🚀" : "Register 🚀");
    }
  };

  // 8. 处理退出登录
  window.handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (_) {}
    currentUser = null;
    isRealUser = false;
    renderAccountCard();
  };

  // 9. 定价包选择
  window.selectPricingTier = (key) => {
    selectedTier = key;
    document.querySelectorAll(".saas-tier-btn").forEach(btn => btn.classList.remove("saas-tier-active"));
    document.getElementById(`tier_${key}`).classList.add("saas-tier-active");
    
    document.getElementById("pricingErrorMsg").style.display = "none";
    document.getElementById("pricingStatusMsg").style.display = "none";
    
    renderPaypalButtons();
  };

  // 10. 异步加载并初始化 PayPal SDK
  let sdkScriptLoaded = false;
  async function initPaypalSDK() {
    if (sdkScriptLoaded) {
      renderPaypalButtons();
      return;
    }

    const scriptId = "paypal-sdk-jssdk-html";
    
    if (document.getElementById(scriptId)) {
      sdkScriptLoaded = true;
      renderPaypalButtons();
      return;
    }

    try {
      const res = await fetch("/api/payments/paypal/client-id");
      const data = await res.json();
      if (!res.ok || !data.clientId) {
        throw new Error(data.error || "Failed to retrieve Client ID");
      }

      const script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://www.paypal.com/sdk/js?client-id=${data.clientId}&currency=USD`;
      script.async = true;
      script.addEventListener("load", () => {
        sdkScriptLoaded = true;
        renderPaypalButtons();
      });
      document.body.appendChild(script);
    } catch (err) {
      const errEl = document.getElementById("pricingErrorMsg");
      errEl.textContent = isZh ? "加载支付组件失败，请联系客服" : "Failed to load payment gateway.";
      errEl.style.display = "block";
    }
  }

  // 11. 渲染 PayPal SDK 智能按钮
  function renderPaypalButtons() {
    if (!sdkScriptLoaded) return;
    const container = document.getElementById("paypal-button-container-html");
    if (!container) return;

    if (paypalButtonRendered === selectedTier) return;
    container.innerHTML = "";
    paypalButtonRendered = selectedTier;

    if (!window.paypal) return;

    window.paypal.Buttons({
      style: {
        layout: "vertical",
        color: "gold",
        shape: "rect",
        label: "pay",
      },
      createOrder: async () => {
        if (!isRealUser) {
          const errEl = document.getElementById("pricingErrorMsg");
          errEl.textContent = isZh ? "需登录真实账户才能进行购买！" : "Please log in to a real account first!";
          errEl.style.display = "block";
          openAuthModal();
          return "";
        }

        const statusEl = document.getElementById("pricingStatusMsg");
        statusEl.textContent = isZh ? "正在向 PayPal 发起订单请求..." : "Creating order on PayPal...";
        statusEl.style.display = "block";
        document.getElementById("pricingErrorMsg").style.display = "none";

        try {
          const res = await fetch("/api/payments/paypal/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ tier: selectedTier }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to create order");
          
          statusEl.style.display = "none";
          return data.orderId;
        } catch (err) {
          statusEl.style.display = "none";
          const errEl = document.getElementById("pricingErrorMsg");
          errEl.textContent = err.message || "Failed to initiate PayPal Checkout";
          errEl.style.display = "block";
          return "";
        }
      },
      onApprove: async (data) => {
        const statusEl = document.getElementById("pricingStatusMsg");
        statusEl.textContent = isZh ? "付款确认中，正在激活您的 VIP 会籍..." : "Payment success! Capturing subscription...";
        statusEl.style.display = "block";
        document.getElementById("pricingErrorMsg").style.display = "none";

        try {
          const res = await fetch("/api/payments/paypal/capture", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.orderID, tier: selectedTier }),
          });
          const result = await res.json();
          if (!res.ok) throw new Error(result.error || "Capture verification failed");

          statusEl.innerHTML = `<span style="color:#00ff88; font-weight:bold;">👑 VIP 会员激活成功！已生效。</span>`;
          await refreshSession(); // 同步状态
          setTimeout(() => {
            closePricingModal();
          }, 2000);
        } catch (err) {
          statusEl.style.display = "none";
          const errEl = document.getElementById("pricingErrorMsg");
          errEl.textContent = err.message || "Payment verification failed.";
          errEl.style.display = "block";
        }
      },
      onError: (err) => {
        const errEl = document.getElementById("pricingErrorMsg");
        errEl.textContent = isZh ? "付款在 PayPal 端被取消或遇到阻碍" : "Payment failed on PayPal end.";
        errEl.style.display = "block";
        document.getElementById("pricingStatusMsg").style.display = "none";
      }
    }).render("#paypal-button-container-html");
  }
})();
