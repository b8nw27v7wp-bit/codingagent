import { describe, it, expect } from "vitest";
import { isPythonCodeSafe, getBlockedPattern, isCodeSafe } from "@/lib/sandbox-safety";

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
    expect(getBlockedPattern("import os", "python")).toBe("import os");
  });

  it("returns null for safe code", () => {
    expect(getBlockedPattern("print('hi')", "python")).toBeNull();
  });
});

describe("isCodeSafe (JavaScript)", () => {
  it("allows safe JS code", () => {
    expect(isCodeSafe("console.log('hello')", "javascript")).toBe(true);
    expect(isCodeSafe("let x = 1 + 2", "javascript")).toBe(true);
    expect(isCodeSafe("for (let i = 0; i < 3; i++) console.log(i)", "javascript")).toBe(true);
  });

  it("blocks require() of non-fs modules", () => {
    expect(isCodeSafe("const http = require('http')", "javascript")).toBe(false);
  });

  it("allows const fs = require('fs') (stdin reading prerequisite)", () => {
    expect(isCodeSafe("const fs = require('fs')", "javascript")).toBe(true);
  });

  it("blocks child_process", () => {
    expect(isCodeSafe("require('child_process')", "javascript")).toBe(false);
  });

  it("blocks process.", () => {
    expect(isCodeSafe("console.log(process.env)", "javascript")).toBe(false);
  });

  it("blocks eval()", () => {
    expect(isCodeSafe("eval('1+2')", "javascript")).toBe(false);
  });

  it("blocks fetch()", () => {
    expect(isCodeSafe("fetch('http://x')", "javascript")).toBe(false);
  });

  it("allows console.log (not blocked by fs./path.)", () => {
    expect(isCodeSafe("console.log('hi')", "javascript")).toBe(true);
  });

  it("allows safe stdin reading pattern", () => {
    expect(
      isCodeSafe('const input = require("fs").readFileSync(0, "utf-8").trim();', "javascript")
    ).toBe(true);
  });

  it("still blocks reading real files", () => {
    expect(
      isCodeSafe('require("fs").readFileSync("secret.txt", "utf-8")', "javascript")
    ).toBe(false);
  });

  it("still blocks require of other modules", () => {
    expect(isCodeSafe("require('http')", "javascript")).toBe(false);
  });
});
