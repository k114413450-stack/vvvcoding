# Git 操作说明 · vvvcoding

> **项目目录**：`D:\webgame`  
> **用途**：Webgame 模拟交易与开发者论坛  
> **GitHub 账号**：`k114413450-stack`（本机 `gh` 已登录）  
> **最后更新**：2026-07-08

本文档专供 **webgame** (`vvvcoding`) 项目使用。

---

## 1. 项目关系

| 项目 | 路径 | 说明 |
|------|------|------|
| **webgame** | `D:\webgame` | 模拟交易系统与开发社区论坛（本目录） |
| **listening-drill** | `D:\listening-lab` | 词语 Drill 源码与演示后端 |

- 源码仓库：https://github.com/k114413450-stack/vvvcoding
- Vercel 线上：https://vvvcoding.vercel.app/

---

## 2. 日常查看状态

```powershell
cd D:\webgame
git status
git diff
git log -5 --oneline
```

---

## 3. 首次关联 GitHub（仓库已创建）

关联当前 `vvvcoding` 仓库：

```powershell
cd D:\webgame
git remote add origin https://github.com/k114413450-stack/vvvcoding.git
git branch -M master
git push -u origin master
```

查看远程：

```powershell
git remote -v
```

---

## 4. 提交并推送

```powershell
cd D:\webgame

git status
git diff

git add .
# 提交前确认 status 里没有 .env、GK.txt、密钥文件

git commit -m "简述改动原因（中文或英文均可）"

git push origin master
```

### 切勿提交

| 文件 | 原因 |
|------|------|
| `.env` | 含 API Key / 密钥 |
| `GK.txt` | 含 API Key / 密钥 |
| `*.key`、`credentials.json` 等 | 敏感信息 |
| 本地大体积缓存、构建产物 | 除非 `.gitignore` 已明确需要 |

提交前务必：`git status` 看一眼。

---

## 5. 分支与 Pull Request

```powershell
cd D:\webgame

git checkout -b feature/trading-redesign
# ... 改代码 ...
git add .
git commit -m "Redesign trading HUD"
git push -u origin feature/trading-redesign

gh pr create --title "Trading 改版" --body "## Summary
- 改动点 1
- 改动点 2

## Test plan
- [ ] 本地打开页面正常
- [ ] 模拟回测正常
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
cd D:\webgame

git restore public/trade.html   # 单文件
git restore .                   # 全部未暂存（慎用）
```

---

## 7. GitHub CLI（`gh`）常用命令

```powershell
gh auth status
gh repo view k114413450-stack/vvvcoding --web
gh repo view k114413450-stack/vvvcoding
```

### 改仓库描述 / 主页链接

```powershell
gh repo edit k114413450-stack/vvvcoding `
  --description "VVVCODING 模拟交易与开发社区" `
  --homepage "https://vvvcoding.vercel.app/"
```

### 克隆其他项目（参考）

```powershell
git clone https://github.com/k114413450-stack/listening-drill.git D:\listening-lab
```

---

## 8. 与 listening-drill 协作时的注意点

1. **webgame** → 自己的 `git push`（本仓库）  
2. **listening-drill** → `D:\listening-lab` 里 push，Render 会自动部署演示站  

不要把 `listening-lab` 里的 `GK.txt`、`.env`、`data/` 复制并提交。

---

## 9. 安全规则（AI / 人工均遵守）

- **不要** force push `master`  
- **不要**在代码或 Markdown 里写真实 API Key（例如 GK.txt 不要被 add/commit 到 Git）  
- **不要** `git commit --amend` 已 push 的 commit（除非明确需要且未共享）  
- 用 Vercel 控制台管理 Secrets，不要写进仓库  

---

## 10. 推荐 `.gitignore`

已在 `D:\webgame\.gitignore` 中加入，确保不要漏掉 `.env` 和 `GK.txt`。

---

## 11. 快速命令备忘

```powershell
cd D:\webgame
git status
git add .
git commit -m "你的说明"
git push origin master
gh repo view --web
```
