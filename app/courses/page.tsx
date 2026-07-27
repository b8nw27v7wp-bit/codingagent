import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCourses } from "@/lib/courses";
import { BookOpen, Clock } from "lucide-react";

export default function CoursesPage() {
  const courses = getCourses();

  return (
    <main className="flex-1 p-6 max-w-4xl mx-auto w-full space-y-6">
      <div>
        <h1 className="text-2xl font-bold">课程列表</h1>
        <p className="text-muted-foreground">选择一门课程开始学习</p>
      </div>

      <div className="grid gap-4">
        {courses.map((course) => (
          <Link key={course.id} href={`/courses/${course.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{course.title}</CardTitle>
                  <Badge variant="outline">{course.level === "beginner" ? "入门" : "进阶"}</Badge>
                </div>
                <CardDescription>{course.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="w-4 h-4" />
                  {course.lessons.length} 课时
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  约 {course.lessons.reduce((sum, l) => sum + parseInt(l.duration) || 0, 0)} 分钟
                </span>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
