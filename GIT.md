# Git 操作说明 · webvibc

> **项目目录**：`D:\webvibc`  
> **用途**：网站设计与落地页（配合词语 Drill 推广）  
> **GitHub 账号**：`k114413450-stack`（本机 `gh` 已登录）  
> **最后更新**：2026-06-10

本文档从 `listening-lab/AI_WEB_OPS.md` 提取并改写，专供 **webvibc** 项目使用。

---

## 1. 项目关系

| 项目 | 路径 | 说明 |
|------|------|------|
| **webvibc** | `D:\webvibc` | 新网站 / 落地页（本目录） |
| **listening-drill** | `D:\listening-lab` | 词语 Drill 源码与演示后端 |

- 演示站：https://listeningdrill.onrender.com/  
- 源码仓库：https://github.com/k114413450-stack/listening-drill  

webvibc 可以是**独立静态站**，或日后单独建 GitHub 仓库；下文按「本目录自己的 Git 仓库」编写。

---

## 2. 日常查看状态

```powershell
cd D:\webvibc
git status
git diff
git log -5 --oneline
```

---

## 3. 首次关联 GitHub（仓库尚未创建时）

### 3.1 用 GitHub CLI 创建远程仓库并推送

```powershell
cd D:\webvibc

# 创建 GitHub 仓库（公开示例；私有加 --private）
gh repo create webvibc --public --source=. --remote=origin --description "词语 Drill 推广网站"

git add .
git commit -m "Initial commit: webvibc site"
git branch -M main
git push -u origin main
```

### 3.2 已有 GitHub 仓库，只加 remote

```powershell
cd D:\webvibc
git remote add origin https://github.com/k114413450-stack/webvibc.git
git branch -M main
git push -u origin main
```

查看远程：

```powershell
git remote -v
```

---

## 4. 提交并推送

```powershell
cd D:\webvibc

git status
git diff

git add .
# 提交前确认 status 里没有 .env、密钥文件

git commit -m "简述改动原因（中文或英文均可）"

git push origin main
```

### 切勿提交

| 文件 | 原因 |
|------|------|
| `.env` | 含 API Key / 密钥 |
| `*.key`、`credentials.json` 等 | 敏感信息 |
| 本地大体积缓存、构建产物 | 除非 `.gitignore` 已明确需要 |

提交前务必：`git status` 看一眼。

---

## 5. 分支与 Pull Request

```powershell
cd D:\webvibc

git checkout -b feature/landing-redesign
# ... 改代码 ...
git add .
git commit -m "Redesign hero section"
git push -u origin feature/landing-redesign

gh pr create --title "Landing 改版" --body "## Summary
- 改动点 1
- 改动点 2

## Test plan
- [ ] 本地打开页面正常
- [ ] 移动端布局正常
"
```

查看 PR：

```powershell
gh pr list
gh pr view 1 --web
```

---

## 6. 回滚本地未提交改动

```powershell
cd D:\webvibc

git restore index.html          # 单文件
git restore .                   # 全部未暂存（慎用）
```

---

## 7. GitHub CLI（`gh`）常用命令

```powershell
gh auth status
gh repo view k114413450-stack/webvibc --web
gh repo view k114413450-stack/webvibc
```

### 改仓库描述 / 主页链接

```powershell
gh repo edit k114413450-stack/webvibc `
  --description "词语 Drill 推广站" `
  --homepage "https://listeningdrill.onrender.com/"
```

### 克隆其他项目（参考）

```powershell
git clone https://github.com/k114413450-stack/listening-drill.git D:\listening-lab
```

---

## 8. 与 listening-drill 协作时的注意点

若 webvibc 只改**静态落地页**，listening-drill 仍负责**应用本体**：

1. **webvibc** → 自己的 `git push`（独立仓库或独立分支）  
2. **listening-drill** → `D:\listening-lab` 里 push，Render 会自动部署演示站  

不要把 `listening-lab` 里的 `GK.txt`、`.env`、`data/` 复制进 webvibc 并提交。

---

## 9. 安全规则（AI / 人工均遵守）

- **不要** force push `main`  
- **不要**在代码或 Markdown 里写真实 API Key  
- **不要** `git commit --amend` 已 push 的 commit（除非明确需要且未共享）  
- 用 `gh` / Dashboard 管理 Secrets，不要写进仓库  

---

## 10. 推荐 `.gitignore`（静态站）

可在 `D:\webvibc\.gitignore` 中加入：

```gitignore
.env
.env.*
node_modules/
dist/
.DS_Store
Thumbs.db
*.log
```

---

## 11. 快速命令备忘

```powershell
cd D:\webvibc
git status
git add .
git commit -m "你的说明"
git push origin main
gh repo view --web
```

---

**相关文档**：完整部署与 Render CLI 见 `D:\listening-lab\AI_WEB_OPS.md`（§7 起）。
