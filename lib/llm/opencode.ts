/**
 * OpenCode CLI Provider
 * 用于需要工具调用（文件读写、代码执行等）的场景
 * 比直连 API 慢（30s-2min），但有完整的 Agent 能力
 */

import { spawn } from "cross-spawn";
import { writeFileSync, unlinkSync } from "fs";
import path from "path";
import os from "os";
import { getDeepSeekApiKey } from "@/lib/api-key";
import type { ChatMessage, ChatOptions, LLMProvider, LLMResponse } from "./provider";

const OPENCODE_BIN = process.platform === "win32"
  ? path.join(os.homedir(), "AppData", "Roaming", "npm", "opencode.cmd")
  : "opencode";

export const opencodeProvider: LLMProvider = {
  name: "opencode",

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<LLMResponse> {
    const { model = "deepseek/deepseek-chat", timeout = 120000, apiKey: clientKey } = options;

    // 优先客户自带 key，未提供则用服务端配置
    const apiKey = clientKey || getDeepSeekApiKey();
    if (!apiKey) throw new Error("API Key 未配置：请先在设置中填写 API Key");

    // 提取 system + user 消息
    const systemMsg = messages.find(m => m.role === "system")?.content || "";
    const userMsg = messages.filter(m => m.role === "user").map(m => m.content).join("\n\n");

    // 写入临时文件
    const promptFile = path.join(os.tmpdir(), `opencode-${Date.now()}.txt`);
    const fullPrompt = systemMsg
      ? `${systemMsg}\n\n---\n\n【用户问题】\n${userMsg}`
      : userMsg;
    writeFileSync(promptFile, fullPrompt, "utf-8");

    return new Promise((resolve, reject) => {
      const child = spawn(OPENCODE_BIN, [
        "run",
        "请根据附加文件中的系统指令回答用户问题。",
        "--model", model,
        "-f", promptFile,
      ], {
        env: { ...process.env, DEEPSEEK_API_KEY: apiKey },
        timeout,
      });

      let stdout = "";
      let stderr = "";

      child.stdout?.on("data", (d: Buffer) => { stdout += d.toString("utf-8"); });
      child.stderr?.on("data", (d: Buffer) => { stderr += d.toString("utf-8"); });

      child.on("error", (err) => {
        try { unlinkSync(promptFile); } catch {}
        reject(err);
      });

      child.on("close", (code) => {
        try { unlinkSync(promptFile); } catch {}
        const cleaned = stdout
          .replace(/^> .+\n/gm, "")
          .replace(/^% .+\n/gm, "")
          .replace(/\x1b\[[0-9;]*m/g, "")
          .trim();

        if (cleaned) {
          resolve({ content: cleaned, model });
        } else {
          reject(new Error(stderr.trim() || `exit ${code}`));
        }
      });
    });
  },
};
