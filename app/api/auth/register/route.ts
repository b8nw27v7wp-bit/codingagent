import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUser, initDb } from "@/lib/db";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "邮箱格式不正确" }, { status: 400 });
  }
  if (password.length < 6) {
    return NextResponse.json({ error: "密码至少 6 位" }, { status: 400 });
  }
  if (password.length > 72) {
    return NextResponse.json({ error: "密码过长" }, { status: 400 });
  }

  try {
    await initDb();
  } catch {
    return NextResponse.json({ error: "数据库不可用" }, { status: 500 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await createUser(email, passwordHash);
  if (!user) {
    return NextResponse.json({ error: "该邮箱已注册，请直接登录" }, { status: 409 });
  }

  return NextResponse.json({ ok: true, email: user.email }, { status: 201 });
}
