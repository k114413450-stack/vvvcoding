import { MetadataRoute } from "next";
import { db } from "@/lib/db";

const BASE_URL = "https://vvvcoding.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/create`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // Dynamic topic routes
  let topicRoutes: MetadataRoute.Sitemap = [];
  try {
    const topics = await db.topic.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    topicRoutes = topics.map((topic) => ({
      url: `${BASE_URL}/topics/${topic.id}`,
      lastModified: topic.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error("sitemap: skipping topic routes", error);
  }

  return [...staticRoutes, ...topicRoutes];
}
