// route.ts — 本地 CSV 历史数据读取 API (XAUUSD 1分钟线)
import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  // 获取交易品种参数，默认为 XAUUSD，并清洗非法字符
  let symbol = (searchParams.get("symbol") || "XAUUSD").trim().toUpperCase().replace(/[^A-Z0-9_]/g, "");
  
  // 获取起止日期参数 (格式: YYYY_MM_DD 或 YYYY-MM-DD)
  let startStr = (searchParams.get("start") || "2026_03_11").trim().replace(/-/g, "_");
  let endStr = (searchParams.get("end") || startStr).trim().replace(/-/g, "_");

  // 安全限制：最多读取 5 天的数据以防止内存溢出
  let startDate: Date;
  let endDate: Date;
  try {
    const parseDate = (s: string) => {
      const parts = s.split("_");
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    };
    startDate = parseDate(startStr);
    endDate = parseDate(endStr);
  } catch (e) {
    startDate = new Date(2026, 2, 11); // 2026_03_11
    endDate = new Date(2026, 2, 11);
  }

  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays > 5) {
    // 强制截断到 5 天
    endDate = new Date(startDate.getTime() + 4 * 24 * 60 * 60 * 1000);
  }

  const candles: Array<{ open: number; high: number; low: number; close: number; time: number }> = [];
  let globalIdx = 0;

  try {
    let currDate = new Date(startDate);
    while (currDate <= endDate) {
      const yr = currDate.getFullYear();
      const mo = String(currDate.getMonth() + 1).padStart(2, '0');
      const dy = String(currDate.getDate()).padStart(2, '0');
      const dateStr = `${yr}_${mo}_${dy}`;
      
      const filePath = `D:/supercfg/cache_1m/2026/${symbol}_${dateStr}.csv`;
      
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, "utf-8");
        const lines = fileContent.split(/\r?\n/);
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const cols = line.split(",");
          if (cols.length >= 5) {
            const open = parseFloat(cols[1]);
            const high = parseFloat(cols[2]);
            const low = parseFloat(cols[3]);
            const close = parseFloat(cols[4]);
            
            if (!isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close)) {
              candles.push({ open, high, low, close, time: globalIdx++ });
            }
          }
        }
      }
      currDate.setDate(currDate.getDate() + 1);
    }

    // 如果未读取到任何数据，退回默认的 2026_03_11 备份
    if (candles.length === 0) {
      let fallbackPath = `D:/supercfg/cache_1m/2026/${symbol}_2026_03_11.csv`;
      if (!fs.existsSync(fallbackPath)) {
        fallbackPath = "D:/supercfg/cache_1m/2026/XAUUSD_2026_03_11.csv";
      }
      if (fs.existsSync(fallbackPath)) {
        const fileContent = fs.readFileSync(fallbackPath, "utf-8");
        const lines = fileContent.split(/\r?\n/);
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const cols = line.split(",");
          if (cols.length >= 5) {
            const open = parseFloat(cols[1]);
            const high = parseFloat(cols[2]);
            const low = parseFloat(cols[3]);
            const close = parseFloat(cols[4]);
            
            if (!isNaN(open) && !isNaN(high) && !isNaN(low) && !isNaN(close)) {
              candles.push({ open, high, low, close, time: globalIdx++ });
            }
          }
        }
      }
    }

    return NextResponse.json({
      start: startStr,
      end: endStr,
      candles
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
