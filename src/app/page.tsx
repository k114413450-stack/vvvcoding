import { db } from "@/lib/db";
import Navbar from "@/components/Navbar";
import HomePageClient from "./HomePageClient";
import JsonLd from "@/components/JsonLd";
import {
  BASE_URL,
  breadcrumbJsonLd,
  discussionForumJsonLd,
  wrapJsonLdGraph,
} from "@/lib/json-ld";

import { getDynamicViews } from "@/lib/dynamic-stats";

interface Props {
  searchParams: Promise<{ category?: string; search?: string }>;
}

export default async function HomePage({ searchParams }: Props) {
  const resolvedSearchParams = await searchParams;
  const category = resolvedSearchParams?.category || "All";
  const search = resolvedSearchParams?.search || "";

  const whereClause: any = {
    createdAt: { lte: new Date() }
  };
  if (category && category !== "All") {
    whereClause.category = category;
  }
  if (search) {
    whereClause.OR = [
      { title: { contains: search } },
      { tags: { contains: search } },
    ];
  }

  const topics = await db.topic.findMany({
    where: whereClause,
    include: {
      author: true,
      _count: {
        select: {
          comments: {
            where: {
              createdAt: { lte: new Date() }
            }
          }
        }
      }
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Convert Date objects to strings for Client Component props serialization
  const serializedTopics = topics.map((topic: any) => ({
    ...topic,
    viewCount: getDynamicViews(topic.createdAt, topic.viewCount),
    replyCount: topic._count.comments,
    createdAt: topic.createdAt.toISOString(),
    updatedAt: topic.updatedAt.toISOString(),
    author: {
      ...topic.author,
      createdAt: topic.author.createdAt.toISOString(),
    },
  }));

  const homeJsonLd = wrapJsonLdGraph(
    discussionForumJsonLd(),
    breadcrumbJsonLd([{ name: "Home", url: BASE_URL }]),
    {
      "@type": "CollectionPage",
      "@id": `${BASE_URL}/#webpage`,
      name: "VVVCODING — AI Native Developers Forum",
      url: BASE_URL,
      isPartOf: { "@id": `${BASE_URL}/#website` },
      about: { "@id": `${BASE_URL}/#forum` },
      mainEntity: {
        "@type": "ItemList",
        numberOfItems: serializedTopics.length,
        itemListElement: serializedTopics.slice(0, 20).map((topic, index) => ({
          "@type": "ListItem",
          position: index + 1,
          url: `${BASE_URL}/topics/${topic.id}`,
          name: topic.title,
        })),
      },
    }
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <JsonLd data={homeJsonLd} />
      <Navbar />
      <HomePageClient
        initialTopics={serializedTopics}
        initialCategory={category}
        initialSearch={search}
      />
    </div>
  );
}
