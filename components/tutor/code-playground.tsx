"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Loader2, Terminal, RotateCcw } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import type { OnMount } from "@monaco-editor/react";

// Monaco Editor 动态导入（仅客户端），避免 SSR 报错
const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const STORAGE_KEY = "ai-tutor-code";

export function CodePlayground() {
  const [code, setCode] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_CODE;
    }
    return DEFAULT_CODE;
  });
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [running, setRunning] = useState(false);
  const [editorMounted, setEditorMounted] = useState(false);
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const { success: toastSuccess, error: toastError } = useToast();

  // 代码变更时自动保存到 localStorage
  useEffect(() => {
    if (editorMounted) {
      localStorage.setItem(STORAGE_KEY, code);
    }
  }, [code, editorMounted]);

  const runCode = useCallback(async () => {
    setRunning(true);
    setOutput("");
    setError("");

    try {
      const res = await fetch("/api/code/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();

      if (data.error) setError(data.error);
      if (data.output) setOutput(data.output);
      if (!data.error) toastSuccess("代码运行完成");
      else toastError(data.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : "执行失败");
    } finally {
      setRunning(false);
    }
  }, [code]);

  function resetCode() {
    setCode(DEFAULT_CODE);
    toastSuccess("代码已重置");
  }

  // Monaco Editor 挂载后注册快捷键
  const handleEditorMount: OnMount = useCallback(
    (editor, _monaco) => {
      editorRef.current = editor;
      setEditorMounted(true);

      // Ctrl+Enter / Cmd+Enter 运行代码
      editor.addAction({
        id: "run-code",
        label: "运行代码",
        keybindings: [
          _monaco.KeyMod.CtrlCmd | _monaco.KeyCode.Enter,
        ],
        run: () => {
          if (!running) runCode();
        },
      });

      // Ctrl+S 保存（阻止默认行为，已有 localStorage）
      editor.addAction({
        id: "save-code",
        label: "保存代码",
        keybindings: [
          _monaco.KeyMod.CtrlCmd | _monaco.KeyCode.KeyS,
        ],
        run: () => {
          // 保存（实际上代码变更时已自动保存，这里做显式确认）
          localStorage.setItem(STORAGE_KEY, editor.getValue());
        },
      });
    },
    [runCode, running]
  );

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Terminal className="w-5 h-5" />
            Python 练习环境
            <span className="text-xs text-muted-foreground font-normal">
              Ctrl+Enter 运行 · Ctrl+S 保存 · Tab 缩进
            </span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetCode}
              className="gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              重置
            </Button>
            <Badge variant="outline">Python 3.11</Badge>
            <Button
              size="sm"
              onClick={runCode}
              disabled={running}
              className="gap-2"
            >
              {running ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              运行
            </Button>
          </div>
        </div>
      </CardHeader>

      <div className="flex-1 grid grid-rows-[1fr_auto] gap-0 min-h-0">
        <div className="overflow-hidden border-y">
          {typeof window !== "undefined" && (
            <Editor
              height="100%"
              defaultLanguage="python"
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              onMount={handleEditorMount}
              loading={
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin mr-2" />
                  加载编辑器中...
                </div>
              }
              options={{
                fontSize: 14,
                fontFamily:
                  "'Cascadia Code', 'Fira Code', 'JetBrains Mono', Consolas, monospace",
                minimap: { enabled: false },
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                tabSize: 4,
                insertSpaces: true,
                renderWhitespace: "selection",
                padding: { top: 12 },
                suggestOnTriggerCharacters: true,
                quickSuggestions: true,
                bracketPairColorization: { enabled: true },
                automaticLayout: true,
              }}
            />
          )}
        </div>

        <div>
          <div className="px-4 py-2 bg-muted/50 flex items-center gap-2 text-xs text-muted-foreground border-t">
            <Terminal className="w-3 h-3" />
            输出
          </div>
          <div className="p-4 font-mono text-sm min-h-[120px] max-h-[250px] overflow-auto bg-[#1e1e1e] text-green-400">
            {running ? (
              <span className="animate-pulse">执行中...</span>
            ) : output ? (
              <pre className="whitespace-pre-wrap">{output}</pre>
            ) : error ? (
              <pre className="whitespace-pre-wrap text-red-400">{error}</pre>
            ) : (
              <span className="text-gray-500">
                点击「运行」或按 Ctrl+Enter 执行代码
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

const DEFAULT_CODE = `# 🎉 欢迎来到 Python 练习环境！
# 按 Ctrl+Enter 或点击「运行」执行代码

print("Hello, Python!")

# 简单计算
result = 1 + 2 + 3 + 4 + 5
print(f"1 到 5 的和是：{result}")

# 写一个循环
for i in range(1, 6):
    print(f"第 {i} 次循环：{i * i}")

# 试试修改上面的代码，然后重新运行！
`;
