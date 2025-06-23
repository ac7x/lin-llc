/**
 * 專案分析 Hook
 * 
 * 提供專案分析相關功能：
 * - 專案統計分析
 * - 進度趨勢分析
 * - 績效指標計算
 * - 數據視覺化
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, limit } from 'firebase/firestore';

import { db } from '@/lib/firebase-client';
import { useAuth } from '@/hooks/useAuth';

// 分析數據型別
export interface AnalyticsData {
  // 基本統計
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  cancelledProjects: number;
  
  // 進度統計
  averageProgress: number;
  onTimeProjects: number;
  delayedProjects: number;
  
  // 品質統計
  averageQualityScore: number;
  highQualityProjects: number;
  lowQualityProjects: number;
  
  // 成本統計
  totalBudget: number;
  averageBudget: number;
  budgetUtilization: number;
  
  // 時間統計
  averageDuration: number;
  totalWorkPackages: number;
  totalIssues: number;
  
  // 趨勢數據
  monthlyTrends: MonthlyTrend[];
  statusDistribution: StatusDistribution[];
  typeDistribution: TypeDistribution[];
}

// 月度趨勢
export interface MonthlyTrend {
  month: string;
  projects: number;
  progress: number;
  quality: number;
}

// 狀態分佈
export interface StatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

// 類型分佈
export interface TypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

// 績效指標
export interface PerformanceMetrics {
  schedulePerformanceIndex: number;
  costPerformanceIndex: number;
  qualityPerformanceIndex: number;
  overallPerformance: number;
}

// 專案詳細分析
export interface ProjectAnalysis {
  projectId: string;
  projectName: string;
  status: string;
  progress: number;
  qualityScore: number;
  budget: number;
  startDate: Date;
  endDate: Date;
  workPackages: number;
  issues: number;
  performanceMetrics: PerformanceMetrics;
}

export function useProjectAnalytics() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1m' | '3m' | '6m' | '1y' | 'all'>('all');

  // 載入專案數據
  const [projectsSnapshot, projectsLoading, projectsError] = useCollection(
    collection(db, 'projects')
  );

  // 載入工作包數據
  const [workPackagesSnapshot, workPackagesLoading, workPackagesError] = useCollection(
    collection(db, 'workPackages')
  );

  // 載入問題數據
  const [issuesSnapshot, issuesLoading, issuesError] = useCollection(
    collection(db, 'issues')
  );

  // 處理錯誤
  const handleError = useCallback((err: Error, operation: string) => {
    console.error(`專案分析錯誤 (${operation}):`, err);
    setError(`${operation} 失敗: ${err.message}`);
  }, []);

  // 清除錯誤
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 計算基本統計
  const calculateBasicStats = useCallback(() => {
    if (!projectsSnapshot) return null;

    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<{
      id: string;
      status?: string;
      progress?: number;
      qualityScore?: number;
      estimatedBudget?: number;
      startDate?: any;
      endDate?: any;
      estimatedEndDate?: any;
      createdAt?: any;
      projectType?: string;
      actualCost?: number;
      workPackages?: any[];
      issues?: any[];
    }>;

    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'in-progress' || p.status === 'approved').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const cancelledProjects = projects.filter(p => p.status === 'cancelled').length;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      cancelledProjects,
    };
  }, [projectsSnapshot]);

  // 計算進度統計
  const calculateProgressStats = useCallback(() => {
    if (!projectsSnapshot) return null;

    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<{
      id: string;
      status?: string;
      progress?: number;
      qualityScore?: number;
      estimatedBudget?: number;
      startDate?: any;
      endDate?: any;
      estimatedEndDate?: any;
      createdAt?: any;
      projectType?: string;
      actualCost?: number;
      workPackages?: any[];
      issues?: any[];
    }>;

    const totalProgress = projects.reduce((sum, p) => sum + (p.progress || 0), 0);
    const averageProgress = projects.length > 0 ? Math.round(totalProgress / projects.length) : 0;

    // 計算準時/延遲專案
    const now = new Date();
    const onTimeProjects = projects.filter(p => {
      if (p.status === 'completed') {
        const endDate = p.endDate?.toDate?.() || p.estimatedEndDate?.toDate?.() || new Date();
        return endDate <= now;
      }
      return (p.progress || 0) >= 50; // 進行中的專案，進度超過50%視為準時
    }).length;

    const delayedProjects = projects.length - onTimeProjects;

    return {
      averageProgress,
      onTimeProjects,
      delayedProjects,
    };
  }, [projectsSnapshot]);

  // 計算品質統計
  const calculateQualityStats = useCallback(() => {
    if (!projectsSnapshot) return null;

    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<{
      id: string;
      status?: string;
      progress?: number;
      qualityScore?: number;
      estimatedBudget?: number;
      startDate?: any;
      endDate?: any;
      estimatedEndDate?: any;
      createdAt?: any;
      projectType?: string;
      actualCost?: number;
      workPackages?: any[];
      issues?: any[];
    }>;

    const totalQualityScore = projects.reduce((sum, p) => sum + (p.qualityScore || 0), 0);
    const averageQualityScore = projects.length > 0 ? Math.round(totalQualityScore / projects.length) : 0;

    const highQualityProjects = projects.filter(p => (p.qualityScore || 0) >= 80).length;
    const lowQualityProjects = projects.filter(p => (p.qualityScore || 0) < 50).length;

    return {
      averageQualityScore,
      highQualityProjects,
      lowQualityProjects,
    };
  }, [projectsSnapshot]);

  // 計算成本統計
  const calculateCostStats = useCallback(() => {
    if (!projectsSnapshot) return null;

    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<{
      id: string;
      status?: string;
      progress?: number;
      qualityScore?: number;
      estimatedBudget?: number;
      startDate?: any;
      endDate?: any;
      estimatedEndDate?: any;
      createdAt?: any;
      projectType?: string;
      actualCost?: number;
      workPackages?: any[];
      issues?: any[];
    }>;

    const totalBudget = projects.reduce((sum, p) => sum + (p.estimatedBudget || 0), 0);
    const averageBudget = projects.length > 0 ? Math.round(totalBudget / projects.length) : 0;

    // 計算預算利用率（這裡簡化計算）
    const budgetUtilization = 85; // 假設平均利用率85%

    return {
      totalBudget,
      averageBudget,
      budgetUtilization,
    };
  }, [projectsSnapshot]);

  // 計算時間統計
  const calculateTimeStats = useCallback(() => {
    if (!projectsSnapshot || !workPackagesSnapshot || !issuesSnapshot) return null;

    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<{
      id: string;
      status?: string;
      progress?: number;
      qualityScore?: number;
      estimatedBudget?: number;
      startDate?: any;
      endDate?: any;
      estimatedEndDate?: any;
      createdAt?: any;
      projectType?: string;
      actualCost?: number;
      workPackages?: any[];
      issues?: any[];
    }>;

    const workPackages = workPackagesSnapshot.docs;
    const issues = issuesSnapshot.docs;

    // 計算平均專案時長
    const totalDuration = projects.reduce((sum, p) => {
      const startDate = p.startDate?.toDate?.() || new Date();
      const endDate = p.endDate?.toDate?.() || p.estimatedEndDate?.toDate?.() || new Date();
      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      return sum + duration;
    }, 0);

    const averageDuration = projects.length > 0 ? Math.round(totalDuration / projects.length) : 0;

    return {
      averageDuration,
      totalWorkPackages: workPackages.length,
      totalIssues: issues.length,
    };
  }, [projectsSnapshot, workPackagesSnapshot, issuesSnapshot]);

  // 計算月度趨勢
  const calculateMonthlyTrends = useCallback(() => {
    if (!projectsSnapshot) return [];

    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<{
      id: string;
      status?: string;
      progress?: number;
      qualityScore?: number;
      estimatedBudget?: number;
      startDate?: any;
      endDate?: any;
      estimatedEndDate?: any;
      createdAt?: any;
      projectType?: string;
      actualCost?: number;
      workPackages?: any[];
      issues?: any[];
    }>;

    const trends: MonthlyTrend[] = [];
    const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];

    months.forEach((month, index) => {
      const monthProjects = projects.filter(p => {
        const createdAt = p.createdAt?.toDate?.() || new Date();
        return createdAt.getMonth() === index;
      });

      const totalProgress = monthProjects.reduce((sum, p) => sum + (p.progress || 0), 0);
      const averageProgress = monthProjects.length > 0 ? Math.round(totalProgress / monthProjects.length) : 0;

      const totalQuality = monthProjects.reduce((sum, p) => sum + (p.qualityScore || 0), 0);
      const averageQuality = monthProjects.length > 0 ? Math.round(totalQuality / monthProjects.length) : 0;

      trends.push({
        month,
        projects: monthProjects.length,
        progress: averageProgress,
        quality: averageQuality,
      });
    });

    return trends;
  }, [projectsSnapshot]);

  // 計算狀態分佈
  const calculateStatusDistribution = useCallback(() => {
    if (!projectsSnapshot) return [];

    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<{
      id: string;
      status?: string;
      progress?: number;
      qualityScore?: number;
      estimatedBudget?: number;
      startDate?: any;
      endDate?: any;
      estimatedEndDate?: any;
      createdAt?: any;
      projectType?: string;
      actualCost?: number;
      workPackages?: any[];
      issues?: any[];
    }>;

    const statusCounts: Record<string, number> = {};
    projects.forEach(p => {
      const status = p.status || 'unknown';
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const total = projects.length;
    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }, [projectsSnapshot]);

  // 計算類型分佈
  const calculateTypeDistribution = useCallback(() => {
    if (!projectsSnapshot) return [];

    const projects = projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Array<{
      id: string;
      status?: string;
      progress?: number;
      qualityScore?: number;
      estimatedBudget?: number;
      startDate?: any;
      endDate?: any;
      estimatedEndDate?: any;
      createdAt?: any;
      projectType?: string;
      actualCost?: number;
      workPackages?: any[];
      issues?: any[];
    }>;

    const typeCounts: Record<string, number> = {};
    projects.forEach(p => {
      const type = p.projectType || 'unknown';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    const total = projects.length;
    return Object.entries(typeCounts).map(([type, count]) => ({
      type,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
  }, [projectsSnapshot]);

  // 計算績效指標
  const calculatePerformanceMetrics = useCallback((project: {
    progress?: number;
    estimatedBudget?: number;
    qualityScore?: number;
    actualCost?: number;
  }): PerformanceMetrics => {
    // 時程績效指數 (SPI)
    const plannedProgress = 75; // 假設計劃進度
    const actualProgress = project.progress || 0;
    const schedulePerformanceIndex = plannedProgress > 0 ? actualProgress / plannedProgress : 1;

    // 成本績效指數 (CPI)
    const plannedCost = project.estimatedBudget || 1000000;
    const actualCost = project.actualCost || plannedCost * 0.9; // 假設實際成本
    const costPerformanceIndex = plannedCost > 0 ? plannedCost / actualCost : 1;

    // 品質績效指數 (QPI)
    const qualityScore = project.qualityScore || 0;
    const qualityPerformanceIndex = qualityScore / 100;

    // 整體績效
    const overallPerformance = Math.round(
      (schedulePerformanceIndex + costPerformanceIndex + qualityPerformanceIndex) / 3 * 100
    );

    return {
      schedulePerformanceIndex: Math.round(schedulePerformanceIndex * 100),
      costPerformanceIndex: Math.round(costPerformanceIndex * 100),
      qualityPerformanceIndex: Math.round(qualityPerformanceIndex * 100),
      overallPerformance,
    };
  }, []);

  // 取得專案詳細分析
  const getProjectAnalysis = useCallback((): ProjectAnalysis[] => {
    if (!projectsSnapshot) return [];

    return projectsSnapshot.docs.map(doc => {
      const data = doc.data() as {
        projectName?: string;
        status?: string;
        progress?: number;
        qualityScore?: number;
        estimatedBudget?: number;
        startDate?: any;
        endDate?: any;
        estimatedEndDate?: any;
        workPackages?: any[];
        issues?: any[];
      };
      
      return {
        projectId: doc.id,
        projectName: data.projectName || '未命名專案',
        status: data.status || 'unknown',
        progress: data.progress || 0,
        qualityScore: data.qualityScore || 0,
        budget: data.estimatedBudget || 0,
        startDate: data.startDate?.toDate?.() || new Date(),
        endDate: data.endDate?.toDate?.() || data.estimatedEndDate?.toDate?.() || new Date(),
        workPackages: data.workPackages?.length || 0,
        issues: data.issues?.length || 0,
        performanceMetrics: calculatePerformanceMetrics(data),
      };
    });
  }, [projectsSnapshot, calculatePerformanceMetrics]);

  // 合併所有分析數據
  const analyticsData = useMemo((): AnalyticsData | null => {
    const basicStats = calculateBasicStats();
    const progressStats = calculateProgressStats();
    const qualityStats = calculateQualityStats();
    const costStats = calculateCostStats();
    const timeStats = calculateTimeStats();

    if (!basicStats || !progressStats || !qualityStats || !costStats || !timeStats) {
      return null;
    }

    return {
      ...basicStats,
      ...progressStats,
      ...qualityStats,
      ...costStats,
      ...timeStats,
      monthlyTrends: calculateMonthlyTrends(),
      statusDistribution: calculateStatusDistribution(),
      typeDistribution: calculateTypeDistribution(),
    };
  }, [
    calculateBasicStats,
    calculateProgressStats,
    calculateQualityStats,
    calculateCostStats,
    calculateTimeStats,
    calculateMonthlyTrends,
    calculateStatusDistribution,
    calculateTypeDistribution,
  ]);

  return {
    // 狀態
    loading: loading || projectsLoading || workPackagesLoading || issuesLoading,
    error: error || projectsError?.message || workPackagesError?.message || issuesError?.message,
    
    // 數據
    analyticsData,
    projectAnalysis: getProjectAnalysis(),
    
    // 設定
    selectedTimeRange,
    setSelectedTimeRange,
    
    // 操作
    clearError,
  };
}
