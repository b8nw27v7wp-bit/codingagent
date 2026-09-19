"use client";

import { useSyncExternalStore } from "react";

/** 空订阅：挂载状态只翻转一次，不需要外部事件源 */
const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

/**
 * 是否已在客户端完成挂载。
 *
 * 服务端与客户端首帧（水合）返回 false，水合完成后返回 true —— 既保证 SSR 与首帧输出一致，
 * 又不需要在 useEffect 中同步 setState（React Compiler 规则 react-hooks/set-state-in-effect 禁止该写法）。
 *
 * 用途：需要等浏览器 API（localStorage 等）就绪后才渲染的客户端组件做 hydration 保护。
 */
export function useMounted(): boolean {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
