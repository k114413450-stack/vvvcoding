// paypal.ts — PayPal 支付服务端交互工具 (REST API v2)

const CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const PAYPAL_API_URL = process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";

// 套餐定义与时长对应 (一次性支付，买断对应天数)
export const MEMBERSHIP_TIERS = {
  "1_month": { price: 19.00, days: 30, name: "1 Month VIP" },
  "3_months": { price: 49.00, days: 90, name: "3 Months VIP" },
  "12_months": { price: 129.00, days: 365, name: "12 Months VIP" },
};

export type TierKey = keyof typeof MEMBERSHIP_TIERS;

// 1. 获取 PayPal Access Token (OAuth 2.0)
async function getAccessToken(): Promise<string> {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("Missing PayPal Client ID or Secret in environment variables.");
  }

  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: "POST",
    body: "grant_type=client_credentials",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to get PayPal token: ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  return data.access_token;
}

// 2. 创建 PayPal 订单
export async function createPaypalOrder(tierKey: TierKey): Promise<string> {
  const tier = MEMBERSHIP_TIERS[tierKey];
  if (!tier) {
    throw new Error(`Invalid membership tier: ${tierKey}`);
  }

  const accessToken = await getAccessToken();
  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: tier.price.toFixed(2),
          },
          description: `VVVCODING VIP Membership - ${tier.name}`,
        },
      ],
      application_context: {
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create PayPal order: ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  return data.id; // Returns order ID
}

// 3. 捕获 (Capture) PayPal 订单并返回详情
export async function capturePaypalOrder(orderId: string): Promise<{
  status: string;
  amount: number;
  email: string;
}> {
  const accessToken = await getAccessToken();
  const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to capture PayPal order ${orderId}: ${response.statusText} - ${errText}`);
  }

  const data = await response.json();
  
  const purchaseUnit = data.purchase_units?.[0];
  const capture = purchaseUnit?.payments?.captures?.[0];
  const payerEmail = data.payer?.email_address || "";

  return {
    status: data.status, // Should be "COMPLETED"
    amount: parseFloat(capture?.amount?.value || "0"),
    email: payerEmail,
  };
}
