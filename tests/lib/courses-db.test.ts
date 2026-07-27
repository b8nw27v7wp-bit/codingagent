import { describe, it, expect } from "vitest";
import { getCourses, getCourse, markdownToHtml } from "@/lib/courses";

describe("getCourses", () => {
  it("returns array of courses", () => {
    const courses = getCourses();
    expect(Array.isArray(courses)).toBe(true);
  });

  it("includes python-basics course", () => {
    const courses = getCourses();
    const py = courses.find((c) => c.id === "python-basics");
    expect(py).toBeDefined();
    expect(py?.title).toBe("Python 基础语法");
  });

  it("course has 10 lessons", () => {
    const courses = getCourses();
    const py = courses.find((c) => c.id === "python-basics");
    expect(py?.lessons.length).toBe(10);
  });

  it("lessons have required fields", () => {
    const courses = getCourses();
    const py = courses.find((c) => c.id === "python-basics");
    expect(py).toBeDefined();
    py?.lessons.forEach((l) => {
      expect(l.id).toBeTruthy();
      expect(l.file).toBeTruthy();
      expect(l.title).toBeTruthy();
      expect(l.duration).toBeTruthy();
    });
  });
});

describe("getCourse", () => {
  it("returns null for non-existent course", () => {
    expect(getCourse("fake-course")).toBeNull();
  });

  it("returns course by id", () => {
    const course = getCourse("python-basics");
    expect(course).toBeDefined();
    expect(course?.id).toBe("python-basics");
  });
});

describe("markdownToHtml security", () => {
  it("escapes HTML in code blocks", () => {
    const result = markdownToHtml("```\n<script>alert('xss')</script>\n```");
    expect(result).toContain("&lt;script&gt;");
    expect(result).not.toContain("<script>");
  });
});
