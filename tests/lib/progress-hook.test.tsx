import { describe, it, expect, beforeEach } from "vitest";
import { render, renderHook, act } from "@testing-library/react";
import { useLearningProgress, markLessonComplete, markExerciseComplete } from "@/lib/progress";
import { LessonCompleteIndicator } from "@/components/tutor/lesson-complete-indicator";

const KEY = "ai-tutor-learning-progress";

describe("useLearningProgress（订阅式进度，替代 effect 中同步 setState）", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("初始无进度时返回空对象", () => {
    const { result } = renderHook(() => useLearningProgress());
    expect(result.current.progress).toEqual({});
    expect(result.current.getProgress("python-basics")).toBeNull();
  });

  it("写入进度后经 progress-update 事件自动刷新", () => {
    const { result } = renderHook(() => useLearningProgress());

    act(() => {
      markLessonComplete("python-basics", "01");
    });

    expect(result.current.progress["python-basics"].completedLessons).toEqual(["01"]);
    expect(result.current.getProgress("python-basics")?.completedLessons).toContain("01");
  });

  it("练习完成写入后同样刷新，且不丢已有课时记录", () => {
    const { result } = renderHook(() => useLearningProgress());

    act(() => {
      markLessonComplete("python-basics", "01");
    });
    act(() => {
      markExerciseComplete("python-basics-01-01", "python-basics");
    });

    const p = result.current.progress["python-basics"];
    expect(p.completedLessons).toEqual(["01"]);
    expect(p.completedExercises).toEqual(["python-basics-01-01"]);
  });

  it("跨标签页 storage 事件触发重读", () => {
    const { result } = renderHook(() => useLearningProgress());

    localStorage.setItem(
      KEY,
      JSON.stringify({
        "js-basics": { completedLessons: ["02"], completedExercises: [], lastActiveAt: 1 },
      })
    );
    act(() => {
      window.dispatchEvent(new Event("storage"));
    });

    expect(result.current.progress["js-basics"].completedLessons).toEqual(["02"]);
  });

  it("refresh() 兜底：无事件时手动重读 localStorage", () => {
    const { result } = renderHook(() => useLearningProgress());

    localStorage.setItem(
      KEY,
      JSON.stringify({
        "python-basics": { completedLessons: ["03"], completedExercises: [], lastActiveAt: 2 },
      })
    );
    act(() => {
      result.current.refresh();
    });

    expect(result.current.progress["python-basics"].completedLessons).toEqual(["03"]);
  });

  it("localStorage 内容损坏时降级为空进度，不抛异常", () => {
    localStorage.setItem(KEY, "{ 不是合法 JSON");
    const { result } = renderHook(() => useLearningProgress());
    expect(result.current.progress).toEqual({});
  });
});

describe("LessonCompleteIndicator", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("未完成时不渲染，标记完成后自动出现", () => {
    const { container } = render(<LessonCompleteIndicator courseId="python-basics" lessonId="01" />);
    expect(container.querySelector("svg")).toBeNull();

    act(() => {
      markLessonComplete("python-basics", "01");
    });

    expect(container.querySelector("svg")).not.toBeNull();
  });
});
