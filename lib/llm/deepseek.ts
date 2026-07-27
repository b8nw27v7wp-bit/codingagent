/**
 * DeepSeek 直连 API Provider
 * 使用 OpenAI 兼容接口，响应速度 ~2-5s（远快于 CLI 方案）
 */

import { getDeepSeekApiKey } from "@/lib/api-key";
import type { ChatMessage, ChatOptions, LLMProvider, LLMResponse } from "./provider";

const BASE_URL = "https://api.deepseek.com/v1";
const DEFAULT_MODEL = "deepseek-chat";

export const deepseekProvider: LLMProvider = {
  name: "deepseek",

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<LLMResponse> {
    const apiKey = getDeepSeekApiKey();
    if (!apiKey) throw new Error("DEEPSEEK_API_KEY 未配置");

    const {
      model = DEFAULT_MODEL,
      temperature = 0.7,
      maxTokens = 2048,
      timeout = 30000,
    } = options;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(`${BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = await res.text().catch(() => "");
        throw new Error(`DeepSeek API ${res.status}: ${errBody}`);
      }

      const data = await res.json();
      const choice = data.choices?.[0];

      return {
        content: choice?.message?.content || "(空响应)",
        model: data.model || model,
        usage: data.usage ? {
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens,
        } : undefined,
      };
    } finally {
      clearTimeout(timer);
    }
  },
};
