'use client';

import { useState, useEffect } from 'react';
import { ProjectStats } from '../types/dashboard';

/**
 * 用於獲取專案數據的自訂 Hook (佔位符)
 * @returns 包含專案數據、載入狀態和錯誤訊息的物件
 */
export function useProjectData() {
  const [projects, setProjects] = useState<ProjectStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // 待辦：未來將在此處實現從 Firebase 獲取數據的邏輯
    // 目前僅模擬非同步操作完成
    setLoading(false);
  }, []);

  return { projects, loading, error };
}
