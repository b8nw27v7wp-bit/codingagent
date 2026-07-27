"use client";

import { useState, useCallback, useEffect } from "react";

const PROGRESS_KEY = "ai-tutor-learning-progress";

export interface CourseProgress {
  completedLessons: string[]; // lesson ids like "01", "02"
  completedExercises: string[]; // exercise ids
  lastActiveAt: number;
}

/** 读取进度 */
function loadProgress(): Record<string, CourseProgress> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/** 保存进度 */
function saveProgress(progress: Record<string, CourseProgress>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
  } catch {}
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
export function getCourseProgress(
  courseId: string
): CourseProgress | null {
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
