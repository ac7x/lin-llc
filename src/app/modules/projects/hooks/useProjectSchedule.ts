/**
 * 專案時程 Hook
 * 
 * 提供專案時程相關的狀態管理和數據處理
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { ScheduleService, type ScheduleItem, type ScheduleDependency, type ScheduleStats } from '../services/scheduleService';

interface UseProjectScheduleOptions {
  projectId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseProjectScheduleReturn {
  // 數據狀態
  scheduleItems: ScheduleItem[];
  dependencies: ScheduleDependency[];
  stats: ScheduleStats | null;
  isLoading: boolean;
  error: string | null;
  
  // 篩選狀態
  selectedItemId: string | null;
  filterType: string[];
  filterStatus: string[];
  
  // 操作方法
  refreshSchedule: () => Promise<void>;
  setSelectedItemId: (id: string | null) => void;
  setFilterType: (types: string[]) => void;
  setFilterStatus: (statuses: string[]) => void;
  updateItemProgress: (itemId: string, progress: number) => Promise<void>;
  addDependency: (dependency: Omit<ScheduleDependency, 'id'>) => Promise<void>;
  deleteDependency: (dependencyId: string) => Promise<void>;
  
  // 計算屬性
  filteredItems: ScheduleItem[];
  upcomingDeadlines: ScheduleItem[];
  overdueItems: ScheduleItem[];
  criticalPathItems: ScheduleItem[];
}

export function useProjectSchedule({
  projectId,
  autoRefresh = true,
  refreshInterval = 30000, // 30秒
}: UseProjectScheduleOptions): UseProjectScheduleReturn {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [dependencies, setDependencies] = useState<ScheduleDependency[]>([]);
  const [stats, setStats] = useState<ScheduleStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);

  // 初始化載入
  useEffect(() => {
    const loadData = async () => {
      if (!projectId) return;

      try {
        setIsLoading(true);
        setError(null);
        
        const [itemsData, dependenciesData, statsData] = await Promise.all([
          ScheduleService.getProjectSchedule(projectId),
          ScheduleService.getProjectDependencies(projectId),
          ScheduleService.getScheduleStats(projectId),
        ]);
        
        setScheduleItems(itemsData);
        setDependencies(dependenciesData);
        setStats(statsData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '載入時程數據失敗';
        setError(errorMessage);
        console.error('載入時程數據失敗:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  // 自動刷新
  useEffect(() => {
    if (!autoRefresh || !projectId) return;

    const interval = setInterval(async () => {
      try {
        const [itemsData, dependenciesData, statsData] = await Promise.all([
          ScheduleService.getProjectSchedule(projectId),
          ScheduleService.getProjectDependencies(projectId),
          ScheduleService.getScheduleStats(projectId),
        ]);
        
        setScheduleItems(itemsData);
        setDependencies(dependenciesData);
        setStats(statsData);
      } catch (err) {
        console.error('自動刷新時程數據失敗:', err);
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, projectId]);

  // 手動刷新時程
  const refreshSchedule = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      setError(null);
      
      const [itemsData, dependenciesData, statsData] = await Promise.all([
        ScheduleService.getProjectSchedule(projectId),
        ScheduleService.getProjectDependencies(projectId),
        ScheduleService.getScheduleStats(projectId),
      ]);
      
      setScheduleItems(itemsData);
      setDependencies(dependenciesData);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入時程數據失敗';
      setError(errorMessage);
      console.error('載入時程數據失敗:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // 更新項目進度
  const updateItemProgress = useCallback(async (itemId: string, progress: number) => {
    try {
      await ScheduleService.updateScheduleItemProgress(projectId, itemId, progress);
      
      // 更新本地狀態
      setScheduleItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, progress }
            : item
        )
      );
      
      // 重新載入統計資料
      const newStats = await ScheduleService.getScheduleStats(projectId);
      setStats(newStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '更新進度失敗';
      setError(errorMessage);
      console.error('更新進度失敗:', err);
    }
  }, [projectId]);

  // 新增依賴關係
  const addDependency = useCallback(async (dependency: Omit<ScheduleDependency, 'id'>) => {
    try {
      const dependencyId = await ScheduleService.addDependency(projectId, dependency);
      const newDependency = { id: dependencyId, ...dependency };
      setDependencies(prev => [newDependency, ...prev]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '新增依賴關係失敗';
      setError(errorMessage);
      console.error('新增依賴關係失敗:', err);
    }
  }, [projectId]);

  // 刪除依賴關係
  const deleteDependency = useCallback(async (dependencyId: string) => {
    try {
      await ScheduleService.deleteDependency(projectId, dependencyId);
      setDependencies(prev => prev.filter(dep => dep.id !== dependencyId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '刪除依賴關係失敗';
      setError(errorMessage);
      console.error('刪除依賴關係失敗:', err);
    }
  }, [projectId]);

  // 篩選後的項目
  const filteredItems = useMemo(() => {
    let filtered = scheduleItems;

    // 按類型篩選
    if (filterType.length > 0) {
      filtered = filtered.filter(item => filterType.includes(item.type));
    }

    // 按狀態篩選
    if (filterStatus.length > 0) {
      filtered = filtered.filter(item => {
        if (filterStatus.includes('completed') && item.progress >= 100) return true;
        if (filterStatus.includes('in-progress') && item.progress > 0 && item.progress < 100) return true;
        if (filterStatus.includes('not-started') && item.progress === 0) return true;
        if (filterStatus.includes('overdue') && item.end < new Date() && item.progress < 100) return true;
        return false;
      });
    }

    return filtered;
  }, [scheduleItems, filterType, filterStatus]);

  // 即將到期的項目
  const upcomingDeadlines = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    return scheduleItems.filter(item => 
      item.end >= today && 
      item.end <= nextWeek && 
      item.progress < 100
    );
  }, [scheduleItems]);

  // 逾期的項目
  const overdueItems = useMemo(() => {
    const today = new Date();
    return scheduleItems.filter(item => 
      item.end < today && item.progress < 100
    );
  }, [scheduleItems]);

  // 關鍵路徑項目
  const criticalPathItems = useMemo(() => {
    if (!stats?.criticalPath) return [];
    return scheduleItems.filter(item => stats.criticalPath.includes(item.id));
  }, [scheduleItems, stats]);

  return {
    // 數據狀態
    scheduleItems,
    dependencies,
    stats,
    isLoading,
    error,
    
    // 篩選狀態
    selectedItemId,
    filterType,
    filterStatus,
    
    // 操作方法
    refreshSchedule,
    setSelectedItemId,
    setFilterType,
    setFilterStatus,
    updateItemProgress,
    addDependency,
    deleteDependency,
    
    // 計算屬性
    filteredItems,
    upcomingDeadlines,
    overdueItems,
    criticalPathItems,
  };
}

/**
 * 簡化的時程 Hook，用於基本時程功能
 */
export function useSimpleProjectSchedule(projectId: string) {
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化載入
  useEffect(() => {
    const loadData = async () => {
      if (!projectId) return;

      try {
        setIsLoading(true);
        setError(null);
        const itemsData = await ScheduleService.getProjectSchedule(projectId);
        setScheduleItems(itemsData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '載入時程數據失敗';
        setError(errorMessage);
        console.error('載入時程數據失敗:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [projectId]);

  // 刷新函數
  const refresh = useCallback(async () => {
    if (!projectId) return;

    try {
      setIsLoading(true);
      setError(null);
      const itemsData = await ScheduleService.getProjectSchedule(projectId);
      setScheduleItems(itemsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '載入時程數據失敗';
      setError(errorMessage);
      console.error('載入時程數據失敗:', err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  return {
    scheduleItems,
    isLoading,
    error,
    refresh,
  };
}
