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
      url: `${BASE_URL}/prompts`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/bounties`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/tools`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
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
      where: {
        createdAt: { lte: new Date() }
      },
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

  // Dynamic prompt routes
  let promptRoutes: MetadataRoute.Sitemap = [];
  try {
    const prompts = await db.prompt.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    promptRoutes = prompts.map((prompt) => ({
      url: `${BASE_URL}/prompts/${prompt.id}`,
      lastModified: prompt.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }));
  } catch (error) {
    console.error("sitemap: skipping prompt routes", error);
  }

  // Dynamic bounty routes
  let bountyRoutes: MetadataRoute.Sitemap = [];
  try {
    const bounties = await db.bounty.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });

    bountyRoutes = bounties.map((bounty) => ({
      url: `${BASE_URL}/bounties/${bounty.id}`,
      lastModified: bounty.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error("sitemap: skipping bounty routes", error);
  }

  return [...staticRoutes, ...topicRoutes, ...promptRoutes, ...bountyRoutes];
}
