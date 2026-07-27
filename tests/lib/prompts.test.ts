import { describe, it, expect } from "vitest";
import { buildTeachingPrompt, SOCRATIC_PROMPT, TOPIC_GUARD } from "@/lib/prompts/tutor";

describe("buildTeachingPrompt", () => {
  it("includes Socratic prompt", () => {
    const prompt = buildTeachingPrompt("beginner");
    expect(prompt).toContain("编程教学助手");
    expect(prompt).toContain("不要直接给出答案");
  });

  it("includes topic guard", () => {
    const prompt = buildTeachingPrompt("beginner");
    expect(prompt).toContain("只回答编程学习相关");
  });

  it("beginner level includes simple language instruction", () => {
    const prompt = buildTeachingPrompt("beginner");
    expect(prompt).toContain("零基础初学者");
    expect(prompt).toContain("最简单");
  });

  it("intermediate level uses professional terms", () => {
    const prompt = buildTeachingPrompt("intermediate");
    expect(prompt).toContain("专业术语");
  });

  it("separates sections with --- delimiter", () => {
    const prompt = buildTeachingPrompt("beginner");
    expect(prompt).toContain("---");
  });
});

describe("SOCRATIC_PROMPT", () => {
  it("defines 5 hint levels", () => {
    expect(SOCRATIC_PROMPT).toContain("第 1 层");
    expect(SOCRATIC_PROMPT).toContain("第 5 层");
  });

  it("emphasizes student self-learning", () => {
    expect(SOCRATIC_PROMPT).toContain("自己");
  });
});

describe("TOPIC_GUARD", () => {
  it("restricts to programming topics", () => {
    expect(TOPIC_GUARD).toContain("编程学习");
    expect(TOPIC_GUARD).toContain("无关话题");
  });
});
