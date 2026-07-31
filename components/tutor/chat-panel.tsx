"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Send, Bot, User, Loader2, Trash2, KeyRound } from "lucide-react";
import { useToast } from "@/components/toast-provider";

const CHAT_STORAGE_KEY = "ai-tutor-chat-history";
const API_KEY_STORAGE_KEY = "ai-tutor-api-key";
const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: "你好！我是你的 AI 编程助教 👋\n\n有问题随时问我，我会用提问的方式帮你思考，而不是直接给答案。你想学什么？",
};

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(CHAT_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as Message[];
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return [WELCOME_MESSAGE];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState("");
  const [apiKey, setApiKey] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem(API_KEY_STORAGE_KEY) || "";
      } catch {}
    }
    return "";
  });
  const [keyDraft, setKeyDraft] = useState("");
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const { error: toastError, success: toastSuccess } = useToast();

  // 滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, streaming]);

  // 持久化到 localStorage（跳过首次渲染）
  const initializedRef = useRef(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!initializedRef.current) {
      initializedRef.current = true;
      return;
    }
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);
    setStreaming("");

    const controller = new AbortController();
    abortRef.current = controller;

    let fullContent = "";

    try {
      const res = await fetch("/api/ai/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(apiKey ? { "x-api-key": apiKey } : {}),
        },
        body: JSON.stringify({ message: userMessage }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "请求失败" }));
        throw new Error(err.error);
      }

      if (!res.body) throw new Error("不支持流式响应");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        setStreaming(fullContent);
      }

      setMessages((prev) => [...prev, { role: "assistant", content: fullContent }]);
      setStreaming("");
    } catch (err) {
      // AbortError = 用户点击停止，不需要显示错误
      if (err instanceof DOMException && err.name === "AbortError") {
        // 保留已接收的内容
        if (fullContent) {
          setMessages((prev) => [...prev, { role: "assistant", content: fullContent + "\n\n（已停止）" }]);
        }
      } else {
        const msg = err instanceof Error ? err.message : "网络错误";
        toastError(`AI 响应失败：${msg}`);
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `❌ ${msg}` },
        ]);
      }
      setStreaming("");
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  function clearHistory() {
    setMessages([WELCOME_MESSAGE]);
    try {
      localStorage.removeItem(CHAT_STORAGE_KEY);
    } catch {}
    toastSuccess("对话历史已清除");
  }

  function saveApiKey() {
    const trimmed = keyDraft.trim();
    try {
      if (trimmed) {
        localStorage.setItem(API_KEY_STORAGE_KEY, trimmed);
      } else {
        localStorage.removeItem(API_KEY_STORAGE_KEY);
      }
    } catch {}
    setApiKey(trimmed);
    setKeyDialogOpen(false);
    setKeyDraft("");
    toastSuccess(trimmed ? "API Key 已保存（仅存于本浏览器）" : "API Key 已清除");
  }

  function clearApiKey() {
    try {
      localStorage.removeItem(API_KEY_STORAGE_KEY);
    } catch {}
    setApiKey("");
    setKeyDraft("");
    toastSuccess("API Key 已清除");
  }

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Bot className="w-5 h-5" />
          AI 编程助教
          <span className="text-xs text-muted-foreground font-normal ml-auto">
            流式输出
          </span>
          <Dialog open={keyDialogOpen} onOpenChange={setKeyDialogOpen}>
            <DialogTrigger render={
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 relative"
                title={apiKey ? "已配置 API Key（点击修改）" : "未配置 API Key（点击设置）"}
              >
                <KeyRound className={`w-3.5 h-3.5 ${apiKey ? "text-emerald-500" : "text-muted-foreground"}`} />
                {apiKey && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
              </Button>
            } />
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>API Key 设置</DialogTitle>
                <DialogDescription>
                  填写你自己的 DeepSeek API Key，费用由你自己的账户承担。
                  Key 仅保存在本浏览器（localStorage），通过请求头发送，不会写入服务器。
                </DialogDescription>
              </DialogHeader>
              <Input
                type="password"
                value={keyDraft}
                onChange={(e) => setKeyDraft(e.target.value)}
                placeholder="sk-..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveApiKey();
                }}
              />
              {apiKey && (
                <p className="text-xs text-muted-foreground">
                  当前已配置：sk-...{apiKey.slice(-4)}
                  <button
                    className="text-destructive underline ml-2"
                    onClick={clearApiKey}
                  >
                    清除
                  </button>
                </p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setKeyDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={saveApiKey}>保存</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={clearHistory}
            title="清除对话历史"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </CardTitle>
      </CardHeader>

      <ScrollArea className="flex-1 px-4">
        <div className="space-y-4 pb-2">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarFallback className="bg-primary/10">
                    <Bot className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-lg px-3 py-2 text-sm max-w-[80%] whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <Avatar className="w-7 h-7 shrink-0">
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}

          {/* 流式输出中的消息 */}
          {streaming && (
            <div className="flex gap-3 justify-start">
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarFallback className="bg-primary/10">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-lg px-3 py-2 text-sm max-w-[80%] whitespace-pre-wrap bg-muted">
                {streaming}
                <span className="inline-block w-2 h-4 bg-primary animate-pulse ml-0.5 align-middle" />
              </div>
            </div>
          )}

          {loading && !streaming && (
            <div className="flex gap-3 justify-start">
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarFallback className="bg-primary/10">
                  <Loader2 className="w-4 h-4 animate-spin" />
                </AvatarFallback>
              </Avatar>
              <div className="rounded-lg px-3 py-2 text-sm bg-muted">思考中...</div>
            </div>
          )}
        </div>
      </ScrollArea>

      <CardContent className="pt-3 border-t">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的问题...（Enter 发送，Shift+Enter 换行）"
            className="min-h-[44px] max-h-[120px] resize-none"
            rows={1}
            disabled={loading}
          />
          {loading ? (
            <Button size="icon" variant="destructive" onClick={handleStop} className="shrink-0">
              <span className="text-xs">■</span>
            </Button>
          ) : (
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim()}
              className="shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
