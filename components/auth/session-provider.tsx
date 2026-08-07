"use client";

import { SessionProvider } from "next-auth/react";

/** 认证会话 Provider（包裹整个应用） */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
