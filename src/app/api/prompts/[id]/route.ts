import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

interface Props {
  params: Promise<{ id: string }>;
}

// GET /api/prompts/[id]
export async function GET(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    const prompt = await db.prompt.findUnique({
      where: { id },
      include: { author: true },
    });

    if (!prompt) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    return NextResponse.json(prompt);
  } catch (error) {
    console.error("GET /api/prompts/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch prompt" },
      { status: 500 }
    );
  }
}

// PATCH /api/prompts/[id] - Increment copyCount
export async function PATCH(request: NextRequest, { params }: Props) {
  try {
    const { id } = await params;

    // Apply IP rate limiting for incrementing copyCount (10 requests per 60 seconds)
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const { allowed, retryAfter } = checkRateLimit(ip, 10, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${retryAfter}s.` },
        { status: 429 }
      );
    }

    const updatedPrompt = await db.prompt.update({
      where: { id },
      data: {
        copyCount: {
          increment: 1,
        },
      },
    });

    return NextResponse.json(updatedPrompt);
  } catch (error) {
    console.error("PATCH /api/prompts/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update prompt copy count" },
      { status: 500 }
    );
  }
}
