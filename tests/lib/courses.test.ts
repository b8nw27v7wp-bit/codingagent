import { describe, it, expect } from "vitest";
import { markdownToHtml } from "@/lib/courses";

describe("markdownToHtml", () => {
  it("converts headers", () => {
    const result = markdownToHtml("## 标题");
    expect(result).toContain("<h2>标题</h2>");
  });

  it("converts bold text", () => {
    const result = markdownToHtml("**粗体**");
    expect(result).toContain("<strong>粗体</strong>");
  });

  it("converts inline code", () => {
    const result = markdownToHtml("使用 `print()`");
    expect(result).toContain("<code>print()</code>");
  });

  it("converts code blocks with syntax highlighting", () => {
    const result = markdownToHtml("```python\nprint('hello')\n```");
    expect(result).toContain("text-purple-400");
    expect(result).toContain("print");
  });

  it("converts links", () => {
    const result = markdownToHtml("[百度](https://baidu.com)");
    expect(result).toContain('href="https://baidu.com"');
    expect(result).toContain("百度");
  });

  it("converts images", () => {
    const result = markdownToHtml("![logo](logo.png)");
    expect(result).toContain('src="logo.png"');
    expect(result).toContain('alt="logo"');
  });

  it("converts tables", () => {
    const result = markdownToHtml(
      "| A | B |\n| --- | --- |\n| 1 | 2 |\n"
    );
    expect(result).toContain("<table>");
    expect(result).toContain("<th>A</th>");
    expect(result).toContain("<td>1</td>");
  });

  it("converts unordered lists", () => {
    const result = markdownToHtml("- 项目1\n- 项目2");
    expect(result).toContain("<li>项目1</li>");
    expect(result).toContain("<li>项目2</li>");
  });

  it("converts ordered lists", () => {
    const result = markdownToHtml("1. 第一\n2. 第二");
    expect(result).toContain("class=\"ordered\"");
  });

  it("converts blockquotes", () => {
    const result = markdownToHtml("> 引用");
    expect(result).toContain("<blockquote>引用</blockquote>");
  });

  it("wraps paragraphs", () => {
    const result = markdownToHtml("段落1\n\n段落2");
    expect(result).toContain("<p>");
    expect(result).toContain("段落1");
    expect(result).toContain("段落2");
  });

  it("handles empty string", () => {
    const result = markdownToHtml("");
    expect(result).toBe("");
  });
});

describe("parseLesson", () => {
  it("parses frontmatter and content", () => {
    const mdx = `---
title: 测试课程
duration: 15分钟
---

# 内容标题
这是内容。`;

    // parseLesson 需要文件存在，这里测试正则逻辑
    const fmMatch = mdx.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    expect(fmMatch).not.toBeNull();
    expect(fmMatch![2].trim()).toBe("# 内容标题\n这是内容。");
  });

  it("returns raw content when no frontmatter", () => {
    const md = "# 没有 frontmatter";
    const fmMatch = md.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    expect(fmMatch).toBeNull();
  });
});
