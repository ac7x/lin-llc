'use client';

import React from "react";
import { OwnerBottomNav } from "./owner-nav";
import { useAuth } from "@/hooks/useAuth";

export function OwnerBottomNavWrapper(): React.JSX.Element | null {
  const { user, isReady } = useAuth();
  if (!isReady || !user) return null;
  return <OwnerBottomNav />;
}
