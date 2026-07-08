// route.ts — 安全获取 PayPal 公开 Client ID API
import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "PayPal Client ID not configured on server" }, { status: 500 });
  }
  return NextResponse.json({ clientId });
}
