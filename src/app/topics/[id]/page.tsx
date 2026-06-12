import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import TopicDetailClient from "./TopicDetailClient";

interface Props {
  params: Promise<{ id: string }>;
}

// Generate dynamic metadata for each topic page (for Google)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  const topic = await db.topic.findUnique({
    where: { id },
    include: { author: true },
  });

  if (!topic) {
    return { title: "Topic Not Found — vvvcoding.com" };
  }

  const description = topic.content.slice(0, 155).replace(/\n/g, " ") + "…";

  return {
    title: `${topic.title} — vvvcoding.com`,
    description,
    openGraph: {
      title: topic.title,
      description,
      type: "article",
      url: `https://vvvcoding.com/topics/${topic.id}`,
      siteName: "VVVCODING",
    },
    twitter: {
      card: "summary_large_image",
      title: topic.title,
      description,
    },
    alternates: {
      canonical: `https://vvvcoding.com/topics/${topic.id}`,
    },
  };
}

export default async function TopicDetailPage({ params }: Props) {
  const { id } = await params;

  // Verify the topic exists server-side; 404 if not
  const topic = await db.topic.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!topic) {
    notFound();
  }

  // Increment view count server-side on initial load
  await db.topic.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  return <TopicDetailClient id={id} />;
}
