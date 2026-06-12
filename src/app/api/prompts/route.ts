import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

// GET /api/prompts?category=Debug
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");

    const prompts = await db.prompt.findMany({
      where: category && category !== "All" ? { category } : {},
      include: { author: true },
      orderBy: [
        { copyCount: "desc" },
        { createdAt: "desc" }
      ],
    });

    return NextResponse.json(prompts);
  } catch (error) {
    console.error("GET /api/prompts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch prompts" },
      { status: 500 }
    );
  }
}

// POST /api/prompts
export async function POST(request: NextRequest) {
  try {
    // Apply IP rate limiting for creating prompts (3 requests per 60 seconds)
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const { allowed, retryAfter } = checkRateLimit(ip, 3, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${retryAfter}s.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { title, useCase, model, template, effectNote, category, tags, authorId } = body;

    if (!title || !template || !authorId || !category) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const prompt = await db.prompt.create({
      data: {
        title,
        useCase: useCase || "",
        model: model || "Any",
        template,
        effectNote: effectNote || "",
        category,
        tags: tags || "",
        authorId,
      },
    });

    return NextResponse.json(prompt);
  } catch (error) {
    console.error("POST /api/prompts error:", error);
    return NextResponse.json(
      { error: "Failed to create prompt" },
      { status: 500 }
    );
  }
}
