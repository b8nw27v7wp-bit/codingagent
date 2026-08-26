import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkDbConnection } from "@/lib/db";

// 健康检查不做预渲染/缓存，每次请求实时探测
export const dynamic = "force-dynamic";

/** GET /api/health — 服务健康状态（不泄露任何内部信息） */
export async function GET(_req: NextRequest) {
  const db = (await checkDbConnection()) ? "connected" : "error";
  return NextResponse.json({
    status: "ok",
    db,
    uptime: Math.floor(process.uptime()),
  });
}
