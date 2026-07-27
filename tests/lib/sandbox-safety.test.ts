import { describe, it, expect } from "vitest";
import { isPythonCodeSafe, getBlockedPattern } from "@/lib/sandbox-safety";

describe("isPythonCodeSafe", () => {
  it("allows safe code", () => {
    expect(isPythonCodeSafe("print('hello')")).toBe(true);
    expect(isPythonCodeSafe("x = 1 + 2")).toBe(true);
    expect(isPythonCodeSafe("for i in range(10): print(i)")).toBe(true);
    expect(isPythonCodeSafe("def foo(): return 42")).toBe(true);
  });

  it("blocks import os", () => {
    expect(isPythonCodeSafe("import os")).toBe(false);
    expect(isPythonCodeSafe("import os\nprint('hi')")).toBe(false);
  });

  it("blocks import subprocess", () => {
    expect(isPythonCodeSafe("import subprocess")).toBe(false);
  });

  it("blocks import sys", () => {
    expect(isPythonCodeSafe("import sys")).toBe(false);
  });

  it("blocks eval()", () => {
    expect(isPythonCodeSafe("eval('1+2')")).toBe(false);
  });

  it("blocks exec()", () => {
    expect(isPythonCodeSafe("exec('print(1)')")).toBe(false);
  });

  it("blocks compile()", () => {
    expect(isPythonCodeSafe("compile('x', '', 'exec')")).toBe(false);
  });

  it("blocks open()", () => {
    expect(isPythonCodeSafe("open('file.txt')")).toBe(false);
  });

  it("blocks __import__", () => {
    expect(isPythonCodeSafe("__import__('os')")).toBe(false);
  });

  it("blocks __builtins__", () => {
    expect(isPythonCodeSafe("__builtins__")).toBe(false);
  });

  it("allows print with parentheses (not open)", () => {
    // "print(" contains "open("? No, it's "print("
    expect(isPythonCodeSafe("print('hello')")).toBe(true);
  });

  it("empty code is safe", () => {
    expect(isPythonCodeSafe("")).toBe(true);
  });
});

describe("getBlockedPattern", () => {
  it("returns the blocked pattern", () => {
    expect(getBlockedPattern("import os")).toBe("import os");
  });

  it("returns null for safe code", () => {
    expect(getBlockedPattern("print('hi')")).toBeNull();
  });
});
