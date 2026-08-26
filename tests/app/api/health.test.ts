import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

// mock 数据库探测层：分别模拟 connected / error 两种分支
const mockCheck = vi.fn();
vi.mock("@/lib/db", () => ({
  checkDbConnection: (...args: unknown[]) => mockCheck(...args),
}));

import { GET } from "@/app/api/health/route";

function makeRequest(): NextRequest {
  return new Request("http://localhost:3000/api/health") as NextRequest;
}

describe("GET /api/health", () => {
  beforeEach(() => {
    mockCheck.mockReset();
  });

  it("DB 正常：返回 200 + status ok + db connected", async () => {
    mockCheck.mockResolvedValue(true);
    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.db).toBe("connected");
    expect(typeof body.uptime).toBe("number");
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });

  it("DB 异常：仍返回 200，db 为 error，不泄露内部信息", async () => {
    mockCheck.mockResolvedValue(false);
    const res = await GET(makeRequest());

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.db).toBe("error");
    // 响应体只允许三个字段，不得携带堆栈/主机等内部信息
    expect(Object.keys(body).sort()).toEqual(["db", "status", "uptime"]);
    expect(JSON.stringify(body)).not.toMatch(/ECONNREFUSED|host|password|stack/i);
  });
});
