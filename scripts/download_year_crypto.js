/**
 * scripts/download_year_crypto.js
 * 
 * 批量下载 BTCUSDT 和 ETHUSDT 过去一整年的 1分钟 (M1) K线数据，
 * 转化为 MT5 兼容的 CSV 格式，并以日为单位切分，保存到 D:/supercfg/cache_1m/[Year]/ 目录下。
 */

const fs = require('fs');
const path = require('path');

// 辅助睡眠函数，防止触发币安频控
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 获取过去一年的所有日期数组 (YYYY_MM_DD)
function getPastYearDates() {
  const dates = [];
  const today = new Date();
  
  // 过去365天
  for (let i = 365; i >= 1; i--) {
    const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    dates.push({
      year: yr,
      dateStr: `${yr}_${mo}_${dy}`,
      timestampStart: Date.UTC(yr, d.getMonth(), d.getDate(), 0, 0, 0),
      timestampEnd: Date.UTC(yr, d.getMonth(), d.getDate(), 23, 59, 59)
    });
  }
  return dates;
}

async function downloadDayKlines(binanceSymbol, outputSymbol, dateObj) {
  const targetDir = `D:/supercfg/cache_1m/${dateObj.year}`;
  const outputFilename = `${outputSymbol}_${dateObj.dateStr}.csv`;
  const outputPath = path.join(targetDir, outputFilename);

  // 1. 如果本地文件已经下载过，跳过，避免重复工作和浪费频控
  if (fs.existsSync(outputPath)) {
    console.log(`⏭️  ${outputFilename} 已存在，跳过。`);
    return true;
  }

  fs.mkdirSync(targetDir, { recursive: true });

  const limit = 1000;
  let klines = [];

  try {
    // 第一次获取：从 00:00:00 开始
    const url1 = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=1m&startTime=${dateObj.timestampStart}&limit=${limit}`;
    const res1 = await fetch(url1);
    if (!res1.ok) {
      if (res1.status === 429 || res1.status === 418) {
        console.warn(`⚠️ 遇到币安频控限制 (HTTP ${res1.status})，睡眠 10 秒...`);
        await sleep(10000);
        return false; // 重试
      }
      throw new Error(`HTTP Error ${res1.status}`);
    }
    const data1 = await res1.json();
    klines = klines.concat(data1);

    // 第二次获取：从上一条K线后一分钟开始，补全全天 1440 根
    if (data1.length > 0) {
      const nextStart = data1[data1.length - 1][0] + 60000;
      if (nextStart < dateObj.timestampEnd) {
        const url2 = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=1m&startTime=${nextStart}&limit=${limit}`;
        const res2 = await fetch(url2);
        if (res2.ok) {
          const data2 = await res2.json();
          klines = klines.concat(data2);
        }
      }
    }

    if (klines.length === 0) {
      console.log(`⚠️ ${outputFilename} 行情为空，可能是无交易日`);
      return true;
    }

    // 格式化输出为 MT5 规格 CSV
    const csvRows = ['DateTime,Open,High,Low,Close,Spread,Ticks'];
    const pad = (n) => String(n).padStart(2, '0');

    for (const k of klines) {
      const d = new Date(k[0]);
      const formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      
      const open = parseFloat(k[1]).toFixed(2);
      const high = parseFloat(k[2]).toFixed(2);
      const low = parseFloat(k[3]).toFixed(2);
      const close = parseFloat(k[4]).toFixed(2);
      const spread = "0.50";
      const ticks = "60";

      csvRows.push(`${formattedDate},${open},${high},${low},${close},${spread},${ticks}`);
    }

    fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf-8');
    console.log(`✅ 已下载并保存: ${outputFilename} (${klines.length} 根蜡烛)`);
    return true;

  } catch (err) {
    console.error(`❌ 下载 ${outputFilename} 失败:`, err.message);
    return false; // 失败重试
  }
}

async function startBatchDownload() {
  const dates = getPastYearDates();
  console.log(`🚀 开始下载过去 365 天的历史行情，共需下载 ${dates.length * 2} 个文件...`);

  const symbols = [
    { binance: 'BTCUSDT', output: 'BTCUSD' },
    { binance: 'ETHUSDT', output: 'ETHUSD' }
  ];

  // 顺序循环下载以防止触发 IP 频控限制，每次请求间隔 80ms
  for (const sym of symbols) {
    console.log(`\n--------------------------------------------------`);
    console.log(`🪙 正在处理品种: ${sym.output} (${sym.binance})`);
    console.log(`--------------------------------------------------`);
    
    let i = 0;
    while (i < dates.length) {
      const success = await downloadDayKlines(sym.binance, sym.output, dates[i]);
      if (success) {
        i++;
        await sleep(100); // 间隔 100ms 保护频控
      } else {
        console.log('🔄 3 秒后重试上一任务...');
        await sleep(3000);
      }
    }
  }

  console.log('\n🎉 所有历史行情下载完成！');
}

startBatchDownload();
