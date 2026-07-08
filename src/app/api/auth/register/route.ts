// register/route.ts — 用户注册 API
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password, username } = await req.json();

    if (!email || !password || !username) {
      return NextResponse.json({ error: "邮箱、密码和用户名均为必填项" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "密码长度至少需要 6 位" }, { status: 400 });
    }

    // 检查邮箱是否已被注册
    const existingEmail = await db.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return NextResponse.json({ error: "该邮箱已被注册" }, { status: 400 });
    }

    // 检查用户名是否已被占用
    const existingUsername = await db.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      return NextResponse.json({ error: "该用户名已被占用" }, { status: 400 });
    }

    const passwordHash = hashPassword(password);
    const avatarUrl = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(username)}`;

    // 创建新用户
    const user = await db.user.create({
      data: {
        email,
        passwordHash,
        username,
        avatarUrl,
        tier: "No-code Explorer", // 默认普通身份
        vipTier: "FREE",
      },
    });

    // 写入会话 cookie
    await setSessionCookie({ userId: user.id });

    // 过滤掉敏感密码哈希后返回
    const { passwordHash: _, ...userProfile } = user;
    return NextResponse.json({ success: true, user: userProfile });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "注册失败，请稍后重试" }, { status: 500 });
  }
}
