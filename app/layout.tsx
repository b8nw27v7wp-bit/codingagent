import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { ToastProvider } from "@/components/toast-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sparkles } from "lucide-react";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI 编程教学助手",
  description: "基于大语言模型的编程初学者智能辅导系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {/* 无障碍：跳过导航 */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded"
        >
          跳转到主内容
        </a>

        <ThemeProvider>
          <ToastProvider>
            <TooltipProvider>
              {/* 顶部导航 */}
              <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-10">
                <div className="max-w-5xl mx-auto px-3 sm:px-6 h-14 flex items-center justify-between">
                  <Link
                    href="/"
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    aria-label="AI 编程教学助手 首页"
                  >
                    <Sparkles className="w-5 h-5 text-yellow-500 shrink-0" />
                    <span className="font-semibold text-sm sm:text-base whitespace-nowrap">
                      AI 编程教学助手
                    </span>
                  </Link>

                  <nav className="flex items-center gap-1" aria-label="主导航">
                    <Link
                      href="/courses"
                      className="text-xs sm:text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-md transition-colors"
                    >
                      课程
                    </Link>
                    <ThemeToggle />
                  </nav>
                </div>
              </header>

              {/* 主内容 */}
              <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col">
                {children}
              </main>

              {/* 底部 */}
              <footer className="border-t py-3 text-center text-xs text-muted-foreground">
                <p>AI 编程教学助手 © 2026</p>
              </footer>
            </TooltipProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
