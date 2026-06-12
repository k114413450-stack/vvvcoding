import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    // Apply IP rate limiting for comments (10 requests per 60 seconds)
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const { allowed, retryAfter } = checkRateLimit(ip, 10, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${retryAfter}s.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { content, authorId, topicId, parentId } = body;

    if (!content || !authorId || !topicId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const comment = await db.$transaction(async (tx) => {
      const newComment = await tx.comment.create({
        data: {
          content,
          authorId,
          topicId,
          parentId: parentId || null,
        },
      });
      await tx.topic.update({
        where: { id: topicId },
        data: {
          replyCount: { increment: 1 },
        },
      });
      return newComment;
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
