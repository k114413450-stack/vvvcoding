// login/route.ts — 用户登录 API
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "邮箱和密码均为必填项" }, { status: 400 });
    }

    // 查找用户
    const user = await db.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    // 校验密码
    const isPasswordCorrect = verifyPassword(password, user.passwordHash);
    if (!isPasswordCorrect) {
      return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 });
    }

    // 写入会话 cookie
    await setSessionCookie({ userId: user.id });

    // 过滤敏感字段并返回
    const { passwordHash: _, ...userProfile } = user;
    return NextResponse.json({ success: true, user: userProfile });
  } catch (error: any) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "登录失败，请稍后重试" }, { status: 500 });
  }
}
