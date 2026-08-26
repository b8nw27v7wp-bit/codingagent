import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { checkDbConnection } from "@/lib/db";

// mock 掉 mysql2 连接池，测试不依赖真实数据库
vi.mock("mysql2/promise", () => {
  const query = vi.fn();
  return {
    default: { createPool: () => ({ query }) },
  };
});

import mysql from "mysql2/promise";
const pool = (mysql as unknown as { createPool: () => { query: ReturnType<typeof vi.fn> } }).createPool("");

describe("checkDbConnection", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("DB 正常时返回 true", async () => {
    (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue([[]]);
    await expect(checkDbConnection()).resolves.toBe(true);
  });

  it("查询抛错（如连接失败）时返回 false，不向外泄露错误细节", async () => {
    (pool.query as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error("ECONNREFUSED 127.0.0.1:3306")
    );
    const result = await checkDbConnection();
    expect(result).toBe(false);
  });

  it("超过超时时间未响应时返回 false（超时兜底）", async () => {
    (pool.query as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // 永不 resolve
    );
    const pending = checkDbConnection(500);
    await vi.advanceTimersByTimeAsync(501);
    await expect(pending).resolves.toBe(false);
  });

  it("正常路径下不会触发超时兜底", async () => {
    (pool.query as ReturnType<typeof vi.fn>).mockResolvedValue([[{ "1": 1 }]]);
    const pending = checkDbConnection(1000);
    await vi.advanceTimersByTimeAsync(1500);
    await expect(pending).resolves.toBe(true);
  });
});
