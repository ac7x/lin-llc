/**
 * 底部導航包裝組件
 * 根據用戶認證狀態控制導航顯示
 * 提供導航組件的條件渲染
 */

'use client';

import React from "react";
import { OwnerBottomNav } from "./owner-nav";
import { useAuth } from "@/hooks/useAuth";

export function OwnerBottomNavWrapper(): React.JSX.Element | null {
  const { user, isReady } = useAuth();
  if (!isReady || !user) return null;
  return <OwnerBottomNav />;
}
