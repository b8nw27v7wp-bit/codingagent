"use client";

import { useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserRound, LogOut, Loader2 } from "lucide-react";
import { useToast } from "@/components/toast-provider";
import { syncProgressFromServer } from "@/lib/progress";

type Mode = "login" | "register";

/** 顶部导航认证按钮：未登录显示登录入口，已登录显示用户菜单 */
export function AuthButtons() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { success: toastSuccess, error: toastError } = useToast();

  const loggedIn = status === "authenticated";

  async function handleSubmit() {
    if (!email.trim() || !password) {
      toastError("请输入邮箱和密码");
      return;
    }
    setSubmitting(true);
    try {
      if (mode === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          toastError(data.error || "注册失败");
          return;
        }
        toastSuccess("注册成功，正在登录...");
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toastError("邮箱或密码不正确");
        return;
      }

      toastSuccess(mode === "login" ? "登录成功" : "已登录");
      setOpen(false);
      setEmail("");
      setPassword("");
      // 拉取云端进度并合并到本地（完成后触发 progress-update 刷新看板）
      syncProgressFromServer();
    } catch {
      toastError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  }

  if (loggedIn) {
    return (
      <div className="flex items-center gap-2">
        <span
          className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground max-w-[180px] truncate"
          title={session.user?.email || ""}
        >
          <UserRound className="w-3.5 h-3.5 shrink-0" />
          {session.user?.email}
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground"
          onClick={() => signOut({ redirect: false }).then(() => toastSuccess("已退出登录"))}
          title="退出登录"
        >
          <LogOut className="w-3.5 h-3.5 mr-1" />
          退出
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button variant="outline" size="sm" className="h-7 text-xs">
          <UserRound className="w-3.5 h-3.5 mr-1" />
          登录
        </Button>
      } />
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{mode === "login" ? "登录" : "注册账号"}</DialogTitle>
          <DialogDescription>
            {mode === "login"
              ? "登录后学习进度将云端同步，换设备不丢失"
              : "注册后学习进度云端同步，游客模式的数据会自动合并"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="邮箱"
            autoComplete="email"
          />
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="密码（至少 6 位）"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
            }}
          />
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full"
          >
            {submitting && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            {mode === "login" ? "登录" : "注册并登录"}
          </Button>
          <button
            type="button"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors w-full text-center"
            onClick={() => setMode(mode === "login" ? "register" : "login")}
          >
            {mode === "login" ? "没有账号？去注册" : "已有账号？去登录"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
