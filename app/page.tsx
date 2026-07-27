import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Code, MessageCircle, Sparkles, BarChart3 } from "lucide-react";
import { ChatPanel } from "@/components/tutor/chat-panel";
import { CodePlayground } from "@/components/tutor/code-playground";
import { LearningDashboard } from "@/components/tutor/learning-dashboard";
import { getCourses } from "@/lib/courses";

export default function Home() {
  const courses = getCourses();

  return (
    <main className="flex-1 p-4 sm:p-6 max-w-5xl mx-auto w-full space-y-6 sm:space-y-8">
      <div className="space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          <Sparkles className="inline-block w-6 h-6 sm:w-8 sm:h-8 mr-2 text-yellow-500" />
          AI 编程教学助手
        </h1>
        <p className="text-muted-foreground text-sm sm:text-lg">
          基于大语言模型的智能编程辅导系统，帮助零基础初学者开启编程之旅
        </p>
      </div>

      <Tabs defaultValue="learn" className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto">
          <TabsTrigger value="learn" className="text-xs sm:text-sm py-2">
            <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">课程学习</span>
            <span className="sm:hidden">课程</span>
          </TabsTrigger>
          <TabsTrigger value="practice" className="text-xs sm:text-sm py-2">
            <Code className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">在线练习</span>
            <span className="sm:hidden">练习</span>
          </TabsTrigger>
          <TabsTrigger value="assistant" className="text-xs sm:text-sm py-2">
            <MessageCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">AI 辅导</span>
            <span className="sm:hidden">AI</span>
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="text-xs sm:text-sm py-2">
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">学习数据</span>
            <span className="sm:hidden">数据</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="learn" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((course) => (
              <Link key={course.id} href={`/courses/${course.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <Badge variant="secondary">
                        {course.level === "beginner" ? "入门" : "进阶"}
                      </Badge>
                    </div>
                    <CardDescription>{course.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {course.lessons.length} 课时
                    </span>
                    <Button variant="outline" size="sm">
                      开始学习
                    </Button>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="practice" className="mt-6">
          <CodePlayground />
        </TabsContent>

        <TabsContent value="assistant" className="mt-6">
          <ChatPanel />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6">
          <LearningDashboard />
        </TabsContent>
      </Tabs>
    </main>
  );
}
