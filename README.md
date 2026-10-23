# AI 编程教学助手（codingagent）

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

> 面向编程零基础初学者的智能辅导系统：课程 + 在线练习 + 代码评测 + 苏格拉底式 AI 辅导，让学习者**自己写出答案**而不是抄答案。

集成了大语言模型，但刻意不用「直接给代码」的问答方式——AI 的角色是提问、给提示、指出错误，把学生推回编辑器。3 门课程、30 课时、60 道练习题，练习在浏览器里用 VS Code 同款编辑器写，提交后跑测试用例并附 AI 评审。

## 它能做什么

### 按课程学

- **3 门交互式课程**，各 10 课时，共 30 课时：
  - Python 基础：认识 Python → 变量 / 数据类型 / 输入输出 / 条件 / 循环 / 列表 / 函数 / 字典 → 综合项目
  - JavaScript 基础：同样的零基础路径，落到数组 / 函数 / 对象 → 综合项目
  - 算法入门（Python）：时间复杂度、枚举、双指针、贪心、递归、排序、二分查找、栈与队列 → 查找与排序工具箱
- 课时正文用 MDX 写（`content/<course>/NN-*.mdx`），带目录、进度与上一课/下一课跳转
- 每课时配 2 道练习，共 **60 道**

### 在浏览器里写代码

- **Monaco Editor**（VS Code 内核）：语法高亮、自动补全、快捷键一致
- **多语言沙箱**：Python 与 JavaScript 子进程执行（`cross-spawn`，Windows 兼容），返回 stdout/stderr/耗时
- **安全过滤**：拦截 `import os` / `subprocess` / `eval` / `exec` / `require` / `process` 等危险调用，10 秒超时防死循环，输入上限 50KB

### 被评测，也被追问

- **代码自动评测**：跑该题的测试用例给出通过/失败明细，再叠加一次 AI Review 指出可改进处（`/api/code/evaluate`）
- **苏格拉底式辅导**：教学 Prompt 内置 5 级渐进提示策略——从「再读一遍题目」到「给你关键一行」，逐级放开，不直接贴完整答案
- **流式对话**：SSE 打字机效果，可中断；对话历史持久化，多轮上下文延续；支持语音输入与 Ctrl+Enter 发送

### 看得到进度

- 学习看板：课程完成度、练习通过率、学习时长与连续天数
- 进度存 MySQL（`mysql2`）并按账号同步；未登录时退回本地存储
- 账号体系：NextAuth 登录 + 注册接口（`bcryptjs` 哈希密码）

### 自带 Key（BYOK）

两种 Key 来源，**优先客户端自带的**：

1. 客户端填写（推荐）：问答面板右上角填自己的 DeepSeek Key，仅存浏览器 localStorage，随请求头 `x-api-key` 发送，费用走自己的账户，不写服务器
2. 服务端兜底：`.env.local` 配 `DEEPSEEK_API_KEY`，仅当客户端没给 Key 时使用，适合本地调试或自托管演示

部署给他人使用时建议**不要**配服务端 Key。

## 技术栈

| 层 | 选型 | 说明 |
| --- | --- | --- |
| 框架 | Next.js 16（App Router） | Server Component + Route Handler，`next build` 自带类型检查 |
| 语言 | TypeScript 5 | 全仓 strict |
| 样式 | Tailwind CSS 4 + shadcn/ui（@base-ui） | 浅色极简，暗色模式由 `next-themes` 跟随系统 |
| 编辑器 | @monaco-editor/react | VS Code 同款编辑体验 |
| 沙箱 | Python / Node.js 子进程（cross-spawn） | 跨平台执行 + 白名单/黑名单过滤 + 超时 |
| 数据库 | MySQL（mysql2） | 课程入库、学习进度、账号 |
| 认证 | NextAuth + bcryptjs | 登录会话 + 注册密码哈希 |
| LLM | DeepSeek Chat（OpenAI 兼容） | Provider 抽象层，可换实现；流式与非流式两条链路 |
| 内容 | MDX + JSON 题库 | 课程与题目是文件，不进数据库也能跑 |
| 测试 | Vitest | 77 项，覆盖渲染/题库/沙箱安全/进度订阅/健康检查 |
| 部署 | Vercel / Docker | `Dockerfile` + `docker-compose.yml` 已备 |

## 架构

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
│  /api/courses  /api/progress  /api/auth/*  /api/health │
├────────────────────────────────────────────────────────┤
│                   核心逻辑层                              │
│  LLM Provider (DeepSeek)  │  课程引擎  │  评测引擎      │
│  教学 Prompt 模板          │  MDX 解析  │  沙箱执行      │
├────────────────────────────────────────────────────────┤
│                  数据 / 存储层                            │
│  MySQL (课程/进度/账号)  │  MDX 文件系统  │  JSON 题库  │
└────────────────────────────────────────────────────────┘
```

## 快速开始

环境要求：Node.js ≥ 18、Python ≥ 3.8（Python 沙箱）、MySQL（可选，不配则进度存本地）

```bash
npm install
echo "DEEPSEEK_API_KEY=sk-xxx" > .env.local   # 可选：服务端兜底 Key
npm run dev                                    # http://localhost:3000
```

生产构建：

```bash
npm run build && npm start
```

## API 端点

| 端点 | 方法 | 说明 |
| --- | --- | --- |
| `/api/ai/chat` | POST | 非流式 AI 对话 |
| `/api/ai/chat/stream` | POST | 流式 AI 对话（SSE） |
| `/api/code/run` | POST | 多语言代码沙箱执行 |
| `/api/code/evaluate` | POST | 代码评测 + AI Review |
| `/api/courses` | GET | 课程列表 |
| `/api/progress` | GET / POST | 学习进度读取与保存 |
| `/api/auth/register` | POST | 注册 |
| `/api/auth/[...nextauth]` | GET / POST | NextAuth 登录会话 |
| `/api/health` | GET | 健康检查（`{status, db, uptime}`，数据库 SELECT 1 超时兜底） |

```bash
# 流式对话（客户端自带 Key）
curl -X POST http://localhost:3000/api/ai/chat/stream \
  -H "Content-Type: application/json" -H "x-api-key: sk-xxx" \
  -d '{"message": "什么是变量？"}'

# 代码执行（Python）
curl -X POST http://localhost:3000/api/code/run \
  -H "Content-Type: application/json" \
  -d '{"code": "print(\"Hello!\")", "language": "python"}'

# 代码评测
curl -X POST http://localhost:3000/api/code/evaluate \
  -H "Content-Type: application/json" \
  -d '{"code": "print(\"Hello, World!\")", "exerciseId": "python-basics-01-01"}'
```

## 课程内容

| 课程 | 课时 | 练习题 | 覆盖 |
| --- | --- | --- | --- |
| Python 基础 | 10 | 20 | 变量、数据类型、输入输出、条件、循环、列表、函数、字典、综合项目 |
| JavaScript 基础 | 10 | 20 | 变量与常量、数据类型、输入输出、条件、循环、数组、函数、对象、综合项目 |
| 算法入门（Python） | 10 | 20 | 复杂度、枚举、双指针、贪心、递归、排序、二分查找、栈与队列、综合项目 |

合计 **3 门课程 / 30 课时 / 60 道编程练习题**。课时与题目都是仓库里的文件（`content/<course>/NN-*.mdx` 与 `content/<course>/exercises/`），加课不用改代码。

## 目录结构

```
app/
  page.tsx                    # 首页（4 标签页）
  courses/                    # 课程列表 → 目录 → 课时（MDX 渲染 + 练习）
  api/ai/chat{,/stream}/      # AI 对话（非流式 / SSE 流式）
  api/code/run|evaluate/      # 沙箱执行 / 评测 + AI Review
  api/courses|progress|health/ # 课程列表 / 进度读写 / 健康检查
  api/auth/{register,[...nextauth]}/  # 注册 / 登录会话
components/
  tutor/chat-panel.tsx        # 对话面板（流式 + 持久化 + BYOK）
  tutor/code-playground.tsx   # Monaco 练习环境
  tutor/exercise-panel.tsx    # 练习评测面板
  tutor/learning-dashboard.tsx # 学习看板
  ui/                         # shadcn/ui 组件
lib/
  courses.ts  exercises.ts  progress.ts   # 课程加载（MDX→HTML）/ 题库 / 进度
  code-runner.ts  sandbox-safety.ts       # 多语言执行 / 安全过滤
  api-key.ts                              # BYOK Key 管理
  llm/{provider,deepseek,opencode}.ts     # Provider 抽象与实现
  prompts/tutor.ts                        # 教学 Prompt（5 级渐进提示）
content/{python-basics,javascript-basics,algorithms-python}/  # 课时 MDX + 题目 JSON
tests/                        # Vitest（77 项）
```

## 测试

```bash
npm test        # 77 项
npm run build   # 生产构建（含类型检查）
```

| 模块 | 用例 | 覆盖范围 |
| --- | --- | --- |
| `lib/courses.ts` | 14 | Markdown 渲染、HTML 转义、课程加载 |
| `lib/courses-db.ts` | 7 | 课程入库与数据库读取 |
| `lib/db-health.ts` | 4 | 数据库连通性探活与超时兜底 |
| `lib/exercises.ts` | 10 | 题库加载、字段完整性 |
| `lib/sandbox-safety.ts` | 25 | Python/JS 安全过滤白名单/黑名单 |
| `lib/prompts/tutor.ts` | 8 | Prompt 结构与教学策略 |
| `lib/progress-hook.test.tsx` | 7 | 进度订阅 / 刷新 / storage 事件 |
| `app/api/health` | 2 | 健康检查路由 |

合计 77 项（上表为 `it()` 用例数，`it.each` 展开后总数为 77）。

## 部署

**Vercel**：导入仓库即可部署（客户端自带 Key 时无需配置服务端 `DEEPSEEK_API_KEY`）。注意 Vercel 无 Python/Node 子进程运行时，**代码执行功能需自备环境**。

**Docker**：

```bash
docker build -t ai-coding-tutor .
docker run -p 3000:3000 ai-coding-tutor
```

## 安全措施

- API Key 不进仓库（`.env.local` 已 gitignore）；BYOK 的 Key 只存浏览器 localStorage，经 `x-api-key` 请求头传输
- 代码沙箱拦截 `import os` / `subprocess` / `eval` / `exec` / `require` / `process`
- 10 秒执行超时、50KB 输入上限
- 安全响应头（X-Frame-Options / nosniff / Referrer-Policy / XSS Protection）
- `cross-spawn` 替代 `child_process.exec`（Windows 兼容，避免命令拼接注入）

## 已知限制

- 沙箱是**子进程 + 关键词过滤**，不是容器级隔离；面向教学场景，不要拿去跑不可信代码。
- 评测依赖每题预置的测试用例，题目质量决定评测质量；自由发挥的写法可能被判错。
- 课程与题库是静态文件，改内容要发版，没有教师后台。
- Vercel 等无状态平台跑不了代码执行，部署到这类平台时「练」的环节会失效。

## License

MIT
