/**
 * API Key 管理（单例，避免 3 处重复）
 */
import { readFileSync } from "fs";
import path from "path";

let cachedKey: string | null = null;

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
