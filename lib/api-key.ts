/**
 * API Key 管理（单例，避免 3 处重复）
 *
 * 支持两种来源：
 * 1. 客户自己的 key —— 通过请求头 x-api-key 传入（BYOK 模式）
 * 2. 服务端 .env.local / 环境变量 —— 兜底（开发环境方便，生产可移除）
 */
import { readFileSync } from "fs";
import path from "path";

let cachedKey: string | null = null;

/** 从 .env.local 或环境变量读取服务端 key */
export function getDeepSeekApiKey(): string {
  if (cachedKey !== null) return cachedKey;

  try {
    const envPath = path.join(process.cwd(), ".env.local");
    const content = readFileSync(envPath, "utf-8");
    const match = content.match(/^DEEPSEEK_API_KEY=(.+)$/m);
    cachedKey = match ? match[1].trim() : "";
  } catch {
    cachedKey = process.env.DEEPSEEK_API_KEY || "";
  }

  return cachedKey;
}

/**
 * 解析请求实际使用的 key：
 * 优先取请求头 x-api-key（客户自带），未提供则回退服务端配置。
 * 仅用于服务端路由，key 不会进入日志。
 */
export function resolveApiKey(request: Request): string {
  const clientKey = request.headers.get("x-api-key")?.trim();
  if (clientKey) return clientKey;
  return getDeepSeekApiKey();
}
