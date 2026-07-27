import { NextRequest, NextResponse } from "next/server";
import { spawn } from "cross-spawn";
import { writeFileSync, unlinkSync } from "fs";
import path from "path";
import os from "os";
import { isPythonCodeSafe } from "@/lib/sandbox-safety";

const TIMEOUT = 10000;
const PYTHON_BIN = "python";

export async function POST(request: NextRequest) {
  let tmpFile = "";

  try {
    const { code } = await request.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "code 字段必填" }, { status: 400 });
    }
    if (code.length > 50000) {
      return NextResponse.json({ error: "代码过长（上限 50000 字符）" }, { status: 400 });
    }
    if (!isPythonCodeSafe(code)) {
      return NextResponse.json({ error: "代码包含不允许的操作（os/subprocess/eval/open 等）" }, { status: 403 });
    }

    tmpFile = path.join(os.tmpdir(), `sandbox-${Date.now()}.py`);
    writeFileSync(tmpFile, code, "utf-8");

    const result = await new Promise<{ stdout: string; stderr: string }>(
      (resolve, reject) => {
        const child = spawn(PYTHON_BIN, [tmpFile], {
          timeout: TIMEOUT,
          cwd: os.tmpdir(),
        });

        let stdout = "";
        let stderr = "";

        child.stdout?.on("data", (d: Buffer) => { stdout += d.toString("utf-8"); });
        child.stderr?.on("data", (d: Buffer) => { stderr += d.toString("utf-8"); });

        child.on("error", (err) => {
          reject(new Error(`Python 执行失败：${err.message}`));
        });

        child.on("close", (code) => {
          if (code === null) {
            reject(new Error("代码执行超时（超过 10 秒）"));
          } else {
            resolve({ stdout, stderr });
          }
        });
      }
    );

    try { unlinkSync(tmpFile); } catch {}

    const hasStderr = result.stderr.trim();
    return NextResponse.json({
      output: hasStderr ? "" : result.stdout || "(无输出)",
      error: hasStderr || undefined,
    });
  } catch (err) {
    try { if (tmpFile) unlinkSync(tmpFile); } catch {}
    return NextResponse.json({
      output: "",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
