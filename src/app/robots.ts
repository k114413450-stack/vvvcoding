import { MetadataRoute } from "next";
import { headers } from "next/headers";
import { GAME_SITE_URL, MAIN_SITE_URL, isGameHost } from "@/lib/site-host";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host") ?? "";
  const isGame = isGameHost(host);

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: isGame ? [] : ["/admin", "/api/", "/create"],
      },
    ],
    sitemap: isGame ? `${GAME_SITE_URL}/sitemap.xml` : `${MAIN_SITE_URL}/sitemap.xml`,
    host: isGame ? GAME_SITE_URL : MAIN_SITE_URL,
  };
}
