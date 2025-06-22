/**
 * 專案分析服務
 * 
 * 提供專案分析相關的後端服務：
 * - 專案統計分析
 * - 進度趨勢分析
 * - 績效指標計算
 * - 數據匯出
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';

import { db } from '@/lib/firebase-client';
import type { 
  AnalyticsData, 
  MonthlyTrend, 
  StatusDistribution, 
  TypeDistribution,
  PerformanceMetrics,
  ProjectAnalysis 
} from '../hooks/useProjectAnalytics';

export class AnalyticsService {
  /**
   * 取得專案分析數據
   */
  static async getAnalyticsData(): Promise<AnalyticsData> {
    try {
      const [projectsSnapshot, workPackagesSnapshot, issuesSnapshot] = await Promise.all([
        getDocs(collection(db, 'projects')),
        getDocs(collection(db, 'workPackages')),
        getDocs(collection(db, 'issues')),
      ]);

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

      // 基本統計
      const totalProjects = projects.length;
      const activeProjects = projects.filter(p => p.status === 'in-progress' || p.status === 'approved').length;
      const completedProjects = projects.filter(p => p.status === 'completed').length;
      const cancelledProjects = projects.filter(p => p.status === 'cancelled').length;

      // 進度統計
      const totalProgress = projects.reduce((sum, p) => sum + (p.progress || 0), 0);
      const averageProgress = projects.length > 0 ? Math.round(totalProgress / projects.length) : 0;

      const now = new Date();
      const onTimeProjects = projects.filter(p => {
        if (p.status === 'completed') {
          const endDate = p.endDate?.toDate?.() || p.estimatedEndDate?.toDate?.() || new Date();
          return endDate <= now;
        }
        return (p.progress || 0) >= 50;
      }).length;
      const delayedProjects = projects.length - onTimeProjects;

      // 品質統計
      const totalQualityScore = projects.reduce((sum, p) => sum + (p.qualityScore || 0), 0);
      const averageQualityScore = projects.length > 0 ? Math.round(totalQualityScore / projects.length) : 0;
      const highQualityProjects = projects.filter(p => (p.qualityScore || 0) >= 80).length;
      const lowQualityProjects = projects.filter(p => (p.qualityScore || 0) < 50).length;

      // 成本統計
      const totalBudget = projects.reduce((sum, p) => sum + (p.estimatedBudget || 0), 0);
      const averageBudget = projects.length > 0 ? Math.round(totalBudget / projects.length) : 0;
      const budgetUtilization = 85; // 假設平均利用率85%

      // 時間統計
      const totalDuration = projects.reduce((sum, p) => {
        const startDate = p.startDate?.toDate?.() || new Date();
        const endDate = p.endDate?.toDate?.() || p.estimatedEndDate?.toDate?.() || new Date();
        const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + duration;
      }, 0);
      const averageDuration = projects.length > 0 ? Math.round(totalDuration / projects.length) : 0;

      // 月度趨勢
      const monthlyTrends = this.calculateMonthlyTrends(projects);

      // 狀態分佈
      const statusDistribution = this.calculateStatusDistribution(projects);

      // 類型分佈
      const typeDistribution = this.calculateTypeDistribution(projects);

      return {
        totalProjects,
        activeProjects,
        completedProjects,
        cancelledProjects,
        averageProgress,
        onTimeProjects,
        delayedProjects,
        averageQualityScore,
        highQualityProjects,
        lowQualityProjects,
        totalBudget,
        averageBudget,
        budgetUtilization,
        averageDuration,
        totalWorkPackages: workPackages.length,
        totalIssues: issues.length,
        monthlyTrends,
        statusDistribution,
        typeDistribution,
      };
    } catch (error) {
      console.error('取得分析數據失敗:', error);
      throw new Error('取得分析數據失敗');
    }
  }

  /**
   * 取得專案詳細分析
   */
  static async getProjectAnalysis(): Promise<ProjectAnalysis[]> {
    try {
      const projectsSnapshot = await getDocs(collection(db, 'projects'));
      
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

        const performanceMetrics = this.calculatePerformanceMetrics(data);

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
          performanceMetrics,
        };
      });
    } catch (error) {
      console.error('取得專案分析失敗:', error);
      throw new Error('取得專案分析失敗');
    }
  }

  /**
   * 取得單一專案分析
   */
  static async getProjectAnalysisById(projectId: string): Promise<ProjectAnalysis | null> {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectSnapshot = await getDoc(projectRef);
      
      if (!projectSnapshot.exists()) {
        return null;
      }

      const data = projectSnapshot.data() as {
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

      const performanceMetrics = this.calculatePerformanceMetrics(data);

      return {
        projectId: projectSnapshot.id,
        projectName: data.projectName || '未命名專案',
        status: data.status || 'unknown',
        progress: data.progress || 0,
        qualityScore: data.qualityScore || 0,
        budget: data.estimatedBudget || 0,
        startDate: data.startDate?.toDate?.() || new Date(),
        endDate: data.endDate?.toDate?.() || data.estimatedEndDate?.toDate?.() || new Date(),
        workPackages: data.workPackages?.length || 0,
        issues: data.issues?.length || 0,
        performanceMetrics,
      };
    } catch (error) {
      console.error('取得專案分析失敗:', error);
      throw new Error('取得專案分析失敗');
    }
  }

  /**
   * 取得時間範圍內的分析數據
   */
  static async getAnalyticsDataByTimeRange(
    startDate: Date, 
    endDate: Date
  ): Promise<AnalyticsData> {
    try {
      const q = query(
        collection(db, 'projects'),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate))
      );
      
      const projectsSnapshot = await getDocs(q);
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

      // 使用相同的計算邏輯，但只針對時間範圍內的專案
      const totalProjects = projects.length;
      const activeProjects = projects.filter(p => p.status === 'in-progress' || p.status === 'approved').length;
      const completedProjects = projects.filter(p => p.status === 'completed').length;
      const cancelledProjects = projects.filter(p => p.status === 'cancelled').length;

      const totalProgress = projects.reduce((sum, p) => sum + (p.progress || 0), 0);
      const averageProgress = projects.length > 0 ? Math.round(totalProgress / projects.length) : 0;

      const now = new Date();
      const onTimeProjects = projects.filter(p => {
        if (p.status === 'completed') {
          const endDate = p.endDate?.toDate?.() || p.estimatedEndDate?.toDate?.() || new Date();
          return endDate <= now;
        }
        return (p.progress || 0) >= 50;
      }).length;
      const delayedProjects = projects.length - onTimeProjects;

      const totalQualityScore = projects.reduce((sum, p) => sum + (p.qualityScore || 0), 0);
      const averageQualityScore = projects.length > 0 ? Math.round(totalQualityScore / projects.length) : 0;
      const highQualityProjects = projects.filter(p => (p.qualityScore || 0) >= 80).length;
      const lowQualityProjects = projects.filter(p => (p.qualityScore || 0) < 50).length;

      const totalBudget = projects.reduce((sum, p) => sum + (p.estimatedBudget || 0), 0);
      const averageBudget = projects.length > 0 ? Math.round(totalBudget / projects.length) : 0;
      const budgetUtilization = 85;

      const totalDuration = projects.reduce((sum, p) => {
        const startDate = p.startDate?.toDate?.() || new Date();
        const endDate = p.endDate?.toDate?.() || p.estimatedEndDate?.toDate?.() || new Date();
        const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        return sum + duration;
      }, 0);
      const averageDuration = projects.length > 0 ? Math.round(totalDuration / projects.length) : 0;

      const monthlyTrends = this.calculateMonthlyTrends(projects);
      const statusDistribution = this.calculateStatusDistribution(projects);
      const typeDistribution = this.calculateTypeDistribution(projects);

      return {
        totalProjects,
        activeProjects,
        completedProjects,
        cancelledProjects,
        averageProgress,
        onTimeProjects,
        delayedProjects,
        averageQualityScore,
        highQualityProjects,
        lowQualityProjects,
        totalBudget,
        averageBudget,
        budgetUtilization,
        averageDuration,
        totalWorkPackages: 0, // 需要額外查詢
        totalIssues: 0, // 需要額外查詢
        monthlyTrends,
        statusDistribution,
        typeDistribution,
      };
    } catch (error) {
      console.error('取得時間範圍分析數據失敗:', error);
      throw new Error('取得時間範圍分析數據失敗');
    }
  }

  /**
   * 計算月度趨勢
   */
  private static calculateMonthlyTrends(projects: any[]): MonthlyTrend[] {
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
  }

  /**
   * 計算狀態分佈
   */
  private static calculateStatusDistribution(projects: any[]): StatusDistribution[] {
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
  }

  /**
   * 計算類型分佈
   */
  private static calculateTypeDistribution(projects: any[]): TypeDistribution[] {
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
  }

  /**
   * 計算績效指標
   */
  private static calculatePerformanceMetrics(project: {
    progress?: number;
    estimatedBudget?: number;
    qualityScore?: number;
    actualCost?: number;
  }): PerformanceMetrics {
    // 時程績效指數 (SPI)
    const plannedProgress = 75;
    const actualProgress = project.progress || 0;
    const schedulePerformanceIndex = plannedProgress > 0 ? actualProgress / plannedProgress : 1;

    // 成本績效指數 (CPI)
    const plannedCost = project.estimatedBudget || 1000000;
    const actualCost = project.actualCost || plannedCost * 0.9;
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
  }
}
