import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const BOT_TOPIC_TEMPLATES = [
  {
    title: "Cursor composer is cheating. Just built a Chrome extension in 15 minutes",
    category: "SideProject",
    tags: "#VibeCoding,#SideProject",
    content: "Literally just hit Cmd+I, said 'build me an extension that blocks all social media except this forum', and boom. It works perfectly. The developer flow is changing so fast. Anyone else shifting entirely to Cursor?",
  },
  {
    title: "How to prompt the AI to write clean, typesafe Prisma queries",
    category: "VibeCoding",
    tags: "#VibeCoding,#NextJS,#Prisma",
    content: "When prompting the AI, sometimes it imports client packages in server files. Here is the exact system prompt I feed it to ensure TypeScript types are properly respected without import errors. Works on Gemini, GPT, and Claude.",
  },
  {
    title: "Monetization: Lemon Squeezy vs Stripe for AI wrapper startups?",
    category: "Monetization",
    tags: "#Monetization,#SideProject",
    content: "Stripe requires a lot of sales tax management. Lemon Squeezy handles it as a Merchant of Record. What are you guys using for your 1-day MVP wrappers? Is it worth setting up Stripe Atlas or just go fast with MoR?",
  },
  {
    title: "Look at this SVG generator I prompted in 5 minutes",
    category: "AI-Showcase",
    tags: "#AI-Showcase,#SVG",
    content: "I prompted a React component that takes text input and renders an animated SVG background. It looks super professional. The prompts were basic: 'Create a tailwind component with a canvas that draws flowing neon waves.' Insane.",
  },
];

const BOT_COMMENT_TEMPLATES = [
  "Damn, this is clean! I'm stealing this prompt template.",
  "Lemon Squeezy is definitely easier for global payments. Less tax headache.",
  "Have you tried running this on Vercel? I got some cold start issues with SQLite.",
  "This is the future. People who complain about 'real coding' are missing the boat.",
  "I've been using Cursor for 3 months. My shipping velocity has increased 5x easily.",
  "Vibe coding is cool until you hit a bug that requires reading the React lifecycle details. Still, 90% of the time it's a huge win.",
  "Could you share the repo link? I'd love to play around with the styles.",
  "This is super helpful. Thanks for writing this down!",
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, topicId } = body;

    // Fetch bots
    const bots = await db.user.findMany({
      where: { isBot: true },
    });

    if (bots.length === 0) {
      return NextResponse.json(
        { error: "No bot users found in the database. Run seeds first." },
        { status: 400 }
      );
    }

    const randomBot = bots[Math.floor(Math.random() * bots.length)];

    if (action === "create_topic") {
      const template =
        BOT_TOPIC_TEMPLATES[
          Math.floor(Math.random() * BOT_TOPIC_TEMPLATES.length)
        ];
      
      // Ensure unique title by adding a timestamp
      const titleWithTimestamp = `${template.title} [Bot #${Math.floor(
        Math.random() * 100
      )}]`;

      const topic = await db.topic.create({
        data: {
          title: titleWithTimestamp,
          content: template.content,
          category: template.category,
          tags: template.tags,
          authorId: randomBot.id,
        },
      });

      return NextResponse.json({ success: true, type: "topic", data: topic });
    } else if (action === "create_comment") {
      if (!topicId) {
        return NextResponse.json(
          { error: "topicId is required for comments" },
          { status: 400 }
        );
      }

      const commentContent =
        BOT_COMMENT_TEMPLATES[
          Math.floor(Math.random() * BOT_COMMENT_TEMPLATES.length)
        ];

      const commentWithAuthor = await db.$transaction(async (tx) => {
        const comment = await tx.comment.create({
          data: {
            content: commentContent,
            authorId: randomBot.id,
            topicId: topicId,
          },
        });
        await tx.topic.update({
          where: { id: topicId },
          data: {
            replyCount: { increment: 1 },
          },
        });
        return tx.comment.findUnique({
          where: { id: comment.id },
          include: { author: true },
        });
      });

      return NextResponse.json({
        success: true,
        type: "comment",
        data: commentWithAuthor,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Bot action error:", error);
    return NextResponse.json(
      { error: "Failed to perform bot action" },
      { status: 500 }
    );
  }
}
