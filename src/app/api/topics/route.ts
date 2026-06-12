import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const topics = await db.topic.findMany({
      where: category ? { category } : {},
      include: {
        author: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(topics);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, category, tags, authorId } = body;

    if (!title || !content || !category || !authorId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const topic = await db.topic.create({
      data: {
        title,
        content,
        category,
        tags: tags || "",
        authorId,
      },
    });

    return NextResponse.json(topic);
  } catch (error) {
    console.error("Create topic error:", error);
    return NextResponse.json(
      { error: "Failed to create topic" },
      { status: 500 }
    );
  }
}
