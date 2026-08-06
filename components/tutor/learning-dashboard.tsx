"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, BookOpen, CheckCircle, Clock, TrendingUp } from "lucide-react";

interface CourseProgress {
  completedLessons: string[];
  completedExercises: string[];
  lastActiveAt: number;
}

interface CourseInfo {
  id: string;
  title: string;
  totalLessons: number;
  totalExercises: number;
}

function loadAllProgress(): Record<string, CourseProgress> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem("ai-tutor-learning-progress");
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function LearningDashboard() {
  const [mounted, setMounted] = useState(false);
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [progress, setProgress] = useState<Record<string, CourseProgress>>({});

  useEffect(() => {
    // 动态加载课程列表（服务端 manifest 为准）
    fetch("/api/courses")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data?.courses)) {
          setCourses(data.courses);
        }
      })
      .catch(() => {});

    setProgress(loadAllProgress());
    setMounted(true);

    // 监听 localStorage 变化（跨标签页同步）+ 同标签页进度更新
    const onStorage = () => setProgress(loadAllProgress());
    window.addEventListener("storage", onStorage);
    window.addEventListener("progress-update", onStorage);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("progress-update", onStorage);
    };
  }, []);

  if (!mounted) {
    return (
      <Card className="h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </Card>
    );
  }

  if (courses.length === 0) {
    return (
      <Card className="h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">暂无课程数据</p>
      </Card>
    );
  }

  let totalLessons = 0;
  let completedLessons = 0;
  let totalExercises = 0;
  let completedExercises = 0;

  const courseStats = courses.map((course) => {
    const p = progress[course.id];
    const cl = p?.completedLessons.length || 0;
    const ce = p?.completedExercises.length || 0;
    totalLessons += course.totalLessons;
    completedLessons += cl;
    totalExercises += course.totalExercises;
    completedExercises += ce;
    return { ...course, completedLessons: cl, completedExercises: ce };
  });

  const lessonPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
  const exercisePercent = totalExercises > 0 ? Math.round((completedExercises / totalExercises) * 100) : 0;
  const overallPercent = (totalLessons + totalExercises) > 0
    ? Math.round(((completedLessons + completedExercises) / (totalLessons + totalExercises)) * 100)
    : 0;

  // 最近活跃
  const lastActive = (() => {
    let latest = 0;
    for (const cp of Object.values(progress)) {
      if (cp.lastActiveAt > latest) latest = cp.lastActiveAt;
    }
    return latest;
  })();

  return (
    <div className="space-y-6">
      {/* 总览卡片 */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">总体进度</p>
                <p className="text-3xl font-bold">{overallPercent}%</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">课时完成</p>
                <p className="text-3xl font-bold">
                  {completedLessons}<span className="text-lg text-muted-foreground font-normal">/{totalLessons}</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-950/50 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">练习完成</p>
                <p className="text-3xl font-bold">
                  {completedExercises}<span className="text-lg text-muted-foreground font-normal">/{totalExercises}</span>
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">最近学习</p>
                <p className="text-lg font-semibold mt-1">
                  {lastActive ? formatTimeAgo(lastActive) : "暂无记录"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 进度条 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            学习进度详情
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {courseStats.map((course) => {
            const lPct = course.totalLessons > 0
              ? Math.round((course.completedLessons / course.totalLessons) * 100)
              : 0;
            const ePct = course.totalExercises > 0
              ? Math.round((course.completedExercises / course.totalExercises) * 100)
              : 0;

            return (
              <div key={course.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{course.title}</h3>
                  <Badge variant="secondary">
                    {course.completedLessons + course.completedExercises}/
                    {course.totalLessons + course.totalExercises} 项
                  </Badge>
                </div>

                {/* 课时进度条 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>📖 课时</span>
                    <span>{course.completedLessons}/{course.totalLessons}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all duration-500"
                      style={{ width: `${lPct}%` }}
                    />
                  </div>
                </div>

                {/* 练习进度条 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>✏️ 练习</span>
                    <span>{course.completedExercises}/{course.totalExercises}</span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${ePct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}

          {completedLessons + completedExercises === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>还没有学习记录</p>
              <p className="text-sm">开始学习课程后，这里会显示你的进度</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "刚刚";
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  return `${days} 天前`;
}
