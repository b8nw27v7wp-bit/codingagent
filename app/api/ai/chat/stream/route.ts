import { NextRequest } from "next/server";
import { resolveApiKey } from "@/lib/api-key";
import { buildTeachingPrompt } from "@/lib/prompts/tutor";
import type { ChatMessage } from "@/lib/llm/provider";

const MAX_HISTORY = 20;

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { message, messages } = body as {
    message?: string;
    messages?: ChatMessage[];
  };

  // 兼容两种调用：旧版只传 message，新版传完整历史 messages
  const history: ChatMessage[] = Array.isArray(messages)
    ? messages.filter(
        (m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
      )
    : [];

  const lastMessage = message?.trim() || history.pop()?.content?.trim() || "";
  if (!lastMessage) {
    return new Response(JSON.stringify({ error: "message 字段必填" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // BYOK：优先客户请求头里的 key，未提供则回退服务端配置
  const apiKey = resolveApiKey(request);
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API Key 未配置：请先填写你自己的 DeepSeek API Key" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const systemPrompt = buildTeachingPrompt("beginner");

  const apiMessages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...history.slice(-MAX_HISTORY),
    { role: "user", content: lastMessage },
  ];

  const res = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: apiMessages,
      stream: true,
      max_tokens: 2048,
    }),
  });

  if (!res.ok || !res.body) {
    const err = await res.text().catch(() => "unknown");
    return new Response(JSON.stringify({ error: `API ${res.status}: ${err}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") continue;
              try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(new TextEncoder().encode(content));
                }
              } catch {}
            }
          }
        }
      } catch (err) {
        console.error("Stream error:", err);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
    },
  });
}
