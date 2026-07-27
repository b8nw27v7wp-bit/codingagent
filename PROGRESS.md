# AI 编程教学助手 — 开发进度记录

> 更新：2026-07-27 | 版本 v0.3 | 构建 ✅ | 测试 ✅ | 9 条路由 | 53 tests

---

## ✅ 已完成模块

### 🤖 AI 对话辅导
- [x] DeepSeek API 直连（1.3s 响应）
- [x] 流式输出 (SSE) — 打字机效果 + 停止按钮
- [x] Socratic 教学 Prompt（5 级渐进提示 + 话题限制）
- [x] 对话历史 localStorage 持久化 + 清除功能
- [x] Ctrl+Enter 发送

### 📚 课程系统
- [x] 10 课时 Python 基础（print → 综合项目）
- [x] MDX 文件格式（frontmatter + 内容分离）
- [x] Markdown → HTML 渲染（代码高亮、表格、链接、图片、有序列表）
- [x] 课程列表 / 课程目录 / 课时 3 层路由
- [x] 上下课导航

### 💻 在线练习
- [x] Monaco Editor（VS Code 内核，Python 语法高亮 + 智能补全）
- [x] Python 沙箱执行（安全过滤 + 10s 超时 + 错误分离）
- [x] 代码自动保存到 localStorage
- [x] Ctrl+Enter 运行 / Ctrl+S 保存

### 🧪 代码评测（核心创新点）
- [x] 测试用例对比（实际输出 vs 预期输出）
- [x] AI Review 辅导（失败时自动触发，Socratic 引导）
- [x] 20 道编程练习题（每课 2 题，含提示）
- [x] 渐进式提示（显示/隐藏）
- [x] 结果可视化（通过/失败 + 差异对比）

### 📊 学习数据看板
- [x] 4 张总览卡片（总体进度/课时/练习/最近学习）
- [x] CSS 进度条（课程 + 练习分开）
- [x] 空状态引导
- [x] 跨标签页 localStorage 同步

### 🎨 UI/UX
- [x] shadcn/ui 11 个组件
- [x] 暗色/亮色模式切换（next-themes，跟随系统）
- [x] **Toast 通知系统**（成功/错误/信息/警告 4 种类型）
- [x] 移动端响应式（2 列→4 列适配，文字/图标缩放）
- [x] **Accessibility**（跳过导航、aria-label、语义化 HTML）
- [x] 4 标签首页（课程/练习/AI/数据）
- [x] 完成状态 ✓ 图标

### 🧪 测试（毕业设计必需）
- [x] **Vitest** 配置 + 5 个测试文件
- [x] `courses.test.ts` — 14 项（Markdown 渲染、HTML 转义）
- [x] `courses-db.test.ts` — 7 项（课程加载、课程结构验证）
- [x] `exercises.test.ts` — 10 项（题库加载、字段完整性）
- [x] `sandbox-safety.test.ts` — 14 项（安全过滤）
- [x] `prompts.test.ts` — 8 项（教学 Prompt 结构）
- [x] **53/53 全部通过**

### 🔧 工程质量
- [x] TypeScript 严格模式
- [x] 统一 API Key 管理（单例 + 缓存）
- [x] LLM Provider 抽象层（DeepSeek / OpenCode 可互换）
- [x] 共享安全过滤模块（`lib/sandbox-safety.ts`，3 处引用统一）
- [x] `cross-spawn` 替代 `child_process.exec`（Windows 兼容）
- [x] 3 处重复 `getApiKey` → 统一 `getDeepSeekApiKey`（代码审查修复）
- [x] `.gitignore` 排除 `.env.local` / `node_modules` / `.next`

---

## 📊 项目数据

| 指标 | 数值 |
|---|---|
| 路由数 | 9（2 静态 + 7 动态） |
| 课程 | 10 课时 |
| 练习题 | 20 道 |
| React 组件 | 18 个（6 业务 + 11 UI + 1 Toast） |
| API 端点 | 4 |
| 测试 | 53 项（5 文件） |
| TypeScript 文件 | 22+ |
| MDX 文件 | 10 |
| JSON 题库 | 20 |

### 测试覆盖

| 模块 | 测试数 | 覆盖范围 |
|---|---|---|
| `lib/courses.ts` | 21 | Markdown 渲染、HTML 转义、课程加载 |
| `lib/exercises.ts` | 10 | 题库加载、字段完整性 |
| `lib/sandbox-safety.ts` | 14 | 安全过滤白名单/黑名单 |
| `lib/prompts/tutor.ts` | 8 | Prompt 结构、教学策略 |

### API 性能

| 端点 | 平均响应 |
|---|---|
| `/api/ai/chat` | ~1.3s |
| `/api/ai/chat/stream` | ~1.3s（首字） |
| `/api/code/run` | ~0.5s |
| `/api/code/evaluate` | ~1.5s（含 AI Review） |

---

## 📋 剩余任务（P2 低优先级）

| # | 任务 | 说明 |
|---|---|---|
| 1 | 部署上线 | Vercel / Docker |
| 2 | 论文写作 | 系统设计 + 实现 + 测试三章 |
| 3 | 答辩准备 | PPT + 演示视频 |

