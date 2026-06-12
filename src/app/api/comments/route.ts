import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { content, authorId, topicId, parentId } = body;

    if (!content || !authorId || !topicId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const [comment] = await db.$transaction([
      db.comment.create({
        data: {
          content,
          authorId,
          topicId,
          parentId: parentId || null,
        },
      }),
      db.topic.update({
        where: { id: topicId },
        data: {
          replyCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return NextResponse.json(comment);
  } catch (error) {
    console.error("Create comment error:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
