/**
 * 课程加载工具
 * 读取 content/ 目录下的课程 manifest 和 MDX 文件
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import path from "path";

const CONTENT_DIR = path.join(process.cwd(), "content");

export interface LessonMeta {
  id: string;
  file: string;
  title: string;
  duration: string;
}

export interface CourseMeta {
  id: string;
  title: string;
  description: string;
  level: string;
  lessons: LessonMeta[];
}

/** 获取所有课程列表 */
export function getCourses(): CourseMeta[] {
  if (!existsSync(CONTENT_DIR)) return [];

  return readdirSync(CONTENT_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const manifestPath = path.join(CONTENT_DIR, d.name, "manifest.json");
      if (!existsSync(manifestPath)) return null;
      try {
        const raw = readFileSync(manifestPath, "utf-8");
        return JSON.parse(raw) as CourseMeta;
      } catch {
        return null;
      }
    })
    .filter(Boolean) as CourseMeta[];
}

/** 获取单个课程 */
export function getCourse(courseId: string): CourseMeta | null {
  const manifestPath = path.join(CONTENT_DIR, courseId, "manifest.json");
  if (!existsSync(manifestPath)) return null;
  try {
    return JSON.parse(readFileSync(manifestPath, "utf-8")) as CourseMeta;
  } catch {
    return null;
  }
}

/** 解析 MDX frontmatter 和内容 */
export function parseLesson(courseId: string, fileName: string): {
  frontmatter: Record<string, string>;
  content: string;
} | null {
  const filePath = path.join(CONTENT_DIR, courseId, fileName);
  if (!existsSync(filePath)) return null;

  try {
    const raw = readFileSync(filePath, "utf-8");

    // 解析 YAML frontmatter（--- 包裹）
    const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!fmMatch) return { frontmatter: {}, content: raw };

    const frontmatter: Record<string, string> = {};
    fmMatch[1].split("\n").forEach((line) => {
      const [key, ...rest] = line.split(":");
      if (key && rest.length) {
        frontmatter[key.trim()] = rest.join(":").trim().replace(/^"|"$/g, "");
      }
    });

    return { frontmatter, content: fmMatch[2].trim() };
  } catch {
    return null;
  }
}

/** 简单的 Markdown → HTML 转换（增强版） */
export function markdownToHtml(md: string): string {
  let html = md;

  // 图片（必须在链接之前处理）
  html = html.replace(
    /!\[([^\]]*)\]\(([^)]+)\)/g,
    '<img src="$2" alt="$1" class="rounded-lg max-w-full my-2" />'
  );

  // 链接
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noopener" class="text-primary underline hover:no-underline">$1</a>'
  );

  // 代码块（带语法高亮）
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    const escaped = code
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    // 简单关键字高亮：print, def, if, else, for, import, return, class, try, except, True, False, None, in, not, and, or
    const highlighted = escaped.replace(
      /\b(print|def|if|elif|else|for|while|import|from|return|class|try|except|finally|True|False|None|in|not|and|or|as|with|break|continue|pass|raise)\b/g,
      '<span class="text-purple-400">$1</span>'
    );
    const langLabel = lang
      ? `<div class="text-xs text-muted-foreground mb-1">${lang}</div>`
      : "";
    return `<pre class="bg-muted rounded-lg p-4 overflow-x-auto my-4">${langLabel}<code class="language-${lang}">${highlighted}</code></pre>`;
  });

  // 行内代码
  html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

  // 标题
  html = html.replace(/^#### (.+)$/gm, "<h4>$1</h4>");
  html = html.replace(/^### (.+)$/gm, "<h3>$1</h3>");
  html = html.replace(/^## (.+)$/gm, "<h2>$1</h2>");

  // 粗体 + 斜体
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // 表格
  const tableRegex = /^(\|.+\|\n)+/gm;
  html = html.replace(tableRegex, (tableBlock: string) => {
    const rows = tableBlock.trim().split("\n");
    let result = "<table>";
    let isFirst = true;
    for (const row of rows) {
      const cells = row.split("|").filter((c) => c.trim());
      if (row.includes("---")) continue;
      const tag = isFirst ? "th" : "td";
      isFirst = false;
      result +=
        "<tr>" +
        cells.map((c) => `<${tag}>${c.trim()}</${tag}>`).join("") +
        "</tr>";
    }
    result += "</table>";
    return result;
  });

  // 引用
  html = html.replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>");

  // 分割线
  html = html.replace(/^---$/gm, "<hr>");

  // 有序列表
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="ordered">$2</li>');

  // 无序列表
  html = html.replace(/^- (.+)$/gm, "<li>$1</li>");

  // 段落（连续的非空行）
  html = html.replace(/\n\n/g, "</p><p>");
  html = "<p>" + html + "</p>";

  // 清理空标签和嵌套
  html = html.replace(/<p>\s*<\/p>/g, "");
  html = html.replace(/<p>(<[hp].*?>)/g, "$1");
  html = html.replace(/(<\/[hp]\d?>)\s*<\/p>/g, "$1");

  // 包裹相邻的 li 为 ol/ul
  html = html.replace(
    /(<li class="ordered">[\s\S]*?)(?=<\/p>|<h\d|<blockquote|<pre|<hr|<li[^o]|$)/g,
    (match) => `<ol>${match}</ol>`
  );
  html = html.replace(
    /(<li(?! class="ordered")[\s\S]*?)(?=<\/p>|<h\d|<blockquote|<pre|<hr|<ol|$)/g,
    (match) => {
      // 只包装非 ordered 的 li
      if (!match.includes('class="ordered"')) {
        return `<ul>${match}</ul>`;
      }
      return match;
    }
  );

  return html;
}
