import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { initDb, loadUserProgress, saveUserProgress } from "@/lib/db";

/** GET /api/progress — 读取当前登录用户的全部学习进度 */
export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  try {
    await initDb();
    const progress = await loadUserProgress(Number(session.user.id));
    return NextResponse.json({ ok: true, progress });
  } catch {
    return NextResponse.json({ error: "数据库不可用" }, { status: 500 });
  }
}

/** PUT /api/progress — 整体保存当前登录用户的学习进度（按课程 upsert） */
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  let body: { progress?: Record<string, unknown> };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const progress = body.progress;
  if (!progress || typeof progress !== "object" || Array.isArray(progress)) {
    return NextResponse.json({ error: "进度格式错误" }, { status: 400 });
  }

  try {
    await initDb();
    await saveUserProgress(Number(session.user.id), progress);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "数据库不可用" }, { status: 500 });
  }
}
