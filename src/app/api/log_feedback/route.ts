import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    
    const logEntry = {
      timestamp: new Date().toISOString(),
      original_prompt: payload.original_prompt || "",
      compiled_config: payload.compiled_config || {},
      developer_feedback: payload.developer_feedback || "",
      error: payload.error || "",
      backtest_result: payload.backtest_result || null
    };

    const logDir = path.join(process.cwd(), "public/data");
    fs.mkdirSync(logDir, { recursive: true });
    
    const logPath = path.join(logDir, "feedback_logs.jsonl");
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + "\n", "utf-8");

    return NextResponse.json({ status: "success", message: "Feedback log appended successfully" });
  } catch (error: any) {
    console.error("Telemetry feedback logging failed:", error);
    return NextResponse.json({ status: "error", message: error.message || error }, { status: 500 });
  }
}
