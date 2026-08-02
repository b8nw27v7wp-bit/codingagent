"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Play,
  Loader2,
  CheckCircle,
  XCircle,
  Lightbulb,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import type { OnMount } from "@monaco-editor/react";

const Editor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface Exercise {
  id: string;
  courseId: string;
  lessonId: string;
  title: string;
  description: string;
  testCases: { input: string; expected: string }[];
  hints: string[];
}

interface EvaluationResult {
  exerciseId: string;
  exerciseTitle: string;
  allPassed: boolean;
  results: {
    passed: boolean;
    expected: string;
    actual: string;
    error: string | null;
  }[];
  aiReview: string | null;
}

interface Props {
  exercises: Exercise[];
  courseId: string;
  lessonId: string;
  /** 课程语言（python / javascript），决定编辑器语法与默认代码 */
  language?: string;
}

export function ExercisePanel({ exercises, courseId, lessonId, language = "python" }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [code, setCode] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [showHints, setShowHints] = useState<number>(0);
  // hydration 保护：SSR 与首次客户端渲染输出一致，挂载后再渲染 Monaco
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const exercise = exercises[currentIdx];

  const runEvaluation = useCallback(async () => {
    if (!exercise || !code.trim()) return;
    setEvaluating(true);
    setResult(null);

    try {
      const res = await fetch("/api/code/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, exerciseId: exercise.id }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        exerciseId: exercise.id,
        exerciseTitle: exercise.title,
        allPassed: false,
        results: [],
        aiReview: err instanceof Error ? err.message : "评测失败",
      });
    } finally {
      setEvaluating(false);
    }
  }, [code, exercise]);

  const prevExercise = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
      setResult(null);
      setCode("");
      setShowHints(0);
    }
  };
  const nextExercise = () => {
    if (currentIdx < exercises.length - 1) {
      setCurrentIdx(currentIdx + 1);
      setResult(null);
      setCode("");
      setShowHints(0);
    }
  };

  if (!exercise) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            ✏️ 练习
            <Badge variant="outline">
              {currentIdx + 1}/{exercises.length}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevExercise}
              disabled={currentIdx === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={nextExercise}
              disabled={currentIdx >= exercises.length - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 题目描述 */}
        <div className="p-4 bg-muted/30 rounded-lg space-y-2">
          <h3 className="font-semibold">{exercise.title}</h3>
          <p className="text-sm text-muted-foreground">
            {exercise.description}
          </p>

          {/* 提示 */}
          {showHints > 0 && (
            <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 text-sm font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                <Lightbulb className="w-4 h-4" />
                提示
              </div>
              <ul className="text-sm space-y-1">
                {exercise.hints.slice(0, showHints).map((hint, i) => (
                  <li
                    key={i}
                    className="text-yellow-600 dark:text-yellow-500 flex gap-2"
                  >
                    <span>{i + 1}.</span>
                    <span>{hint}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {showHints < exercise.hints.length && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => setShowHints(showHints + 1)}
            >
              显示提示 →
            </Button>
          )}
        </div>

        {/* 代码编辑器 */}
        <div className="h-[250px] border rounded-lg overflow-hidden">
          {mounted && (
            <Editor
              height="100%"
              defaultLanguage={language === "javascript" ? "javascript" : "python"}
              theme="vs-dark"
              value={code}
              onChange={(value) => setCode(value || "")}
              options={{
                fontSize: 13,
                fontFamily:
                  "'Cascadia Code', Consolas, monospace",
                minimap: { enabled: false },
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                tabSize: 4,
                padding: { top: 8 },
                automaticLayout: true,
              }}
              loading={
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  加载编辑器...
                </div>
              }
            />
          )}
        </div>

        {/* 运行按钮 */}
        <div className="flex items-center gap-3">
          <Button
            onClick={runEvaluation}
            disabled={evaluating || !code.trim()}
            className="gap-2"
          >
            {evaluating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Play className="w-4 h-4" />
            )}
            提交评测
          </Button>
          <span className="text-xs text-muted-foreground">
            Ctrl+Enter 运行（编辑器中）
          </span>
        </div>

        {/* 评测结果 */}
        {result && (
          <div className="space-y-3">
            <div
              className={`p-4 rounded-lg border ${
                result.allPassed
                  ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                  : "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                {result.allPassed ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-green-700 dark:text-green-400">
                      全部通过！
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-700 dark:text-red-400">
                      {result.results.length > 0
                        ? `${result.results.filter((r) => r.passed).length}/${
                            result.results.length
                          } 测试通过`
                        : "未通过"}
                    </span>
                  </>
                )}
              </div>

              {/* 测试用例详情 */}
              {result.results.map((r, i) => (
                <div
                  key={i}
                  className="text-sm p-3 bg-background/50 rounded mb-2 last:mb-0"
                >
                  <div className="flex items-center gap-2 mb-1">
                    {r.passed ? (
                      <CheckCircle className="w-3 h-3 text-green-500" />
                    ) : (
                      <XCircle className="w-3 h-3 text-red-500" />
                    )}
                    <span className="font-mono text-xs">
                      测试 {i + 1}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                    <div>
                      <span className="text-muted-foreground">预期：</span>
                      <span className="text-green-600 dark:text-green-400">
                        {r.expected || "(空)"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">实际：</span>
                      <span
                        className={
                          r.passed
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }
                      >
                        {r.actual || "(无输出)"}
                      </span>
                    </div>
                  </div>
                  {r.error && (
                    <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/50 rounded text-xs text-red-700 dark:text-red-300 font-mono">
                      {r.error}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* AI Review */}
            {result.aiReview && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-400">
                    AI 辅导建议
                  </span>
                </div>
                <p className="text-sm text-blue-600 dark:text-blue-300 leading-relaxed">
                  {result.aiReview}
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
