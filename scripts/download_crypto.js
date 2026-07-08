/**
 * scripts/download_crypto.js
 * 
 * 自动从 Binance API 下载高频 M1 (1分钟) K线数据，并转化为 MT5 兼容的 CSV 格式，
 * 保存至 D:/supercfg/cache_1m/ 目录下，方便手动训练器和回测引擎加载使用。
 * 
 * 使用方式：
 * node scripts/download_crypto.js [Symbol] [Date YYYY_MM_DD]
 * 示例：
 * node scripts/download_crypto.js BTCUSD 2026_03_11
 * node scripts/download_crypto.js ETHUSD 2026_03_11
 */

const fs = require('fs');
const path = require('path');

// 映射外部符号到币安交易对
const SYMBOL_MAP = {
  'BTCUSD': 'BTCUSDT',
  'ETHUSD': 'ETHUSDT',
  'BTC': 'BTCUSDT',
  'ETH': 'ETHUSDT'
};

async function downloadKline(symbol, dateStr) {
  const normalizedSymbol = symbol.toUpperCase();
  const binanceSymbol = SYMBOL_MAP[normalizedSymbol] || SYMBOL_MAP[normalizedSymbol + 'USD'] || 'BTCUSDT';
  
  // 解析日期 YYYY_MM_DD 为当天零点和午夜的时间戳
  const dateParts = dateStr.split('_');
  if (dateParts.length !== 3) {
    console.error('❌ 日期格式不正确，必须为 YYYY_MM_DD。例如: 2026_03_11');
    process.exit(1);
  }
  
  const year = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]) - 1;
  const day = parseInt(dateParts[2]);
  
  const startTime = new Date(Date.UTC(year, month, day, 0, 0, 0)).getTime();
  const endTime = new Date(Date.UTC(year, month, day, 23, 59, 59)).getTime();
  
  console.log(`📡 正在从 Binance 获取 ${binanceSymbol} 行情，日期: ${dateStr}...`);
  
  // Binance 限制单次请求最大 1000 根线。一天 1440 根，我们分两次获取
  const limit = 1000;
  let allKlines = [];
  
  try {
    // 第一次请求: 00:00:00 -> 16:39:00
    const url1 = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=1m&startTime=${startTime}&limit=${limit}`;
    const res1 = await fetch(url1);
    if (!res1.ok) throw new Error(`Binance HTTP error ${res1.status}`);
    const data1 = await res1.json();
    allKlines = allKlines.concat(data1);
    
    // 如果有返回，从最后一条数据时间戳后一分钟继续请求
    if (data1.length > 0) {
      const nextStart = data1[data1.length - 1][0] + 60000;
      const url2 = `https://api.binance.com/api/v3/klines?symbol=${binanceSymbol}&interval=1m&startTime=${nextStart}&limit=${limit}`;
      const res2 = await fetch(url2);
      if (res2.ok) {
        const data2 = await res2.json();
        allKlines = allKlines.concat(data2);
      }
    }
    
    if (allKlines.length === 0) {
      console.error('❌ 未获取到任何行情数据，可能该日期无交易或超出币安历史范围。');
      return;
    }
    
    // 转化为 MT5 CSV 格式
    // 字段: DateTime,Open,High,Low,Close,Spread,Ticks
    let csvRows = ['DateTime,Open,High,Low,Close,Spread,Ticks'];
    
    for (const k of allKlines) {
      const ms = k[0];
      const d = new Date(ms);
      
      // 格式化 DateTime: YYYY-MM-DD HH:MM:SS (北京时间/UTC根据需要，这里生成本地标准时间)
      const pad = (n) => String(n).padStart(2, '0');
      const formattedDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
      
      const open = parseFloat(k[1]).toFixed(2);
      const high = parseFloat(k[2]).toFixed(2);
      const low = parseFloat(k[3]).toFixed(2);
      const close = parseFloat(k[4]).toFixed(2);
      const spread = "0.50";
      const ticks = "60";
      
      csvRows.push(`${formattedDate},${open},${high},${low},${close},${spread},${ticks}`);
    }
    
    // 确保本地目录存在
    const targetDir = `D:/supercfg/cache_1m/${year}`;
    fs.mkdirSync(targetDir, { recursive: true });
    
    const outputFilename = `${normalizedSymbol}_${dateStr}.csv`;
    const outputPath = path.join(targetDir, outputFilename);
    
    fs.writeFileSync(outputPath, csvRows.join('\n'), 'utf-8');
    console.log(`✅ 成功保存至: ${outputPath} (共 ${allKlines.length} 根分钟K线)`);
    
  } catch (err) {
    console.error('❌ 下载失败:', err.message);
  }
}

// 接收命令行参数
const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('💡 示例用法: node scripts/download_crypto.js BTCUSD 2026_03_11');
  process.exit(0);
}

downloadKline(args[0], args[1]);
