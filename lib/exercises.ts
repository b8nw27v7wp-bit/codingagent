/**
 * 练习题目数据结构 & 加载器
 */

import { readFileSync, existsSync, readdirSync } from "fs";
import path from "path";

const CONTENT_DIR = path.join(process.cwd(), "content");

export interface TestCase {
  input: string; // stdin 输入（空字符串表示无输入）
  expected: string; // 预期输出
}

export interface Exercise {
  id: string;
  courseId: string;
  lessonId: string;
  title: string;
  description: string;
  testCases: TestCase[];
  hints: string[];
}

/** 获取某门课某节课的所有练习题 */
export function getExercises(
  courseId: string,
  lessonId: string
): Exercise[] {
  const dir = path.join(CONTENT_DIR, courseId, "exercises");
  if (!existsSync(dir)) return [];

  const prefix = `${courseId}-${lessonId}-`;
  try {
    return readdirSync(dir)
      .filter((f: string) => f.startsWith(prefix) && f.endsWith(".json"))
      .map((f: string) => {
        try {
          return JSON.parse(
            readFileSync(path.join(dir, f), "utf-8")
          ) as Exercise;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as Exercise[];
  } catch {
    return [];
  }
}

/** 获取单道练习题 */
export function getExercise(exerciseId: string): Exercise | null {
  // exerciseId 格式: "python-basics-01-01"
  const parts = exerciseId.split("-");
  if (parts.length < 4) return null;

  // 重建 courseId: "python-basics"
  const courseId = parts.slice(0, -2).join("-");
  const lessonId = parts[parts.length - 2];
  const filePath = path.join(
    CONTENT_DIR,
    courseId,
    "exercises",
    `${exerciseId}.json`
  );

  if (!existsSync(filePath)) return null;
  try {
    return JSON.parse(readFileSync(filePath, "utf-8")) as Exercise;
  } catch {
    return null;
  }
}

/** 获取某门课所有练习题 */
export function getAllExercises(courseId: string): Exercise[] {
  const dir = path.join(CONTENT_DIR, courseId, "exercises");
  if (!existsSync(dir)) return [];
  try {
    return readdirSync(dir)
      .filter((f: string) => f.endsWith(".json"))
      .map((f: string) => {
        try {
          return JSON.parse(
            readFileSync(path.join(dir, f), "utf-8")
          ) as Exercise;
        } catch {
          return null;
        }
      })
      .filter(Boolean) as Exercise[];
  } catch {
    return [];
  }
}
