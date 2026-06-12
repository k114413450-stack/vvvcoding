// db.ts — 数据库连接器
// 生产(Vercel): 用 Turso (libsql) via 静态 import
// 本地开发:    用 SQLite file (DATABASE_URL=file:./prisma/dev.db)

import { PrismaClient } from "@prisma/client";

// 静态 import 避免 Vercel 打包时 dynamic require() 出现
// "n is not a constructor" 问题
import { createClient } from "@libsql/client";
import { PrismaLibSQL } from "@prisma/adapter-libsql";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function buildClient(): PrismaClient {
  if (
    process.env.TURSO_DATABASE_URL &&
    process.env.TURSO_AUTH_TOKEN
  ) {
    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const adapter = new PrismaLibSQL(libsql);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new PrismaClient({ adapter } as any);
  }

  // 本地开发：普通 SQLite
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : [],
  });
}

export const db: PrismaClient = global.__prisma ?? buildClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = db;
}
