# Degen Arena - Free Stock & Crypto Market Replay Simulator

Degen Arena (交易员飞行模拟器) is a lightweight, responsive, and highly gamified trading backtest and replay simulator. It allows users to practice day trading, swing trading, and risk management against historical price action scenarios (such as the Crypto Bull Run, COVID crash, or Gold Breakout) with zero risk.

## 🚀 Quick Start

Since the project is built with vanilla HTML5, CSS3, and JavaScript, it requires **zero installation** and has **no build steps**.

To run it locally:
1. Open the folder.
2. Double-click [index.html](file:///d:/webvibc/index.html) to open it directly in any web browser (Chrome, Safari, Edge, Firefox).

Alternatively, you can run a local development server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .
```
Then navigate to `http://localhost:8000` or `http://localhost:3000`.

## 📦 Tech Stack

- **Charting Engine**: TradingView's official [Lightweight Charts](https://github.com/tradingview/lightweight-charts) (CDN).
- **Styling**: Modern dark mode with CSS variables, custom glassmorphism panels, and responsive grid layouts.
- **Audio synthesis**: Web Audio API (real-time synthesizers generating retro C5-E5 coin and buzzer sounds; no external MP3 dependencies).
- **Mock Data Engine**: Dynamic mathematical price generators creating realistic trending, panic-selling, and breakout scenarios.

## 📈 SEO & Growth Strategy

The page is pre-configured with SEO meta tags targeting high-intent trading simulation search phrases in both Chinese and English:

- **Primary Keywords**: `模拟炒股`, `模拟股票`, `模拟市场`, `K线回放`, `复盘工具`, `stock market simulator`, `trading replay`, `backtesting`, `paper trading`.
- **Target Audience**: Retail traders, crypto degens, and finance novices looking to practice without risking capital.
- **Viral Mechanics**: Interactive scorecard summary displayed at the end of each run encourages users to screenshot and share their "Degen Rank" and returns on social media (Twitter/X, Xiaohongshu).

## 🛠️ Deploy to Production

You can host this website globally for free in less than 10 seconds:
- **Vercel / Netlify**: Simply drag and drop this project folder into the Vercel or Netlify dashboard.
- **GitHub Pages**: Push this directory to a GitHub repository, enable GitHub Pages in settings, and it's live!
