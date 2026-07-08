// create/route.ts — 创建 PayPal 支付订单 API
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { createPaypalOrder, TierKey } from "@/lib/paypal";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "需登录真实账户才能进行购买" }, { status: 401 });
    }

    const { tier } = await req.json();
    if (!tier || !["1_month", "3_months", "12_months"].includes(tier)) {
      return NextResponse.json({ error: "无效的会员套餐规格" }, { status: 400 });
    }

    // Call PayPal to create checkout order
    const orderId = await createPaypalOrder(tier as TierKey);

    return NextResponse.json({ success: true, orderId });
  } catch (error: any) {
    console.error("PayPal order creation failure:", error);
    return NextResponse.json({ error: error.message || "无法创建支付订单，请稍后重试" }, { status: 550 });
  }
}
