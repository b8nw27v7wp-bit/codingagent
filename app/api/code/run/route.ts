import { NextRequest, NextResponse } from "next/server";
import { runCode } from "@/lib/code-runner";
import { isCodeSafe, getBlockedPattern, type CodeLanguage } from "@/lib/sandbox-safety";

const VALID_LANGUAGES: CodeLanguage[] = ["python", "javascript"];

export async function POST(request: NextRequest) {
  try {
    const { code, language } = await request.json();
    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "code 字段必填" }, { status: 400 });
    }
    if (code.length > 50000) {
      return NextResponse.json({ error: "代码过长（上限 50000 字符）" }, { status: 400 });
    }

    const lang: CodeLanguage = VALID_LANGUAGES.includes(language) ? language : "python";
    const blocked = getBlockedPattern(code, lang);
    if (blocked) {
      return NextResponse.json(
        { error: `代码包含不允许的操作（${blocked}）` },
        { status: 403 }
      );
    }

    const result = await runCode(code, lang, 10000);

    const hasStderr = result.stderr.trim();
    return NextResponse.json({
      output: hasStderr ? "" : result.stdout || "(无输出)",
      error: hasStderr || undefined,
    });
  } catch (err) {
    return NextResponse.json({
      output: "",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
