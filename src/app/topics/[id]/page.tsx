import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { stripMarkdown } from "@/lib/strip-markdown";
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

  if (!topic || topic.createdAt > new Date()) {
    return { title: "Topic Not Found — vvvcoding.com" };
  }

  const description =
    stripMarkdown(topic.content).slice(0, 150).trim() + "...";

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

import { getDynamicViews } from "@/lib/dynamic-stats";

export default async function TopicDetailPage({ params }: Props) {
  const { id } = await params;

  // Verify the topic exists server-side; 404 if not
  const topicData = await db.topic.findUnique({
    where: { id },
    include: {
      author: true,
      comments: {
        where: {
          createdAt: { lte: new Date() }
        }
      }
    },
  });

  if (!topicData || topicData.createdAt > new Date()) {
    notFound();
  }

  // Increment view count server-side on initial load
  await db.topic.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  const dynamicViewCount = getDynamicViews(topicData.createdAt, topicData.viewCount);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    "headline": topicData.title,
    "text": topicData.content.slice(0, 500),
    "datePublished": topicData.createdAt.toISOString(),
    "dateModified": topicData.updatedAt.toISOString(),
    "author": {
      "@type": "Person",
      "name": topicData.author.username,
    },
    "interactionStatistic": [
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/ReplyAction",
        "userInteractionCount": topicData.comments.length,
      },
      {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/ViewAction",
        "userInteractionCount": dynamicViewCount,
      },
    ],
    "url": `https://vvvcoding.com/topics/${topicData.id}`,
    "isPartOf": {
      "@type": "DiscussionForum",
      "name": "VVVCODING",
      "url": "https://vvvcoding.com",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TopicDetailClient id={id} />
    </>
  );
}
