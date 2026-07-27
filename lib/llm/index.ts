/**
 * LLM Provider 统一入口
 * 默认使用 DeepSeek 直连（快），需要 Agent 工具时切换到 OpenCode
 */

import type { ChatMessage, ChatOptions, LLMProvider, LLMResponse } from "./provider";

import { deepseekProvider } from "./deepseek";
import { opencodeProvider } from "./opencode";

/** 默认 Provider：直连 DeepSeek（~2-5s） */
const defaultProvider: LLMProvider = deepseekProvider;

/**
 * 快速对话（教学辅导场景）
 * 使用直连 API，适合 90% 的教学问答
 */
export async function chat(
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<LLMResponse> {
  return defaultProvider.chat(messages, options);
}

/**
 * Agent 对话（需要文件操作/代码执行的场景）
 * 使用 OpenCode CLI，慢但有完整工具能力
 */
export async function agentChat(
  messages: ChatMessage[],
  options?: ChatOptions
): Promise<LLMResponse> {
  return opencodeProvider.chat(messages, {
    ...options,
    timeout: options?.timeout ?? 120000,
  });
}
