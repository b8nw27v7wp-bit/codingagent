/**
 * LLM Provider 接口
 * 统一抽象层：直连 API（快）和 OpenCode CLI（有工具能力）可互换
 */

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

export interface LLMProvider {
  /** Provider 名称，用于日志和选择 */
  readonly name: string;
  /** 发送对话请求 */
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<LLMResponse>;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeout?: number;
  /** 客户自带的 API Key（BYOK），优先于服务端配置 */
  apiKey?: string;
}
