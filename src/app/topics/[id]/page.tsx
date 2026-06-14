import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { stripMarkdown } from "@/lib/strip-markdown";
import TopicDetailClient from "./TopicDetailClient";
import JsonLd from "@/components/JsonLd";
import {
  BASE_URL,
  breadcrumbJsonLd,
  discussionForumJsonLd,
  siteOrganizationJsonLd,
  wrapJsonLdGraph,
} from "@/lib/json-ld";
import { getDynamicViews } from "@/lib/dynamic-stats";

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
        },
        include: {
          author: true
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
  const topicUrl = `${BASE_URL}/topics/${topicData.id}`;
  const plainText = stripMarkdown(topicData.content).slice(0, 500).trim();

  const jsonLd = wrapJsonLdGraph(
    discussionForumJsonLd(),
    breadcrumbJsonLd([
      { name: "Home", url: BASE_URL },
      { name: topicData.title, url: topicUrl },
    ]),
    {
      "@type": "DiscussionForumPosting",
      "@id": `${topicUrl}#posting`,
      headline: topicData.title,
      text: plainText,
      datePublished: topicData.createdAt.toISOString(),
      dateModified: topicData.updatedAt.toISOString(),
      author: {
        "@type": "Person",
        name: topicData.author.username,
      },
      publisher: siteOrganizationJsonLd(),
      interactionStatistic: [
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/ReplyAction",
          userInteractionCount: topicData.comments.length,
        },
        {
          "@type": "InteractionCounter",
          interactionType: "https://schema.org/ViewAction",
          userInteractionCount: dynamicViewCount,
        },
      ],
      url: topicUrl,
      mainEntityOfPage: topicUrl,
      isPartOf: { "@id": `${BASE_URL}/#forum` },
      comment: topicData.comments.map((c) => ({
        "@type": "Comment",
        text: stripMarkdown(c.content).slice(0, 500),
        datePublished: c.createdAt.toISOString(),
        author: {
          "@type": "Person",
          name: c.author.username,
        },
      })),
    }
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <TopicDetailClient id={id} />
    </>
  );
}
