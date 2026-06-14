import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const whereClause: any = {};
    if (category && category !== "All") {
      whereClause.category = category;
    }
    if (status && status !== "All") {
      whereClause.status = status;
    }
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const bounties = await db.bounty.findMany({
      where: whereClause,
      include: {
        author: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(bounties);
  } catch (error) {
    console.error("Fetch bounties error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bounties" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit check: 5 requests per 60 seconds
    const ip = request.headers.get("x-forwarded-for") ?? "unknown";
    const { allowed, retryAfter } = checkRateLimit(ip, 5, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { error: `Too many requests. Try again in ${retryAfter}s.` },
        { status: 429 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      budgetMin,
      budgetMax,
      currency,
      category,
      contactMethod,
      contactValue,
      estimatedDays,
      expiresAt,
      authorId,
    } = body;

    if (!title || !description || !category || !contactMethod || !contactValue) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const bounty = await db.bounty.create({
      data: {
        title,
        description,
        budgetMin: parseInt(budgetMin) || 0,
        budgetMax: parseInt(budgetMax) || 0,
        currency: currency || "USD",
        category,
        status: "OPEN",
        sourceType: "Internal",
        contactMethod,
        contactValue,
        estimatedDays: parseInt(estimatedDays) || 3,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isCurated: false,
        authorId: authorId || null,
      },
    });

    return NextResponse.json(bounty);
  } catch (error) {
    console.error("Create bounty error:", error);
    return NextResponse.json(
      { error: "Failed to create bounty" },
      { status: 500 }
    );
  }
}
