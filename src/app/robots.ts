import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api/", "/create"],
      },
    ],
    sitemap: "https://vvvcoding.com/sitemap.xml",
    host: "https://vvvcoding.com",
  };
}
