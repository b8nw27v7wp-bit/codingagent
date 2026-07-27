"use client";

import { useEffect, useState } from "react";
import { CheckCircle } from "lucide-react";
import { getCourseProgress } from "@/lib/progress";

interface Props {
  courseId: string;
  lessonId: string;
}

/** 单课时完成状态指示器 */
export function LessonCompleteIndicator({ courseId, lessonId }: Props) {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const progress = getCourseProgress(courseId);
    if (progress?.completedLessons.includes(lessonId)) {
      setCompleted(true);
    }
  }, [courseId, lessonId]);

  if (!completed) return null;

  return <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />;
}
