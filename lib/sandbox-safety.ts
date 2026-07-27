/**
 * Python 代码安全过滤
 * 阻止危险的内置函数和模块导入
 */

const FORBIDDEN = [
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

export function isPythonCodeSafe(code: string): boolean {
  const lower = code;
  return !FORBIDDEN.some((kw) => lower.includes(kw));
}

export function getBlockedPattern(code: string): string | null {
  for (const kw of FORBIDDEN) {
    if (code.includes(kw)) return kw;
  }
  return null;
}
