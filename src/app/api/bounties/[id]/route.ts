import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const bounty = await db.bounty.findUnique({
      where: { id },
      include: {
        author: true,
      },
    });

    if (!bounty) {
      return NextResponse.json(
        { error: "Bounty not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(bounty);
  } catch (error) {
    console.error("Fetch bounty detail error:", error);
    return NextResponse.json(
      { error: "Failed to fetch bounty details" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: "Status field is required" },
        { status: 400 }
      );
    }

    const existingBounty = await db.bounty.findUnique({
      where: { id },
    });

    if (!existingBounty) {
      return NextResponse.json(
        { error: "Bounty not found" },
        { status: 404 }
      );
    }

    const updatedBounty = await db.bounty.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(updatedBounty);
  } catch (error) {
    console.error("Update bounty status error:", error);
    return NextResponse.json(
      { error: "Failed to update bounty" },
      { status: 500 }
    );
  }
}
