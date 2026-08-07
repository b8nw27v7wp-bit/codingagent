# AI 编程教学助手 — 开发路线图

> 当前版本：v0.6 | 13 条路由 | 64 项测试 | 3 门课程 | 已推送 GitHub

---

## 一、已交付模块（全部完成）

| 模块 | 状态 | 核心内容 |
|---|---|---|
| 🏗 项目骨架 | ✅ | Next.js 16 + TS + Tailwind + shadcn/ui (11 组件) |
| 🤖 AI 对话辅导 | ✅ | SSE 流式 + Socratic 5 级引导 + 历史持久化 |
| 📚 课程系统 | ✅ | 10 课时 Python + MDX 渲染 + 链接/图片/代码高亮 |
| 💻 在线练习 | ✅ | Monaco Editor + Python 沙箱 + 安全过滤 + 自动保存 |
| 🧪 代码评测 | ✅ | 20 道练习题 + 测试用例 + AI Review + 渐进提示 |
| 📊 学习数据 | ✅ | 4 卡片看板 + CSS 进度条 + 跨标签页同步 |
| 🎨 暗色模式 | ✅ | next-themes，跟随系统 |
| 📱 响应式 | ✅ | 2 列→4 列适配，移动端可用 |
| 🔔 Toast 通知 | ✅ | 4 种类型（成功/错误/信息/警告） |
| ♿ 无障碍 | ✅ | 跳过导航、aria-label、语义化 HTML |
| 🧪 单元测试 | ✅ | Vitest 53 项，5 文件，100% 通过 |
| 🔧 代码质量 | ✅ | 统一 API Key + 安全模块化 + cross-spawn |
| 🚀 Git 部署 | ✅ | 推送至 GitHub（SSH） |

---

## 二、论文写作配合

| 论文章节 | 所需素材 | 状态 |
|---|---|---|
| 第三章 系统设计 | 架构图、模块划分、LLM Provider 抽象 | ✅ |
| 第四章 系统实现 | 6 模块代码 + Socratic Prompt + 评测流程 | ✅ |
| 第五章 测试评估 | 53 项测试 + API 性能数据 + 安全过滤 | ✅ |
| 致谢 | — | ❌ 待写 |

---

## 三、API 性能数据（供论文）

| 端点 | 方法 | 平均响应 | 说明 |
|---|---|---|---|
| `/api/ai/chat/stream` | POST | ~1.3s | DeepSeek SSE 流式 |
| `/api/ai/chat` | POST | ~1.3s | 非流式兼容 |
| `/api/code/run` | POST | ~0.5s | Python 沙箱 |
| `/api/code/evaluate` | POST | ~1.5s | 含 AI Review 辅导 |

---

## 四、测试覆盖

| 模块 | 测试数 | 覆盖范围 |
|---|---|---|
| `lib/courses.ts` | 21 | Markdown 渲染、HTML 转义、课程加载 |
| `lib/exercises.ts` | 10 | 题库加载、字段完整性 |
| `lib/sandbox-safety.ts` | 14 | 安全过滤白名单/黑名单 |
| `lib/prompts/tutor.ts` | 8 | Prompt 结构、教学策略 |

---

## 五、剩余可选任务

| 任务 | 预估工时 | 说明 |
|---|---|---|
| 部署上线 | 1h | ✅ Docker Compose 就绪；Vercel 部署需外部 MySQL（serverless 无沙箱） |
| 用户系统 | 5h | ✅ v0.6 已交付（NextAuth + MySQL + 进度同步），可扩展 OAuth/找回密码 |
| 更多课程 | 4h | ✅ 算法入门已交付；可继续做 Java / Web 前端课程 |
| 语音输入 | 2h | ✅ 已交付（Web Speech API） |
| 代码分享 | 3h | 生成分享链接（需服务端存储） |
| 学习报告导出 | 1h | ✅ 已交付（Markdown 下载） |
