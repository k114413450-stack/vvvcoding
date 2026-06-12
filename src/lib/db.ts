import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function buildClient(): PrismaClient {
  // In production on Vercel, TURSO_DATABASE_URL + TURSO_AUTH_TOKEN are set
  // We use dynamic require to avoid bundling libsql in dev when not needed
  if (
    process.env.TURSO_DATABASE_URL &&
    process.env.TURSO_AUTH_TOKEN
  ) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { createClient } = require("@libsql/client");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaLibSQL } = require("@prisma/adapter-libsql");

    const libsql = createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });

    const adapter = new PrismaLibSQL(libsql);
    return new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);
  }

  // Local dev: plain SQLite file
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : [],
  });
}

export const db: PrismaClient =
  global.__prisma ?? buildClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = db;
}
