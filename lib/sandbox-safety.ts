/**
 * 多语言代码安全过滤
 * 阻止危险的内置函数和模块导入（Python / JavaScript）
 */

const PYTHON_FORBIDDEN = [
  "import os",
  "import subprocess",
  "import sys",
  "__import__",
  "eval(",
  "exec(",
  "compile(",
  "open(",
  "__builtins__",
];

const JS_FORBIDDEN = [
  "require(",
  "child_process",
  "process.",
  "eval(",
  "Function(",
  "globalThis",
  "window.",
  "document.",
  "fetch(",
  "XMLHttpRequest",
  "WebSocket",
  "fs.",
  "path.",
  "os.",
];

/**
 * JS 沙箱放行的"安全 stdin 读取"模式（仅读标准输入 fd 0，不读文件）：
 * - require("fs").readFileSync(0, ...)   链式写法
 * - const fs = require("fs") 赋值 + fs.readFileSync(0, ...) 分开写法
 * 只放行 fd 为 0 的读取；require("fs").writeFileSync / readFileSync("路径")
 * 仍会被黑名单（require( / fs.）拦截。
 */
const JS_ALLOWED_STDIN_PATTERNS = [
  'require("fs").readFileSync(0',
  "require('fs').readFileSync(0",
  "= require(\"fs\")",
  "= require('fs')",
  "fs.readFileSync(0",
];

export type CodeLanguage = "python" | "javascript";

const BLOCKED_BY_LANGUAGE: Record<CodeLanguage, string[]> = {
  python: PYTHON_FORBIDDEN,
  javascript: JS_FORBIDDEN,
};

/** 掩码掉允许的 stdin 读取模式，剩下的再查黑名单 */
function maskAllowedPatterns(code: string, language: CodeLanguage): string {
  if (language !== "javascript") return code;
  return JS_ALLOWED_STDIN_PATTERNS.reduce(
    (acc, p) => acc.split(p).join("__STDIN_OK__"),
    code
  );
}

export function isCodeSafe(code: string, language: CodeLanguage): boolean {
  const masked = maskAllowedPatterns(code, language);
  return !BLOCKED_BY_LANGUAGE[language].some((kw) => masked.includes(kw));
}

export function getBlockedPattern(code: string, language: CodeLanguage): string | null {
  const masked = maskAllowedPatterns(code, language);
  for (const kw of BLOCKED_BY_LANGUAGE[language]) {
    if (masked.includes(kw)) return kw;
  }
  return null;
}

/** 兼容旧调用：仅检查 Python */
export function isPythonCodeSafe(code: string): boolean {
  return isCodeSafe(code, "python");
}
