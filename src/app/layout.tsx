import type { Metadata, Viewport } from "next";
import "./globals.css";

const BASE_URL = "https://vvvcoding.com";

export const viewport: Viewport = {
  themeColor: "#1e3a8a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default:
      "南方机电五金建材总汇 — 官渡20年老字号机电五金·配件最全·送货上门·长期合同月付（原南方百旺机电部）",
    template: "%s — 南方机电五金建材总汇",
  },
  description:
    "广东省韶关市翁源县官渡镇20年老字号机电五金老品牌【南方机电五金建材总汇】（原南方百旺机电部）。主营五金机电、电机水泵、电动工具、建筑机械、五金工具、油锯割草机、轴承油封、灯饰卫浴、传动配件、劳保用品、螺丝标准件。本地现货配件最全，别人没有的我们也有！支持工厂工地签订长期供货合同月付、专车送货上门。服务热线/微信：13411116196，地址：官渡镇文体中心公园南侧50米。",
  keywords: [
    "南方机电五金建材总汇",
    "南方百旺机电部",
    "官渡机电",
    "官渡五金店",
    "翁源机电五金",
    "韶关五金批发",
    "电机水泵",
    "DCA电动工具",
    "建筑机械",
    "油锯割草机",
    "轴承油封",
    "视贝灯饰插座",
    "金羚排气扇",
    "螺丝标准件",
    "劳保用品",
    "送货上门",
    "企业月结供货",
    "翁源官渡五金建材",
  ],
  authors: [{ name: "南方机电五金建材总汇" }],
  creator: "南方机电五金建材总汇",
  publisher: "南方机电五金建材总汇",
  formatDetection: {
    telephone: true,
    address: true,
  },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    url: BASE_URL,
    siteName: "南方机电五金建材总汇",
    title: "南方机电五金建材总汇（原南方百旺机电部）— 官渡20年老字号",
    description:
      "20年老店本地老品牌。五金机电、电机水泵、电动工具、螺丝标准件等本地配件最全，别人没有的我们也有！支持企业长期合同月付、专车送货上门。热线：13411116196",
    images: [
      {
        url: "/images/store/power-tools.jpg",
        width: 1200,
        height: 630,
        alt: "南方机电五金建材总汇-实体门店与现货仓库",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "南方机电五金建材总汇 — 官渡20年老字号机电五金建材总汇",
    description:
      "本地配件最全，别人没有的我们也有！支持企业长期合同月付、专车送货上门。热线：13411116196",
    images: ["/images/store/power-tools.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: BASE_URL,
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="scroll-smooth">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}

