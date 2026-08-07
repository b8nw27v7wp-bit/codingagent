# ===== 阶段 1：安装依赖 =====
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ===== 阶段 2：构建 =====
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ===== 阶段 3：运行 =====
# 运行时需要 node（沙箱执行 JS）+ python3（沙箱执行 Python）
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV AUTH_TRUST_HOST=true

# Python 沙箱依赖
RUN apk add --no-cache python3

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs

# standalone 输出
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# 课程内容（MDX + 题库）不在 standalone 内，需要显式复制
COPY --from=builder /app/content ./content

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
