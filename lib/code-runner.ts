/**
 * 多语言代码执行器
 * 统一 Python / JavaScript 的沙箱运行逻辑（run 与 evaluate 共用）
 */

import { spawn } from "cross-spawn";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import path from "path";
import os from "os";
import type { CodeLanguage } from "@/lib/sandbox-safety";

export interface ExecResult {
  stdout: string;
  stderr: string;
  timedOut?: boolean;
}

/** 语言 → 运行命令与文件扩展名 */
const RUNTIME: Record<CodeLanguage, { bin: string; ext: string; label: string }> = {
  python: { bin: "python", ext: ".py", label: "Python" },
  javascript: { bin: "node", ext: ".js", label: "Node.js" },
};

export function getRuntimeLabel(language: CodeLanguage): string {
  return RUNTIME[language].label;
}

/** 运行一段代码（写临时文件 → 执行 → 清理） */
export function runCode(code: string, language: CodeLanguage, timeout = 8000): Promise<ExecResult> {
  const { bin, ext } = RUNTIME[language];
  const tmpFile = path.join(os.tmpdir(), `sandbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  writeFileSync(tmpFile, code, "utf-8");

  return new Promise((resolve) => {
    const child = spawn(bin, [tmpFile], {
      timeout,
      cwd: os.tmpdir(),
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const done = (result: ExecResult) => {
      if (settled) return;
      settled = true;
      try { if (existsSync(tmpFile)) unlinkSync(tmpFile); } catch {}
      resolve(result);
    };

    child.stdout?.on("data", (d: Buffer) => { stdout += d.toString("utf-8"); });
    child.stderr?.on("data", (d: Buffer) => { stderr += d.toString("utf-8"); });
    child.on("error", (err) => {
      done({ stdout, stderr: `${RUNTIME[language].label} 执行环境不可用：${err.message}` });
    });
    child.on("close", (code) => {
      if (code === null) {
        done({ stdout, stderr: `代码执行超时（超过 ${timeout / 1000} 秒）`, timedOut: true });
      } else {
        done({ stdout, stderr });
      }
    });
  });
}

/** 运行带 stdin 输入的代码（用于测试用例） */
export function runCodeWithInput(
  code: string,
  input: string,
  language: CodeLanguage,
  timeout = 8000
): Promise<ExecResult> {
  const { bin, ext } = RUNTIME[language];
  const tmpFile = path.join(os.tmpdir(), `sandbox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  writeFileSync(tmpFile, code, "utf-8");

  return new Promise((resolve) => {
    const child = spawn(bin, [tmpFile], {
      timeout,
      cwd: os.tmpdir(),
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const done = (result: ExecResult) => {
      if (settled) return;
      settled = true;
      try { if (existsSync(tmpFile)) unlinkSync(tmpFile); } catch {}
      resolve(result);
    };

    child.stdout?.on("data", (d: Buffer) => { stdout += d.toString("utf-8"); });
    child.stderr?.on("data", (d: Buffer) => { stderr += d.toString("utf-8"); });
    if (input) {
      child.stdin.write(input);
      child.stdin.end();
    }
    child.on("error", (err) => {
      done({ stdout, stderr: `${RUNTIME[language].label} 执行环境不可用：${err.message}` });
    });
    child.on("close", (code) => {
      if (code === null) {
        done({ stdout, stderr: `代码执行超时（超过 ${timeout / 1000} 秒）`, timedOut: true });
      } else {
        done({ stdout, stderr });
      }
    });
  });
}
