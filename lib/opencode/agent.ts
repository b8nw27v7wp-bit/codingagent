/**
 * OpenCode CLI 封装层
 * 通过 exec 调用，中文 prompt 写入文件通过 -f 传入
 */

import { exec } from "child_process";
import path from "path";
import os from "os";
import fs from "fs/promises";

const OPENCODE_BIN = process.platform === "win32"
  ? path.join(os.homedir(), "AppData", "Roaming", "npm", "opencode.cmd")
  : path.join(os.homedir(), "AppData", "Roaming", "npm", "opencode");

export interface OpenCodeOptions {
  workdir?: string;
  model?: string;
  timeout?: number;
}

export interface OpenCodeResult {
  output: string;
  exitCode: number | null;
  error?: string;
}

export async function runOpenCode(
  userMessage: string,
  systemPrompt: string,
  options: OpenCodeOptions = {}
): Promise<OpenCodeResult> {
  const {
    workdir = process.cwd(),
    model = "deepseek/deepseek-chat",
    timeout = 120000,
  } = options;

  // 完整 prompt 写入临时文件
  const promptFile = path.join(os.tmpdir(), `opencode-prompt-${Date.now()}.txt`);
  const fullPrompt = `${systemPrompt}\n\n---\n\n用户问题：${userMessage}`;
  await fs.writeFile(promptFile, fullPrompt, "utf-8");

  // 构造命令：message 在前，flags 在后
  const command = [
    `"${OPENCODE_BIN}"`,
    "run",
    `"请根据附加文件中的系统指令，回答文件末尾的用户问题。"`,
    "--model", model,
    "-f", `"${promptFile}"`,
  ].join(" ");

  return new Promise((resolve) => {
    exec(command, {
      cwd: workdir,
      env: { ...process.env },
      timeout,
      maxBuffer: 1024 * 1024,
    }, async (error, stdout, stderr) => {
      try { await fs.unlink(promptFile); } catch {}

      if (error && error.killed) {
        resolve({ output: "", exitCode: null, error: `超时` });
      } else if (error) {
        resolve({
          output: stdout.trim(),
          exitCode: error.code ?? null,
          error: stderr.trim() || error.message,
        });
      } else {
        resolve({ output: stdout.trim(), exitCode: 0 });
      }
    });
  });
}
