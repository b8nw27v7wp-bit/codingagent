/**
 * POST /api/code/evaluate
 * 代码评测：运行测试用例 + AI Review
 */
import { NextRequest, NextResponse } from "next/server";
import { spawn } from "cross-spawn";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import path from "path";
import { getExercise } from "@/lib/exercises";
import { getDeepSeekApiKey } from "@/lib/api-key";
import { isPythonCodeSafe } from "@/lib/sandbox-safety";

export async function POST(req: NextRequest) {
  try {
    const { code, exerciseId } = await req.json();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "请提供代码" }, { status: 400 });
    }

    if (!exerciseId || typeof exerciseId !== "string") {
      return NextResponse.json({ error: "请指定题目 ID" }, { status: 400 });
    }

    // BYOK：客户请求头里的 key 优先，未提供则回退服务端配置
    const apiKey =
      req.headers.get("x-api-key")?.trim() || getDeepSeekApiKey();

    // 加载题目
    const exercise = getExercise(exerciseId);
    if (!exercise) {
      return NextResponse.json(
        { error: `题目 ${exerciseId} 不存在` },
        { status: 404 }
      );
    }

    // 1. 安全过滤
    if (!isPythonCodeSafe(code)) {
      return NextResponse.json({
        error: "安全限制：代码中包含不允许的操作（os/subprocess/eval/open 等）",
      }, { status: 403 });
    }

    // 2. 逐个运行测试用例
    const results: TestResult[] = [];
    let allPassed = true;

    for (const tc of exercise.testCases) {
      const result = await runTestCase(code, tc.input, tc.expected);
      results.push(result);
      if (!result.passed) allPassed = false;
    }

    // 3. AI 代码 Review（可选，仅在失败时触发）
    let aiReview: string | null = null;
    if (!allPassed && apiKey) {
      aiReview = await getAiReview(code, exercise, results, apiKey);
    }

    return NextResponse.json({
      exerciseId,
      exerciseTitle: exercise.title,
      allPassed,
      results,
      aiReview,
    });
  } catch (err) {
    console.error("Code evaluation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "评测失败" },
      { status: 500 }
    );
  }
}

interface TestResult {
  passed: boolean;
  expected: string;
  actual: string;
  error: string | null;
}

/** 运行单个测试用例 */
function runTestCase(
  code: string,
  input: string,
  expected: string
): Promise<TestResult> {
  return new Promise((resolve) => {
    const tmpFile = path.join(process.cwd(), ".tmp_test.py");

    try {
      writeFileSync(tmpFile, code, "utf-8");
    } catch {
      resolve({
        passed: false,
        expected,
        actual: "",
        error: "无法写入临时文件",
      });
      return;
    }

    const child = spawn("python", [tmpFile], {
      timeout: 8000,
      cwd: process.cwd(),
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    // 如果有输入，写入 stdin
    if (input) {
      child.stdin.write(input);
      child.stdin.end();
    }

    child.on("close", () => {
      // 清理临时文件
      try {
        if (existsSync(tmpFile)) unlinkSync(tmpFile);
      } catch {}

      if (stderr) {
        resolve({
          passed: false,
          expected,
          actual: stdout.trim(),
          error: stderr.trim(),
        });
        return;
      }

      const actual = stdout.trim();
      const passed = actual === expected.trim();

      resolve({ passed, expected, actual, error: null });
    });

    child.on("error", () => {
      try {
        if (existsSync(tmpFile)) unlinkSync(tmpFile);
      } catch {}
      resolve({
        passed: false,
        expected,
        actual: "",
        error: "Python 执行环境不可用",
      });
    });
  });
}

/** AI 代码 Review */
async function getAiReview(
  code: string,
  exercise: { title: string; description: string; hints: string[] },
  results: TestResult[],
  apiKey: string
): Promise<string | null> {
  try {
    const prompt = `你是一个编程教学助手。学生正在做一道练习题，但代码没有通过测试。

题目：${exercise.title}
要求：${exercise.description}

学生的代码：
\`\`\`python
${code}
\`\`\`

测试结果：
${results
  .map(
    (r, i) =>
      `测试 ${i + 1}: ${r.passed ? "✅ 通过" : "❌ 失败"}
  预期输出：${r.expected}
  实际输出：${r.actual || "(无输出)"}
  ${r.error ? `错误信息：${r.error}` : ""}`
  )
  .join("\n")}

请用鼓励的语气，用 Socratic 提问法引导学生发现问题。不要直接给出正确答案。
用中文回答，控制在 3-5 句话内。`;

    const res = await fetch(
      "https://api.deepseek.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 300,
        }),
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content || null;
  } catch {
    return null;
  }
}
