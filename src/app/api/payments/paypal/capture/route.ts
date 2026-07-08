// capture/route.ts — 捕获 PayPal 支付订单并更新会期 API
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { capturePaypalOrder, MEMBERSHIP_TIERS, TierKey } from "@/lib/paypal";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "需登录真实账户才能确认购买" }, { status: 401 });
    }

    const { orderId, tier } = await req.json();
    if (!orderId || !tier || !["1_month", "3_months", "12_months"].includes(tier)) {
      return NextResponse.json({ error: "参数不完整或规格无效" }, { status: 400 });
    }

    const tierConfig = MEMBERSHIP_TIERS[tier as TierKey];
    if (!tierConfig) {
      return NextResponse.json({ error: "未知的会员规格配置" }, { status: 400 });
    }

    // Call PayPal capture API
    const captureResult = await capturePaypalOrder(orderId);

    if (captureResult.status !== "COMPLETED") {
      return NextResponse.json({ 
        error: `支付未完成，当前状态：${captureResult.status}` 
      }, { status: 400 });
    }

    // 计算新的会员到期日期
    const now = new Date();
    const daysToAdd = tierConfig.days;
    let baseDate = now;

    if (user.vipTier === "VIP" && user.vipExpiresAt) {
      const currentExpiry = new Date(user.vipExpiresAt);
      if (currentExpiry > now) {
        // 如果当前会员还没过期，在原到期时间基础上累加
        baseDate = currentExpiry;
      }
    }

    const newExpiry = new Date(baseDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);

    // 采用 Prisma Transaction 确保数据一致性
    const [updatedUser, log] = await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: {
          vipTier: "VIP",
          vipExpiresAt: newExpiry,
        },
      }),
      db.paymentLog.create({
        data: {
          userId: user.id,
          paypalOrderId: orderId,
          amount: captureResult.amount,
          status: "COMPLETED",
          paymentEmail: captureResult.email,
        },
      }),
    ]);

    const { passwordHash: _, ...userProfile } = updatedUser;

    return NextResponse.json({
      success: true,
      user: userProfile,
      expiryDate: newExpiry.toISOString(),
      amountPaid: captureResult.amount,
    });
  } catch (error: any) {
    console.error("PayPal capture failed:", error);
    return NextResponse.json({ 
      error: error.message || "确认支付订单失败，请联系客服处理" 
    }, { status: 500 });
  }
}
