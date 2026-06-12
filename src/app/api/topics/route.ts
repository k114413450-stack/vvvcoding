import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");

    const whereClause: any = {
      createdAt: { lte: new Date() }
    };
    if (category) {
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
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(topics);
  } catch (error) {
    console.error("Fetch topics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch topics" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply IP rate limiting for creating topics (3 requests per 60 seconds)
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const { allowed, retryAfter } = checkRateLimit(ip, 3, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${retryAfter}s.` },
        { status: 429 }
      );
    }

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
