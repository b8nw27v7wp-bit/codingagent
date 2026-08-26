import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
      // lib/db.ts 引了 Next 专用的 server-only 包（未随依赖安装），
      // 单测环境下用空模块替代，仅影响测试运行
      "server-only": path.resolve(__dirname, "tests/stubs/server-only.ts"),
    },
  },
});
