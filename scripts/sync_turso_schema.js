// sync_turso_schema.js — 直接连接 Turso 数据库并升级表结构
const { createClient } = require("@libsql/client");
const fs = require("fs");
const path = require("path");

// 读取 .env 中的环境变量
function loadEnv() {
  const envPath = path.join(__dirname, "../.env");
  if (!fs.existsSync(envPath)) {
    console.error("Missing .env file in root!");
    process.exit(1);
  }
  const content = fs.readFileSync(envPath, "utf-8");
  content.split(/\r?\n/).forEach(line => {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      const key = match[1];
      let value = match[2].trim();
      // Remove double or single quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    }
  });
}


loadEnv();

const dbUrl = process.env.TURSO_DATABASE_URL;
const dbToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl || !dbToken) {
  console.error("Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN in env!");
  process.exit(1);
}

async function run() {
  console.log(`Connecting to Turso: ${dbUrl}`);
  const client = createClient({
    url: dbUrl,
    authToken: dbToken,
  });

  try {
    console.log("Updating User table columns...");
    // 增加 email, passwordHash, vipTier, vipExpiresAt 字段 (如果不存在)
    // 注意: SQLite 不支持 ALTER TABLE ADD COLUMN ... UNIQUE，需要分开建唯一索引
    
    try {
      await client.execute("ALTER TABLE User ADD COLUMN email TEXT;");
      console.log("Added column: User.email");
    } catch (e) {
      console.log("User.email column might already exist:", e.message);
    }

    try {
      await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS User_email_key ON User(email);");
      console.log("Created unique index: User_email_key");
    } catch (e) {
      console.log("Failed to create index User_email_key:", e.message);
    }

    try {
      await client.execute("ALTER TABLE User ADD COLUMN passwordHash TEXT;");
      console.log("Added column: User.passwordHash");
    } catch (e) {
      console.log("User.passwordHash column might already exist:", e.message);
    }

    try {
      await client.execute("ALTER TABLE User ADD COLUMN vipTier TEXT DEFAULT 'FREE';");
      console.log("Added column: User.vipTier");
    } catch (e) {
      console.log("User.vipTier column might already exist:", e.message);
    }

    try {
      await client.execute("ALTER TABLE User ADD COLUMN vipExpiresAt DATETIME;");
      console.log("Added column: User.vipExpiresAt");
    } catch (e) {
      console.log("User.vipExpiresAt column might already exist:", e.message);
    }

    console.log("Creating PaymentLog table...");
    await client.execute(`
      CREATE TABLE IF NOT EXISTS PaymentLog (
        id TEXT PRIMARY KEY NOT NULL,
        userId TEXT NOT NULL,
        paypalOrderId TEXT NOT NULL,
        amount REAL NOT NULL,
        status TEXT NOT NULL,
        paymentEmail TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
      );
    `);
    console.log("PaymentLog table created or already exists.");

    try {
      await client.execute("CREATE UNIQUE INDEX IF NOT EXISTS PaymentLog_paypalOrderId_key ON PaymentLog(paypalOrderId);");
      console.log("Created unique index: PaymentLog_paypalOrderId_key");
    } catch (e) {
      console.log("Failed to create index PaymentLog_paypalOrderId_key:", e.message);
    }

    console.log("🎉 Database schema successfully synchronized with Turso!");
  } catch (error) {
    console.error("Sync failed:", error);
  } finally {
    client.close();
  }
}

run();
