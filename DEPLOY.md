# 部署指南

## 方式一：Docker Compose（推荐，自托管完整版）

应用 + MySQL 一键启动，包含全部功能（AI 对话、课程、练习、评测、用户系统、进度同步）。

```bash
# 1. 准备环境变量（在项目根目录创建 .env）
cp .env.example .env
# 编辑 .env：
#   AUTH_SECRET=随机 32 字节 hex（openssl rand -hex 32）
#   DB_PASSWORD=数据库密码（首次启动自动创建 MySQL 实例）

# 2. 启动
docker compose up -d --build

# 3. 访问 http://localhost:3000
```

- 数据持久化在 Docker volume `mysql-data`，重启/升级不丢
- 代码沙箱在容器内运行（自带 Node.js + Python3）
- 日志查看：`docker compose logs -f app`

## 方式二：Vercel（仅基础功能）

Vercel serverless 环境**无法运行代码沙箱**（子进程执行 Python/Node 被禁止），也**没有 MySQL**。可部署但以下功能不可用：

- ❌ 在线练习执行（/api/code/run）与评测（/api/code/evaluate）
- ❌ 用户系统（需外部 MySQL 云服务，如 PlanetScale / Neon）
- ✅ AI 对话、课程浏览、学习看板（游客模式）

如需 Vercel 完整功能，可搭配：
- 外部 MySQL 云服务，并配置 `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME`
- 独立的代码执行服务（如自托管沙箱 API）

## 环境变量清单

| 变量 | 必需 | 说明 |
|---|---|---|
| `AUTH_SECRET` | ✅ | NextAuth 会话签名密钥，`openssl rand -hex 32` 生成 |
| `AUTH_TRUST_HOST` | 部署时 | 非 Vercel 平台部署设 `true`（否则 localhost 访问会被拒） |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | ✅ | MySQL 连接（本地默认 127.0.0.1:3306 root / ai_tutor） |
| `DEEPSEEK_API_KEY` | 可选 | 服务端兜底 Key（BYOK 模式下客户端可不填） |

## 本地开发

```bash
npm install
npm run dev        # 需本机 MySQL 运行中（默认连 127.0.0.1:3306，库名 ai_tutor）
```

首次启动会自动创建 `users` / `user_progress` 表（无需手动建表）。
