"use client";

import { useState, useCallback, useEffect } from "react";

const PROGRESS_KEY = "ai-tutor-learning-progress";

export interface CourseProgress {
  completedLessons: string[]; // lesson ids like "01", "02"
  completedExercises: string[]; // exercise ids
  lastActiveAt: number;
}

/* ---------------- 本地存储 ---------------- */

/** 读取本地进度 */
function loadLocal(): Record<string, CourseProgress> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? (JSON.parse(raw) as Record<string, CourseProgress>) : {};
  } catch {
    return {};
  }
}

/** 写入本地并通知同标签页监听者 */
function saveLocal(progress: Record<string, CourseProgress>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    window.dispatchEvent(new Event("progress-update"));
  } catch {}
}

/* ---------------- 云端同步 ---------------- */

/** 合并两份进度：课程维度取并集，字段取较新的（不丢已完成项） */
function mergeProgress(
  a: Record<string, CourseProgress>,
  b: Record<string, CourseProgress>
): Record<string, CourseProgress> {
  const result: Record<string, CourseProgress> = { ...a };
  for (const [courseId, bp] of Object.entries(b)) {
    const ap = result[courseId];
    if (!ap) {
      result[courseId] = bp;
      continue;
    }
    result[courseId] = {
      completedLessons: Array.from(new Set([...ap.completedLessons, ...bp.completedLessons])),
      completedExercises: Array.from(new Set([...ap.completedExercises, ...bp.completedExercises])),
      lastActiveAt: Math.max(ap.lastActiveAt || 0, bp.lastActiveAt || 0),
    };
  }
  return result;
}

/**
 * 登录后调用：拉取云端进度并与本地合并（云端优先保留，双方并集）。
 * 完成后触发 progress-update 事件，看板自动刷新。
 */
export async function syncProgressFromServer(): Promise<boolean> {
  try {
    const res = await fetch("/api/progress", { cache: "no-store" });
    if (!res.ok) return false;
    const data = await res.json();
    const remote = (data.progress || {}) as Record<string, CourseProgress>;
    if (Object.keys(remote).length === 0) return true;
    const merged = mergeProgress(remote, loadLocal());
    saveLocal(merged);
    // 登录后云端为权威，立即回写一次（把游客期间的新进度也带上去）
    void pushToServer(merged);
    return true;
  } catch {
    return false;
  }
}

/** 上传进度到云端（fire-and-forget，失败静默） */
async function pushToServer(progress: Record<string, CourseProgress>) {
  try {
    await fetch("/api/progress", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress }),
    });
  } catch {
    /* 离线/未登录时静默失败 */
  }
}

/* ---------------- 核心读写（登录时双写） ---------------- */

/** 读取进度（本地为准；登录态由上层在写入时同步云端） */
function loadProgress(): Record<string, CourseProgress> {
  return loadLocal();
}

/** 保存进度：本地 + 云端（已登录时） */
function saveProgress(progress: Record<string, CourseProgress>) {
  saveLocal(progress);
  void pushToServer(progress);
}

/** 标记课时已完成 */
export function markLessonComplete(courseId: string, lessonId: string) {
  const all = loadProgress();
  if (!all[courseId]) {
    all[courseId] = {
      completedLessons: [],
      completedExercises: [],
      lastActiveAt: Date.now(),
    };
  }
  if (!all[courseId].completedLessons.includes(lessonId)) {
    all[courseId].completedLessons.push(lessonId);
  }
  all[courseId].lastActiveAt = Date.now();
  saveProgress(all);
}

/** 标记练习已完成 */
export function markExerciseComplete(exerciseId: string, courseId?: string) {
  if (!courseId) return;
  const all = loadProgress();
  if (!all[courseId]) {
    all[courseId] = {
      completedLessons: [],
      completedExercises: [],
      lastActiveAt: Date.now(),
    };
  }
  if (!all[courseId].completedExercises.includes(exerciseId)) {
    all[courseId].completedExercises.push(exerciseId);
  }
  all[courseId].lastActiveAt = Date.now();
  saveProgress(all);
}

/** 获取某门课的进度 */
export function getCourseProgress(courseId: string): CourseProgress | null {
  const all = loadProgress();
  return all[courseId] || null;
}

/** React Hook: 响应式学习进度 */
export function useLearningProgress() {
  const [progress, setProgress] = useState<Record<string, CourseProgress>>({});

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const refresh = useCallback(() => {
    setProgress(loadProgress());
  }, []);

  const completeLesson = useCallback(
    (courseId: string, lessonId: string) => {
      markLessonComplete(courseId, lessonId);
      refresh();
    },
    [refresh]
  );

  const completeExercise = useCallback(
    (exerciseId: string, courseId?: string) => {
      markExerciseComplete(exerciseId, courseId);
      refresh();
    },
    [refresh]
  );

  const getProgress = useCallback(
    (courseId: string): CourseProgress | null => {
      return progress[courseId] || null;
    },
    [progress]
  );

  return { progress, refresh, completeLesson, completeExercise, getProgress };
}
