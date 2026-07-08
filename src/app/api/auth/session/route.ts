// session/route.ts — 获取当前会话状态 API
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ loggedIn: false, user: null });
    }
    
    const { passwordHash: _, ...userProfile } = user;
    return NextResponse.json({ loggedIn: true, user: userProfile });
  } catch (error) {
    return NextResponse.json({ loggedIn: false, error: "Failed to retrieve session" }, { status: 500 });
  }
}
