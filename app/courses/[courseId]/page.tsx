import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCourse } from "@/lib/courses";
import { ChevronRight } from "lucide-react";
import { LessonCompleteIndicator } from "@/components/tutor/lesson-complete-indicator";

export default async function CoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = getCourse(courseId);
  if (!course) notFound();

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
      <div className="space-y-2">
        <Link href="/courses" className="text-sm text-muted-foreground hover:underline">
          ← 返回课程列表
        </Link>
        <h1 className="text-2xl font-bold">{course.title}</h1>
        <p className="text-muted-foreground">{course.description}</p>
        <Badge variant="outline">{course.level === "beginner" ? "入门" : "进阶"}</Badge>
      </div>

      <div className="space-y-3">
        <h2 className="text-lg font-semibold">课程目录</h2>
        {course.lessons.map((lesson, i) => (
          <Link key={lesson.id} href={`/courses/${courseId}/${lesson.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-muted-foreground font-mono text-sm">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <CardTitle className="text-base">{lesson.title}</CardTitle>
                    <LessonCompleteIndicator
                      courseId={courseId}
                      lessonId={lesson.id}
                    />
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span className="text-sm">{lesson.duration}</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
