import { NextResponse } from "next/server";
import { getCourses } from "@/lib/courses";
import { getAllExercises } from "@/lib/exercises";

/** GET /api/courses — 课程列表（含课时/练习统计），供客户端组件使用 */
export async function GET() {
  const courses = getCourses().map((course) => {
    const exercises = getAllExercises(course.id);
    return {
      id: course.id,
      title: course.title,
      language: course.language || "python",
      totalLessons: course.lessons.length,
      totalExercises: exercises.length,
    };
  });

  return NextResponse.json({ courses });
}
