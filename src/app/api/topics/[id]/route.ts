import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Increment view count
    await db.topic
      .update({
        where: { id },
        data: {
          viewCount: {
            increment: 1,
          },
        },
      })
      .catch(() => {});

    const topic = await db.topic.findUnique({
      where: { id },
      include: {
        author: true,
        comments: {
          where: {
            createdAt: { lte: new Date() },
          },
          include: {
            author: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!topic || topic.createdAt > new Date()) {
      return NextResponse.json({ error: "Topic not found" }, { status: 404 });
    }

    return NextResponse.json(topic);
  } catch (error) {
    console.error("Fetch topic error:", error);
    return NextResponse.json(
      { error: "Failed to fetch topic" },
      { status: 500 }
    );
  }
}
