# AI 编程教学助手

> 本科毕业设计项目 — 基于大语言模型的编程初学者智能辅导系统

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![DeepSeek](https://img.shields.io/badge/LLM-DeepSeek--Chat-purple)](https://deepseek.com/)
[![Build](https://img.shields.io/badge/build-passing-brightgreen)]()

---

## 📖 项目简介

**AI 编程教学助手**是一个面向编程零基础初学者的智能辅导 Web 应用。系统基于 Next.js 构建，集成 DeepSeek 大语言模型，通过苏格拉底式引导教学法，帮助学生**自己学会编程**，而非直接获取答案。

### 🎯 核心特色

- 🤖 **AI 对话辅导** — 苏格拉底式提问，5 级渐进提示策略
- 📚 **结构化课程** — 10 课时 Python 基础，配合生活比喻
- 💻 **在线练习环境** — Monaco Editor (VS Code 内核) + Python 沙箱
- 🧪 **代码自动评测** — 测试用例验证 + AI Review 反馈
- 📊 **学习数据看板** — 进度可视化，统计追踪
- 🌓 **暗色模式** — 跟随系统 / 手动切换
- ⚡ **流式输出** — AI 回答打字机效果，1.3s 首字响应

---

## 🏗 系统架构

```
┌────────────────────────────────────────────────────────┐
│              浏览器 (Next.js App Router)                 │
│  ┌──────────┬──────────────┬──────────────┬──────────┐ │
│  │ 课程学习  │  在线练习     │  AI 辅导     │ 学习数据  │ │
│  │ (MDX)    │ (Monaco)     │ (流式对话)   │ (看板)    │ │
│  └──────────┴──────────────┴──────────────┴──────────┘ │
├────────────────────────────────────────────────────────┤
│                  API 层 (Route Handlers)                │
│  /api/ai/chat  /api/ai/chat/stream                     │
│  /api/code/run  /api/code/evaluate                     │
├────────────────────────────────────────────────────────┤
│                   核心逻辑层                              │
│  LLM Provider (DeepSeek)  │  课程引擎  │  评测引擎      │
│  教学 Prompt 模板          │  MDX 解析  │  沙箱执行      │
├────────────────────────────────────────────────────────┤
│                  数据 / 存储层                            │
│  localStorage (进度/对话)  │  MDX 文件系统  │  JSON 题库 │
└────────────────────────────────────────────────────────┘
```

---

## 🚀 快速开始

### 环境要求

- Node.js ≥ 18
- Python ≥ 3.8（代码沙箱执行）
- DeepSeek API Key（可选，[获取地址](https://platform.deepseek.com/)）

### 安装运行

```bash
# 1. 克隆项目
git clone <repo-url>
cd ai-coding-tutor

# 2. 安装依赖
npm install

# 3.（可选）配置服务端兜底 API Key
echo "DEEPSEEK_API_KEY=«redacted:sk-…»" > .env.local

# 4. 启动开发服务器
npm run dev

# 5. 打开浏览器访问
# http://localhost:3000
```

### API Key 模式（BYOK）

项目支持两种 API Key 来源，**优先使用客户自带的 Key**：

1. **客户端填写（推荐）**：打开智能问答面板，点击右上角 🔑 按钮，填入你自己的 DeepSeek API Key。Key 仅保存在浏览器 localStorage，请求时通过 `x-api-key` 请求头发送，费用由你的账户承担，不会写入服务器。
2. **服务端配置（兜底）**：`.env.local` 中配置 `DEEPSEEK_API_KEY`。仅当客户端未提供 Key 时使用，适合开发调试或自托管演示。

> 部署给客户使用时，建议**不要**配置服务端 Key，让每个客户使用自己的 Key。

### 生产构建

```bash
npm run build
npm start
```

---

## 📁 项目结构

```
ai-coding-tutor/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 根布局（Theme + Tooltip）
│   ├── page.tsx                  # 首页（4 标签页）
│   ├── api/
│   │   ├── ai/
│   │   │   ├── chat/route.ts     # 非流式 AI 对话
│   │   │   └── chat/stream/route.ts  # 流式 AI (SSE)
│   │   └── code/
│   │       ├── run/route.ts      # Python 沙箱执行
│   │       └── evaluate/route.ts # 代码评测 + AI Review
│   └── courses/
│       ├── page.tsx              # 课程列表页
│       └── [courseId]/
│           ├── page.tsx          # 课程目录（含进度）
│           └── [lessonId]/page.tsx  # 课时内容 + 练习
├── components/
│   ├── ui/                       # shadcn/ui 组件库
│   ├── theme-provider.tsx        # 暗色模式 Provider
│   ├── theme-toggle.tsx          # 主题切换按钮
│   └── tutor/
│       ├── chat-panel.tsx        # AI 对话面板（流式+持久化）
│       ├── code-playground.tsx   # Monaco Editor 练习环境
│       ├── exercise-panel.tsx    # 练习评测面板
│       ├── learning-dashboard.tsx # 学习数据看板
│       └── lesson-*.tsx          # 进度追踪组件
├── lib/
│   ├── api-key.ts                # BYOK Key 管理（请求头优先，服务端兜底）
│   ├── courses.ts                # 课程加载 + MDX→HTML
│   ├── exercises.ts              # 练习题加载器
│   ├── progress.ts               # 学习进度管理
│   ├── llm/                      # LLM Provider 抽象层
│   │   ├── provider.ts           # 接口定义
│   │   ├── deepseek.ts           # DeepSeek 直连
│   │   └── opencode.ts           # OpenCode CLI 兜底
│   └── prompts/
│       └── tutor.ts              # 教学 Prompt 模板
├── content/
│   └── python-basics/            # Python 基础课程
│       ├── manifest.json         # 课程元信息
│       ├── 01-*.mdx ~ 10-*.mdx   # 10 节 MDX 课时
│       └── exercises/            # 20 道练习题 (JSON)
├── docs/                         # 毕设文档
├── PROGRESS.md                   # 开发进度记录
├── ROADMAP.md                    # 后续路线图
└── IDEA.md                       # 项目原始构想
```

---

## 🔌 API 端点

| 端点 | 方法 | 说明 | 响应时间 |
|---|---|---|---|
| `/api/ai/chat` | POST | 非流式 AI 对话 | ~1.3s |
| `/api/ai/chat/stream` | POST | 流式 AI 对话 (SSE) | ~1.3s 首字 |
| `/api/code/run` | POST | Python 代码执行 | ~0.5s |
| `/api/code/evaluate` | POST | 代码评测 + AI Review | ~1.5s |

### 请求示例

```bash
# AI 对话（客户端自带 Key，通过 x-api-key 请求头传入）
curl -X POST http://localhost:3000/api/ai/chat/stream \
  -H "Content-Type: application/json" \
  -H "x-api-key: sk-你的DeepSeekKey" \
  -d '{"message": "什么是变量？"}'

# AI 对话（不传 x-api-key 时回退服务端 .env.local 配置）
curl -X POST http://localhost:3000/api/ai/chat/stream \
  -H "Content-Type: application/json" \
  -d '{"message": "什么是变量？"}'

# 代码评测
curl -X POST http://localhost:3000/api/code/evaluate \
  -H "Content-Type: application/json" \
  -d '{"code": "print(\"Hello, World!\")", "exerciseId": "python-basics-01-01"}'
```

---

## 📊 课程内容

| # | 课时 | 时长 | 练习题 |
|---|---|---|---|
| 01 | 认识 Python | 15min | 2 题 |
| 02 | 变量与赋值 | 20min | 2 题 |
| 03 | 数据类型 | 25min | 2 题 |
| 04 | 输入与输出 | 20min | 2 题 |
| 05 | 条件判断 | 25min | 2 题 |
| 06 | 循环结构 | 30min | 2 题 |
| 07 | 列表 | 25min | 2 题 |
| 08 | 函数 | 30min | 2 题 |
| 09 | 字典 | 25min | 2 题 |
| 10 | 综合项目 | 45min | 2 题 |

**总计：10 课时，20 道编程练习题**

---

## 🛠 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript 5 |
| 样式 | Tailwind CSS 4 + shadcn/ui |
| 编辑器 | Monaco Editor (@monaco-editor/react) |
| AI | DeepSeek Chat API (OpenAI 兼容) |
| 主题 | next-themes (暗色模式) |
| 沙箱 | Python 子进程 (cross-spawn) |
| 图标 | Lucide React |
| 包管理 | npm |

---

## 🌍 部署

### Vercel（推荐）

1. 推送项目到 GitHub
2. 在 [Vercel](https://vercel.com) 导入仓库
3. 部署即可（客户端自带 Key，**无需**配置服务端 `DEEPSEEK_API_KEY`）
4. 如需服务端兜底，配置环境变量 `DEEPSEEK_API_KEY`

> ⚠️ 注意：Vercel 环境可能没有 Python 运行时，代码执行功能需额外的 Python 环境支持。

### Docker

```bash
docker build -t ai-coding-tutor .
docker run -p 3000:3000 ai-coding-tutor
# 客户端自带 Key；如需服务端兜底：-e DEEPSEEK_API_KEY=sk-xxx
```

---

## 📝 毕设论文配合

本项目是本科毕业设计的工程实现部分，配套论文需涵盖：

| 论文章节 | 对应代码 |
|---|---|
| 系统设计 | `lib/llm/` — Provider 抽象架构 |
| AI 教学策略 | `lib/prompts/tutor.ts` — Socratic Prompt |
| 代码评测 | `app/api/code/evaluate/` — 沙箱 + AI Review |
| 前端实现 | `components/tutor/` — React 组件 |
| 测试评估 | API 响应时间、Lighthouse 评分 |

---

## 🔒 安全措施

- ✅ API Key 不提交到仓库（`.env.local` 已被 gitignore）
- ✅ BYOK 模式：客户 Key 仅存浏览器 localStorage，经 `x-api-key` 请求头传输，不落服务器
- ✅ 客户 Key 优先于服务端配置；错误响应由 DeepSeek 自动打码，不泄露完整 Key
- ✅ 代码沙箱拦截 `import os`/`subprocess`/`eval`/`exec`
- ✅ 10 秒超时防止死循环
- ✅ 输入长度限制（50KB）
- ✅ `cross-spawn` 替代 `child_process.exec`
