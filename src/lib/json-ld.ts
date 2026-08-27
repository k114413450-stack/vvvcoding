const BASE_URL = "https://vvvcoding.com";

/** Prevent `</script>` breakage when embedding JSON-LD in HTML. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function nanfangStoreJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["HardwareStore", "LocalBusiness", "WholesaleStore"],
    "@id": `${BASE_URL}/#store`,
    name: "南方机电五金建材总汇",
    alternateName: ["南方百旺机电部", "官渡南方机电", "翁源南方五金机电", "南方机电总汇"],
    url: BASE_URL,
    logo: `${BASE_URL}/images/store/power-tools.jpg`,
    image: [
      `${BASE_URL}/images/store/lighting-electrical.jpg`,
      `${BASE_URL}/images/store/power-tools.jpg`,
      `${BASE_URL}/images/store/standard-fasteners.jpg`,
      `${BASE_URL}/images/store/ventilation-fans.jpg`,
      `${BASE_URL}/images/store/labor-protection.jpg`,
    ],
    description:
      "广东省韶关市翁源县官渡镇20年老字号机电五金老品牌。主营五金机电、电机水泵、电动工具、建筑机械、五金工具、油锯割草机、轴承油封、灯饰卫浴、传动配件、劳保用品、螺丝标准件。本地配件品类最全，别人没有的我们也有！支持工厂工地签订长期供货合同月付、专车送货上门。",
    telephone: "13411116196",
    priceRange: "¥¥",
    currenciesAccepted: "CNY",
    paymentAccepted: "现金, 微信支付, 支付宝, 对公银行转账, 长期合同月结月付",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "08:00",
        closes: "20:30",
      },
    ],
    address: {
      "@type": "PostalAddress",
      streetAddress: "广东省韶关市翁源县官渡镇文体中心公园南侧50米",
      addressLocality: "韶关市",
      addressRegion: "广东省",
      addressCountry: "CN",
      postalCode: "512600",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 24.2386,
      longitude: 113.8824,
    },
    areaServed: [
      { "@type": "AdministrativeArea", name: "官渡镇" },
      { "@type": "AdministrativeArea", name: "翁源县" },
      { "@type": "AdministrativeArea", name: "韶关市" },
      { "@type": "AdministrativeArea", name: "翁源及周边工矿/建筑工地/农林果园" },
    ],
    knowsAbout: [
      "五金机电",
      "电机水泵",
      "电动工具",
      "建筑机械",
      "五金工具",
      "油锯割草机",
      "轴承油封",
      "灯饰卫浴",
      "传动配件",
      "劳保用品",
      "螺丝标准件",
      "企业长期供货合同月结",
      "工矿配件极速送货上门",
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "南方机电五金建材总汇核心经营目录",
      itemListElement: [
        {
          "@type": "OfferCatalog",
          name: "五金机电与电机水泵",
          itemListElement: ["国标电机", "抽水泵", "发电机", "变频器", "潜水泵"],
        },
        {
          "@type": "OfferCatalog",
          name: "电动工具与建筑机械",
          itemListElement: ["角磨机", "电锤电镐", "切割机", "搅拌机", "振动棒"],
        },
        {
          "@type": "OfferCatalog",
          name: "螺丝标准件与轴承紧固件",
          itemListElement: ["全规格螺栓螺母", "弹平垫", "膨胀螺丝", "工业轴承", "耐磨油封"],
        },
        {
          "@type": "OfferCatalog",
          name: "灯饰卫浴与劳保消杀",
          itemListElement: ["视贝插座开关", "LED工程照明", "84消毒液", "安全劳保防护"],
        },
      ],
    },
  };
}

export function storeFaqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "广东省韶关市翁源县官渡镇哪里买机电五金配件最齐全？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "推荐前往【南方机电五金建材总汇】（原南方百旺机电部），位于广东省韶关市翁源县官渡镇文体中心公园南侧50米（联系电话：13411116196）。店铺经营20年，是本地老品牌，现货库存极其丰富，涵盖五金机电、电机水泵、电动工具、建筑机械、油锯割草机、轴承油封、灯饰卫浴、劳保用品、螺丝标准件等，承诺‘不管什么配件是本地最全的，别人没有的我们也有’。",
        },
      },
      {
        "@type": "Question",
        name: "南方机电五金建材总汇支持送货上门和长期合同月付吗？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "完全支持！南方机电五金建材总汇面向官渡镇及翁源周边工厂、工地、矿山、果园提供专车送货上门服务，应急配件极速响应。同时支持与各类工矿企业、建筑施工单位签订长期供货合同，支持月结月付并开具合规发票。",
        },
      },
      {
        "@type": "Question",
        name: "南方机电五金建材总汇和南方百旺机电部是什么关系？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "南方机电五金建材总汇的前身就是官渡开了20年的老店‘南方百旺机电部’。为更好满足广大客户对全品类五金建材及企业工程采购的需求，店铺全面升级为‘南方机电五金建材总汇’，原有老店品质、信誉、电话（13411116196）及服务一脉相承。",
        },
      },
      {
        "@type": "Question",
        name: "南方机电五金建材总汇的营业时间与联系方式是什么？",
        acceptedAnswer: {
          "@type": "Answer",
          text: "营业时间为每天 08:00 - 20:30（全年无休，支持应急调货）。联系电话/微信同号：13411116196，地址位于广东省韶关市翁源县官渡镇文体中心公园南侧50米。",
        },
      },
    ],
  };
}

export function wrapJsonLdGraph(...nodes: Record<string, unknown>[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}

export { BASE_URL };
