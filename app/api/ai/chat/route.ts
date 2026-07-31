import { NextRequest, NextResponse } from "next/server";
import { chat } from "@/lib/llm";
import { buildTeachingPrompt } from "@/lib/prompts/tutor";
import type { ChatMessage } from "@/lib/llm/provider";

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message 字段必填" }, { status: 400 });
    }

    const systemPrompt = buildTeachingPrompt("beginner");
    const messages: ChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: message },
    ];

    const result = await chat(messages, {
      temperature: 0.7,
      maxTokens: 2048,
      // BYOK：客户请求头里的 key 优先，未提供时 provider 内部回退服务端配置
      apiKey: request.headers.get("x-api-key")?.trim() || undefined,
    });

    return NextResponse.json({
      reply: result.content,
      model: result.model,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
