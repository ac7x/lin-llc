'use client';

import React from "react";
import { OwnerBottomNav } from "./owner-nav";
import { useAuth } from "@/hooks/useFirebase";

/**
 * 僅在用戶登入時顯示 OwnerBottomNav
 */
export function OwnerBottomNavWrapper(): React.JSX.Element | null {
  const { user, isReady } = useAuth();
  if (!isReady || !user) return null;
  return <OwnerBottomNav />;
}
