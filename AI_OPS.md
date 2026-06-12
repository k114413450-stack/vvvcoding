# AI 操作手册 · vvvcoding

> **读者**：其他 AI 助手、自动化脚本  
> **读者水平**：零基础也可照做  
> **项目路径**：`D:\webgame`  
> **密钥位置**：`.env`（本文件只写步骤，不重复粘贴 Token）

---

## 0. 30 秒了解这个项目

| 项目 | 说明 |
|------|------|
| 技术栈 | Next.js 16 + Prisma 5 + SQLite（本地）/ Turso（线上） |
| GitHub | https://github.com/k114413450-stack/vvvcoding |
| Vercel 线上 | https://vvvcoding.vercel.app |
| Vercel 项目名 | `jjjui-s-projects/vvvcoding` |
| Turso 数据库名 | `vvvcoding` |
| Turso 组织 slug | `jjjjui`（见 `.env` 的 `TURSO_ORG_SLUG`） |

**重要**：本机是 **Windows + PowerShell**。命令示例都用 PowerShell 写法。

---

## 1. 先读 `.env`，再动手

所有 Token 都在项目根目录 **`.env`** 里。

```powershell
cd D:\webgame
Get-Content .env
```

### `.env` 里每个变量是干什么的

| 变量名 | 用途 | 谁会用 |
|--------|------|--------|
| `DATABASE_URL` | 本地 SQLite 文件路径，给 **Prisma CLI** 用 | `npx prisma db push` |
| `TURSO_DATABASE_URL` | 线上 Turso 地址 | Next.js 运行时、`@libsql/client` |
| `TURSO_AUTH_TOKEN` | **连数据库**用的 JWT | Next.js 运行时（Vercel 也要配） |
| `TURSO_API_TOKEN` | **管理 Turso 账号**用的 Token | Turso HTTP API / 部分 CLI |
| `TURSO_ORG_SLUG` | Turso 组织短名 | API 路径里的 `{organizationSlug}` |
| `VERCEL_TOKEN` | Vercel CLI 登录 | `vercel` 命令 |
| `GITHUB_REPO` 等 | 固定链接，不是密钥 | 文档引用 |

### 两种 Token 别搞混（菜鸟必看）

```
Turso 平台 API Token  →  创建/删除数据库、看列表（像「管理员钥匙」）
Turso 数据库 Auth Token →  应用读写数据（像「数据库门卡」）
Vercel Token           →  部署网站（像「发布钥匙」）
```

Next.js 代码里用的是：`TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`（见 `src/lib/db.ts`）。

---

## 2. 给 AI 的标准开场流程

每次新会话，AI 应按顺序执行：

```powershell
cd D:\webgame

# 1. 确认 .env 存在
Test-Path .env

# 2. 加载环境变量到当前 PowerShell 会话（AI 必做）
foreach ($line in Get-Content .env) {
  if ($line -match '^\s*([A-Z_][A-Z0-9_]*)=(.*)$') {
    Set-Item -Path "env:$($matches[1])" -Value ($matches[2].Trim('"'))
  }
}

# 3. 验证
vercel whoami          # 应显示 k114413450-stack
```

---

## 3. 本地开发

### 3.1 安装依赖（首次）

```powershell
cd D:\webgame
npm install
npx prisma generate
```

### 3.2 只用本地 SQLite（不连 Turso）

临时去掉 Turso 变量再启动：

```powershell
cd D:\webgame
Remove-Item Env:TURSO_DATABASE_URL -ErrorAction SilentlyContinue
Remove-Item Env:TURSO_AUTH_TOKEN -ErrorAction SilentlyContinue
npm run dev
```

浏览器打开：http://localhost:3000

### 3.3 连 Turso 开发

`.env` 里已有 `TURSO_*` 时，直接：

```powershell
npm run dev
```

### 3.4 同步本地数据库结构

```powershell
cd D:\webgame
$env:DATABASE_URL = "file:./prisma/dev.db"
npx prisma db push
```

---

## 4. Git / GitHub CLI

本机 `gh` 已登录账号 **`k114413450-stack`**。

```powershell
cd D:\webgame
git status
git log -3 --oneline

# 推送（示例）
git add .
git commit -m "你的说明"
git push origin master
```

**不要** `git add .env`（已在 `.gitignore`）。

---

## 5. Vercel CLI（部署）

### 5.1 安装（若未安装）

```powershell
npm install -g vercel
vercel --version
```

### 5.2 用 `.env` 里的 Token 登录

```powershell
cd D:\webgame
$env:VERCEL_TOKEN = (Get-Content .env | Where-Object { $_ -match '^VERCEL_TOKEN=' } | ForEach-Object { $_ -replace '^VERCEL_TOKEN="(.*)"$','$1' })
vercel whoami
```

### 5.3 关联项目（一般已做过，有 `.vercel/` 可跳过）

```powershell
vercel link --yes --project vvvcoding
```

### 5.4 部署到生产

```powershell
vercel --prod --yes
```

成功后会看到类似：

- 预览：`https://vvvcoding-xxxx.vercel.app`
- 正式域名：https://vvvcoding.vercel.app

### 5.5 查看 / 修改环境变量

```powershell
vercel env ls

# 添加或覆盖（示例）
"libsql://vvvcoding-jjjjui.aws-ap-northeast-1.turso.io" | vercel env add TURSO_DATABASE_URL production --force
```

Vercel 上**必须**有这两个变量（与 `.env` 一致）：

- `TURSO_DATABASE_URL`
- `TURSO_AUTH_TOKEN`

---

## 6. Turso（数据库）

### 6.1 网页控制台

- 入口：https://turso.tech/app  
- 数据库 **`vvvcoding`** → 详情页可看 **Database URL**

### 6.2 用 HTTP API（Windows 无 Turso CLI 时推荐）

先加载 `.env`，再调用 API：

```powershell
$headers = @{ Authorization = "Bearer $env:TURSO_API_TOKEN" }

# 列出数据库
Invoke-RestMethod -Uri "https://api.turso.tech/v1/organizations/$env:TURSO_ORG_SLUG/databases" -Headers $headers

# 查看单个库
Invoke-RestMethod -Uri "https://api.turso.tech/v1/organizations/$env:TURSO_ORG_SLUG/databases/vvvcoding" -Headers $headers
```

**Database URL 规则**（已在 `.env`）：

```
libsql://vvvcoding-jjjjui.aws-ap-northeast-1.turso.io
```

### 6.3 新建数据库 Auth Token（门卡过期/泄露时）

```powershell
$headers = @{
  Authorization = "Bearer $env:TURSO_API_TOKEN"
  "Content-Type" = "application/json"
}
Invoke-RestMethod -Method POST `
  -Uri "https://api.turso.tech/v1/organizations/$env:TURSO_ORG_SLUG/databases/vvvcoding/auth/tokens" `
  -Headers $headers -Body '{}' | Select-Object -ExpandProperty jwt
```

拿到新 `jwt` 后：

1. 更新 `.env` 的 `TURSO_AUTH_TOKEN`
2. 更新 Vercel 环境变量：`vercel env add TURSO_AUTH_TOKEN production --force`（管道传入新值）
3. 重新部署：`vercel --prod --yes`

### 6.4 Turso CLI（可选，Windows 较麻烦）

本机若只有 Docker 的 WSL，Turso CLI 可放在 WSL 里运行；**优先用上面 HTTP API**。

---

## 7. 构建与排错

### 7.1 本地模拟 Vercel 构建

```powershell
cd D:\webgame
# 先加载 .env（见第 2 节）
npm run build
```

### 7.2 常见问题

| 现象 | 原因 | 处理 |
|------|------|------|
| `n is not a constructor` | `@prisma/adapter-libsql` 版本和 Prisma 不一致 | 保持 `@prisma/client` 与 `@prisma/adapter-libsql` 同为 **5.22.x** |
| `no such table: Topic` | Turso 还没建表 | 用 libsql 执行建表 SQL，或确保线上库已有 schema |
| Vercel 构建失败 | 环境变量缺失 | `vercel env ls` 检查 Turso 两个变量 |
| `prisma db push` 不能连 libsql | Prisma 5 的 sqlite 数据源只认 `file:` | 本地用 `DATABASE_URL=file:./prisma/dev.db`；Turso 用 API/脚本建表 |

---

## 8. AI 常用任务速查

### 任务 A：改代码并部署

```powershell
cd D:\webgame
# 加载 .env → 改代码 → 本地 build 验证 → 部署
npm run build
vercel --prod --yes
```

### 任务 B：把代码推到 GitHub

```powershell
cd D:\webgame
git add -A
git status   # 确认没有 .env
git commit -m "说明"
git push origin master
```

### 任务 C：检查线上是否活着

```powershell
Invoke-WebRequest -Uri "https://vvvcoding.vercel.app" -UseBasicParsing | Select-Object StatusCode
```

### 任务 D：跑种子数据（本地 SQLite）

```powershell
cd D:\webgame
$env:DATABASE_URL = "file:./prisma/dev.db"
node prisma/seed.js
```

> 注意：`prisma/seed.js` 默认连本地 Prisma，**不会**自动用 Turso adapter。要给 Turso 灌数据需另写脚本或手动插入。

---

## 9. 安全规则（AI 必须遵守）

1. **永远不要** 把 `.env` 内容 commit 到 GitHub  
2. **永远不要** 在 PR、Issue、公开文档里粘贴完整 Token  
3. Token 泄露后：Turso / Vercel 控制台 **撤销并重建**  
4. 用户说「发给我 token」时，只说明**去 `.env` 哪一行看**，不要重复贴全文到聊天  
5. 只有用户**明确要求**时才 `git commit` / `git push`

---

## 10. 文件索引

| 文件 | 作用 |
|------|------|
| `.env` | 所有密钥（本地专用） |
| `AI_OPS.md` | 本手册 |
| `src/lib/db.ts` | 本地 SQLite / Turso 切换逻辑 |
| `vercel.json` | Vercel 构建命令 |
| `prisma/schema.prisma` | 数据库模型 |
| `.vercel/` | Vercel 项目关联信息（可提交也可不提交） |

---

## 11. 给人类主人的一句话

你是菜鸟也没关系：**改代码 → `npm run build` 能过 → `vercel --prod --yes` 部署**。  
数据库和密钥都在 `.env`；搞不定就把 **`AI_OPS.md` + `.env` 路径** 发给下一个 AI，让它从 **第 2 节** 开始执行。
