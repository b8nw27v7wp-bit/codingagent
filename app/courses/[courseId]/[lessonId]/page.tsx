import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCourse, parseLesson, markdownToHtml } from "@/lib/courses";
import { getExercises } from "@/lib/exercises";
import { ExercisePanel } from "@/components/tutor/exercise-panel";
import { LessonProgressTracker } from "@/components/tutor/lesson-progress-tracker";

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;

  const course = getCourse(courseId);
  if (!course) notFound();

  const lessonMeta = course.lessons.find((l) => l.id === lessonId);
  if (!lessonMeta) notFound();

  const lesson = parseLesson(courseId, lessonMeta.file);
  if (!lesson) notFound();

  const currentIndex = course.lessons.findIndex((l) => l.id === lessonId);
  const prev = currentIndex > 0 ? course.lessons[currentIndex - 1] : null;
  const next =
    currentIndex < course.lessons.length - 1
      ? course.lessons[currentIndex + 1]
      : null;

  const html = markdownToHtml(lesson.content);
  const exercises = getExercises(courseId, lessonId);

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
      <LessonProgressTracker courseId={courseId} lessonId={lessonId} />

      {/* 导航 */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/courses" className="hover:underline">
          课程
        </Link>
        <span>/</span>
        <Link href={`/courses/${courseId}`} className="hover:underline">
          {course.title}
        </Link>
        <span>/</span>
        <span>
          第 {currentIndex + 1} 课 · {lessonMeta.title}
        </span>
      </div>

      {/* 标题 */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Badge variant="secondary">
            第 {currentIndex + 1}/{course.lessons.length} 课
          </Badge>
          <span className="text-sm text-muted-foreground">
            ⏱ {lessonMeta.duration}
          </span>
        </div>
        <h1 className="text-2xl font-bold">{lessonMeta.title}</h1>
      </div>

      {/* 内容 */}
      <Card>
        <CardContent className="pt-6">
          <article
            className="prose prose-sm dark:prose-invert max-w-none
              prose-headings:font-semibold
              prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4
              prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
              prose-h4:text-base prose-h4:mt-4 prose-h4:mb-2
              prose-p:my-3 prose-p:leading-7
              prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
              prose-pre:bg-muted prose-pre:rounded-lg prose-pre:p-4
              prose-blockquote:border-l-4 prose-blockquote:border-primary prose-blockquote:bg-muted/50 prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:rounded-r
              prose-li:my-1
              prose-strong:text-foreground
              prose-table:w-full prose-table:border-collapse
              prose-th:border prose-th:border-border prose-th:px-3 prose-th:py-2 prose-th:bg-muted
              prose-td:border prose-td:border-border prose-td:px-3 prose-td:py-2
              [&_table]:w-full [&_table]:border-collapse [&_table]:my-4
              [&_th]:border [&_th]:border-border [&_th]:px-3 [&_th]:py-2 [&_th]:bg-muted [&_th]:text-left [&_th]:text-sm
              [&_td]:border [&_td]:border-border [&_td]:px-3 [&_td]:py-2 [&_td]:text-sm
              [&_tr]:border [&_tr]:border-border
            "
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </CardContent>
      </Card>

      {/* 练习 */}
      {exercises.length > 0 && (
        <ExercisePanel
          exercises={exercises}
          courseId={courseId}
          lessonId={lessonId}
          language={course.language || "python"}
        />
      )}

      {/* 上下课导航 */}
      <div className="flex justify-between pt-4 border-t">
        {prev ? (
          <Link
            href={`/courses/${courseId}/${prev.id}`}
            className="text-sm hover:underline"
          >
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/courses/${courseId}/${next.id}`}
            className="text-sm hover:underline"
          >
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </div>
    </main>
  );
}
