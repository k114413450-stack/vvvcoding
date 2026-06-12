import { db } from "@/lib/db";
import Navbar from "@/components/Navbar";
import HomePageClient from "./HomePageClient";

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
    include: { author: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  // Convert Date objects to strings for Client Component props serialization
  const serializedTopics = topics.map((topic) => ({
    ...topic,
    createdAt: topic.createdAt.toISOString(),
    updatedAt: topic.updatedAt.toISOString(),
    author: {
      ...topic.author,
      createdAt: topic.author.createdAt.toISOString(),
    },
  }));

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      <Navbar />
      <HomePageClient
        initialTopics={serializedTopics}
        initialCategory={category}
        initialSearch={search}
      />
    </div>
  );
}
