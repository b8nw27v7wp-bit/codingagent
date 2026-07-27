import { describe, it, expect } from "vitest";
import { getExercise, getExercises, getAllExercises } from "@/lib/exercises";

describe("getExercises", () => {
  it("returns exercises for lesson 01", () => {
    const exercises = getExercises("python-basics", "01");
    expect(exercises.length).toBe(2);
  });

  it("returns exercises for all lessons", () => {
    for (const lessonId of ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]) {
      const exercises = getExercises("python-basics", lessonId);
      expect(exercises.length).toBe(2);
    }
  });

  it("returns empty for non-existent lesson", () => {
    expect(getExercises("python-basics", "99")).toEqual([]);
  });

  it("returns empty for non-existent course", () => {
    expect(getExercises("fake-course", "01")).toEqual([]);
  });

  it("each exercise has required fields", () => {
    const exercises = getExercises("python-basics", "01");
    exercises.forEach((ex) => {
      expect(ex.id).toBeTruthy();
      expect(ex.title).toBeTruthy();
      expect(ex.description).toBeTruthy();
      expect(Array.isArray(ex.testCases)).toBe(true);
      expect(ex.testCases.length).toBeGreaterThan(0);
      expect(Array.isArray(ex.hints)).toBe(true);
    });
  });

  it("test cases have expected and input fields", () => {
    const exercises = getExercises("python-basics", "01");
    exercises.forEach((ex) => {
      ex.testCases.forEach((tc) => {
        expect(tc).toHaveProperty("expected");
        expect(tc).toHaveProperty("input");
      });
    });
  });
});

describe("getExercise", () => {
  it("returns single exercise by id", () => {
    const ex = getExercise("python-basics-01-01");
    expect(ex).not.toBeNull();
    expect(ex?.id).toBe("python-basics-01-01");
    expect(ex?.title).toBe("你的第一个 Python 程序");
  });

  it("returns null for non-existent exercise", () => {
    expect(getExercise("python-basics-99-99")).toBeNull();
  });
});

describe("getAllExercises", () => {
  it("returns 20 exercises for python-basics", () => {
    const all = getAllExercises("python-basics");
    expect(all.length).toBe(20);
  });

  it("returns empty for non-existent course", () => {
    expect(getAllExercises("fake-course")).toEqual([]);
  });
});
