"use client";

import { useEffect } from "react";
import { markLessonComplete } from "@/lib/progress";

interface Props {
  courseId: string;
  lessonId: string;
}

/** 课时页面挂载时自动标记进度 */
export function LessonProgressTracker({ courseId, lessonId }: Props) {
  useEffect(() => {
    markLessonComplete(courseId, lessonId);
  }, [courseId, lessonId]);

  return null;
}
