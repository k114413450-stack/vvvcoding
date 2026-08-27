import { MetadataRoute } from "next";

const BASE_URL = "https://vvvcoding.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: [
          "Bytespider",
          "Baiduspider",
          "Googlebot",
          "bingbot",
          "360Spider",
          "Sogouspider",
          "YisouSpider",
        ],
        allow: "/",
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}

