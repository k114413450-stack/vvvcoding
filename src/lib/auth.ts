// auth.ts — 自建轻量级用户认证库 (Node.js 原生 crypto 模块实现，零额外包依赖)
import crypto from "crypto";
import { cookies } from "next/headers";
import { db } from "./db";

const SESSION_COOKIE_NAME = "vvvcoding_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "vvvcoding_ultra_secure_session_secret_2026_07_07";

// 1. 密码 Hash 与校验 (PBKDF2)
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!storedHash || !storedHash.includes(":")) return false;
  const [salt, hash] = storedHash.split(":");
  const testHash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return testHash === hash;
}

// 2. 简易 AES-256-GCM 会话加密 (Stateless Encrypted Session Cookie)
export function encryptSession(payload: any): string {
  // Ensure secret is 32 bytes
  const key = crypto.scryptSync(SESSION_SECRET, "salt-string", 32);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  
  let encrypted = cipher.update(JSON.stringify(payload), "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag().toString("hex");
  
  // Format: iv:encrypted:authTag
  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

export function decryptSession(token: string): any {
  try {
    const parts = token.split(":");
    if (parts.length !== 3) return null;
    
    const [ivHex, encryptedHex, authTagHex] = parts;
    const key = crypto.scryptSync(SESSION_SECRET, "salt-string", 32);
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    
    return JSON.parse(decrypted);
  } catch (e) {
    return null;
  }
}

// 3. 获取/写入/清除 Cookie 会话
export async function setSessionCookie(payload: any) {
  const token = encryptSession(payload);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

export async function removeSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionPayload(): Promise<any | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return decryptSession(token);
}

// 4. 获取当前已登录真实用户
export async function getSessionUser() {
  const payload = await getSessionPayload();
  if (!payload || !payload.userId) return null;
  
  try {
    const user = await db.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user) return null;
    
    // Check if VIP expired
    if (user.vipTier === "VIP" && user.vipExpiresAt) {
      const now = new Date();
      if (now > new Date(user.vipExpiresAt)) {
        // Expired — automatically downgrade
        const updatedUser = await db.user.update({
          where: { id: user.id },
          data: { vipTier: "FREE" },
        });
        return updatedUser;
      }
    }
    
    return user;
  } catch (e) {
    return null;
  }
}
