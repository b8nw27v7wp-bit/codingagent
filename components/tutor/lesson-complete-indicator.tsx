"use client";

import { CheckCircle } from "lucide-react";
import { useLearningProgress } from "@/lib/progress";

interface Props {
  courseId: string;
  lessonId: string;
}

/** 单课时完成状态指示器（进度来自 localStorage，水合后自动刷新） */
export function LessonCompleteIndicator({ courseId, lessonId }: Props) {
  const { getProgress } = useLearningProgress();
  const completed = getProgress(courseId)?.completedLessons.includes(lessonId) ?? false;

  if (!completed) return null;

  return <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />;
}
