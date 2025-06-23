import { query, where, orderBy } from 'firebase/firestore';
import { useMemo } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';

import type { 
  ProjectDocument, 
  ProjectStatus, 
  ProjectType, 
  ProjectPriority, 
  ProjectRiskLevel, 
  ProjectHealthLevel, 
  ProjectPhase,
  Project,
  IssueRecord,
  DailyReport
} from '@/app/projects/types/project';
import { useAuth } from '@/hooks/useAuth';
import { collection, db } from '@/lib/firebase-client';
import { formatDate } from '@/utils/dateUtils';

export interface ProjectFilters {
  searchTerm: string;
  status?: ProjectStatus;
  projectType?: ProjectType;
  priority?: ProjectPriority;
  riskLevel?: ProjectRiskLevel;
  healthLevel?: ProjectHealthLevel;
  phase?: ProjectPhase;
  manager?: string;
  region?: string;
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  progressRange?: {
    min: number;
    max: number;
  };
  budgetRange?: {
    min: number;
    max: number;
  };
  qualityRange?: {
    min: number;
    max: number;
  };
}

export type ProjectSortOption = 
  | 'name-asc'
  | 'name-desc'
  | 'createdAt-asc'
  | 'createdAt-desc'
  | 'status-asc'
  | 'status-desc'
  | 'progress-asc'
  | 'progress-desc'
  | 'priority-asc'
  | 'priority-desc'
  | 'riskLevel-asc'
  | 'riskLevel-desc'
  | 'healthLevel-asc'
  | 'healthLevel-desc'
  | 'qualityScore-asc'
  | 'qualityScore-desc'
  | 'budget-asc'
  | 'budget-desc'
  | 'startDate-asc'
  | 'startDate-desc';

export function useFilteredProjects(
  filters: ProjectFilters,
  sortOption: ProjectSortOption = 'createdAt-desc'
) {
  const { user } = useAuth();
  
  // 根據用戶權限決定查詢條件
  const queryConstraints = useMemo(() => {
    const constraints = [];
    
    // 如果用戶不是管理員或擁有者，只顯示屬於自己的專案
    if (user && user.currentRole && !['manager', 'admin', 'owner'].includes(user.currentRole)) {
      constraints.push(where('owner', '==', user.uid));
    }
    
    // 根據排序選項添加排序條件
    switch (sortOption) {
      case 'createdAt-asc':
        constraints.push(orderBy('createdAt', 'asc'));
        break;
      case 'createdAt-desc':
        constraints.push(orderBy('createdAt', 'desc'));
        break;
      case 'name-asc':
        constraints.push(orderBy('projectName', 'asc'));
        break;
      case 'name-desc':
        constraints.push(orderBy('projectName', 'desc'));
        break;
      case 'status-asc':
        constraints.push(orderBy('status', 'asc'));
        break;
      case 'status-desc':
        constraints.push(orderBy('status', 'desc'));
        break;
      case 'progress-asc':
        constraints.push(orderBy('progress', 'asc'));
        break;
      case 'progress-desc':
        constraints.push(orderBy('progress', 'desc'));
        break;
      case 'priority-asc':
        constraints.push(orderBy('priority', 'asc'));
        break;
      case 'priority-desc':
        constraints.push(orderBy('priority', 'desc'));
        break;
      case 'riskLevel-asc':
        constraints.push(orderBy('riskLevel', 'asc'));
        break;
      case 'riskLevel-desc':
        constraints.push(orderBy('riskLevel', 'desc'));
        break;
      case 'healthLevel-asc':
        constraints.push(orderBy('healthLevel', 'asc'));
        break;
      case 'healthLevel-desc':
        constraints.push(orderBy('healthLevel', 'desc'));
        break;
      case 'qualityScore-asc':
        constraints.push(orderBy('qualityScore', 'asc'));
        break;
      case 'qualityScore-desc':
        constraints.push(orderBy('qualityScore', 'desc'));
        break;
      case 'budget-asc':
        constraints.push(orderBy('estimatedBudget', 'asc'));
        break;
      case 'budget-desc':
        constraints.push(orderBy('estimatedBudget', 'desc'));
        break;
      case 'startDate-asc':
        constraints.push(orderBy('startDate', 'asc'));
        break;
      case 'startDate-desc':
        constraints.push(orderBy('startDate', 'desc'));
        break;
      default:
        constraints.push(orderBy('createdAt', 'desc'));
    }
    
    return constraints;
  }, [user, sortOption]);

  const [snapshot, loading, error] = useCollection(
    query(collection(db, 'projects'), ...queryConstraints)
  );

  const projects = useMemo(() => {
    if (!snapshot) return [];

    const mappedProjects = snapshot.docs.map((doc, idx) => {
      const data = doc.data();
      const project = data as Project;
      
      // 使用動態狀態計算
      const dynamicStatus = calculateDynamicProjectStatus(project);
      
      return {
        id: doc.id,
        idx: idx + 1,
        projectName: data.projectName || doc.id,
        contractId: data.contractId,
        createdAt: formatDate(data.createdAt),
        status: dynamicStatus, // 使用動態計算的狀態
        projectType: data.projectType,
        priority: data.priority,
        riskLevel: calculateDynamicRiskLevel(project), // 使用動態計算的風險等級
        healthLevel: data.healthLevel,
        phase: data.phase,
        manager: data.manager,
        region: data.region,
        progress: data.progress || 0,
        startDate: data.startDate,
        estimatedEndDate: data.estimatedEndDate,
        estimatedBudget: data.estimatedBudget,
        actualBudget: data.actualBudget,
        qualityScore: data.qualityScore ?? 10,
        qualityMetrics: data.qualityMetrics,
        safetyMetrics: data.safetyMetrics,
        financialMetrics: data.financialMetrics,
        milestones: data.milestones,
        risks: data.risks,
        changes: data.changes,
        issues: data.issues, // 添加問題追蹤欄位
      } as ProjectDocument;
    });

    let filteredProjects = mappedProjects;

    // 客戶端過濾（對於無法在 Firestore 查詢中處理的條件）
    if (filters.searchTerm.trim()) {
      const lowercasedFilter = filters.searchTerm.trim().toLowerCase();
      filteredProjects = filteredProjects.filter(
        project =>
          project.projectName.toLowerCase().includes(lowercasedFilter) ||
          String(project.contractId).toLowerCase().includes(lowercasedFilter) ||
          project.region?.toLowerCase().includes(lowercasedFilter) ||
          project.manager?.toLowerCase().includes(lowercasedFilter) ||
          project.projectType?.toLowerCase().includes(lowercasedFilter)
      );
    }

    if (filters.status) {
      filteredProjects = filteredProjects.filter(project => project.status === filters.status);
    }

    if (filters.projectType) {
      filteredProjects = filteredProjects.filter(project => project.projectType === filters.projectType);
    }

    if (filters.priority) {
      filteredProjects = filteredProjects.filter(project => project.priority === filters.priority);
    }

    if (filters.riskLevel) {
      filteredProjects = filteredProjects.filter(project => project.riskLevel === filters.riskLevel);
    }

    if (filters.healthLevel) {
      filteredProjects = filteredProjects.filter(project => project.healthLevel === filters.healthLevel);
    }

    if (filters.phase) {
      filteredProjects = filteredProjects.filter(project => project.phase === filters.phase);
    }

    if (filters.manager) {
      filteredProjects = filteredProjects.filter(project => project.manager === filters.manager);
    }

    if (filters.region) {
      filteredProjects = filteredProjects.filter(project => project.region === filters.region);
    }

    if (filters.dateRange) {
      filteredProjects = filteredProjects.filter(project => {
        if (!project.startDate) return false;
        const projectDate = project.startDate && typeof project.startDate === 'object' && 'toDate' in project.startDate
          ? (project.startDate as { toDate: () => Date }).toDate()
          : new Date(project.startDate as string);
        return projectDate >= filters.dateRange!.startDate && projectDate <= filters.dateRange!.endDate;
      });
    }

    if (filters.progressRange) {
      filteredProjects = filteredProjects.filter(project => {
        const progress = project.progress || 0;
        return progress >= filters.progressRange!.min && progress <= filters.progressRange!.max;
      });
    }

    if (filters.budgetRange) {
      filteredProjects = filteredProjects.filter(project => {
        const budget = project.estimatedBudget || 0;
        return budget >= filters.budgetRange!.min && budget <= filters.budgetRange!.max;
      });
    }

    if (filters.qualityRange) {
      filteredProjects = filteredProjects.filter(project => {
        const qualityScore = project.qualityScore ?? 10;
        return qualityScore >= filters.qualityRange!.min && qualityScore <= filters.qualityRange!.max;
      });
    }

    // 如果排序條件已經在 Firestore 查詢中處理，這裡就不需要再排序
    // 但對於複雜的排序邏輯，仍然需要客戶端排序
    if (!['createdAt-asc', 'createdAt-desc', 'name-asc', 'name-desc', 'status-asc', 'status-desc', 'progress-asc', 'progress-desc', 'priority-asc', 'priority-desc', 'riskLevel-asc', 'riskLevel-desc', 'healthLevel-asc', 'healthLevel-desc', 'qualityScore-asc', 'qualityScore-desc', 'budget-asc', 'budget-desc', 'startDate-asc', 'startDate-desc'].includes(sortOption)) {
      filteredProjects.sort((a, b) => {
        switch (sortOption) {
          case 'name-asc':
            return a.projectName.localeCompare(b.projectName);
          case 'name-desc':
            return b.projectName.localeCompare(a.projectName);
          case 'createdAt-asc':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'createdAt-desc':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'status-asc':
            return (a.status || '').localeCompare(b.status || '');
          case 'status-desc':
            return (b.status || '').localeCompare(a.status || '');
          case 'progress-asc':
            return (a.progress || 0) - (b.progress || 0);
          case 'progress-desc':
            return (b.progress || 0) - (a.progress || 0);
          case 'priority-asc':
            return getPriorityWeight(a.priority) - getPriorityWeight(b.priority);
          case 'priority-desc':
            return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
          case 'riskLevel-asc':
            return getRiskLevelWeight(a.riskLevel) - getRiskLevelWeight(b.riskLevel);
          case 'riskLevel-desc':
            return getRiskLevelWeight(b.riskLevel) - getRiskLevelWeight(a.riskLevel);
          case 'healthLevel-asc':
            return getHealthLevelWeight(a.healthLevel) - getHealthLevelWeight(b.healthLevel);
          case 'healthLevel-desc':
            return getHealthLevelWeight(b.healthLevel) - getHealthLevelWeight(a.healthLevel);
          case 'qualityScore-asc':
            return (a.qualityScore ?? 10) - (b.qualityScore ?? 10);
          case 'qualityScore-desc':
            return (b.qualityScore ?? 10) - (a.qualityScore ?? 10);
          case 'budget-asc':
            return (a.estimatedBudget || 0) - (b.estimatedBudget || 0);
          case 'budget-desc':
            return (b.estimatedBudget || 0) - (a.estimatedBudget || 0);
          case 'startDate-asc':
            return (a.startDate?.toDate?.() || new Date(0)).getTime() - (b.startDate?.toDate?.() || new Date(0)).getTime();
          case 'startDate-desc':
            return (b.startDate?.toDate?.() || new Date(0)).getTime() - (a.startDate?.toDate?.() || new Date(0)).getTime();
          default:
            return 0;
        }
      });
    }

    return filteredProjects;
  }, [snapshot, filters, sortOption]);

  return { projects, loading, error };
}

function getPriorityWeight(priority?: ProjectPriority): number {
  switch (priority) {
    case 'critical': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
}

function getRiskLevelWeight(riskLevel?: ProjectRiskLevel): number {
  switch (riskLevel) {
    case 'critical': return 4;
    case 'high': return 3;
    case 'medium': return 2;
    case 'low': return 1;
    default: return 0;
  }
}

function getHealthLevelWeight(healthLevel?: ProjectHealthLevel): number {
  switch (healthLevel) {
    case 'excellent': return 5;
    case 'good': return 4;
    case 'fair': return 3;
    case 'poor': return 2;
    case 'critical': return 1;
    default: return 0;
  }
}

export function useProjectStats() {
  const [snapshot, loading, error] = useCollection(collection(db, 'projects'));

  const stats = useMemo(() => {
    if (!snapshot) return null;

    const projects = snapshot.docs.map(doc => doc.data());
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    
    const totalProjects = projects.length;
    
    // 計算已完成專案：從 projects 的 progress 欄位判斷
    const completedProjects = projects.filter(project => {
      return (project.progress || 0) >= 100;
    }).length;

    // 計算暫停中專案：reports 中最後一筆日誌的 updatedAt 超過 3 天沒有更新
    const onHoldProjects = projects.filter(project => {
      const reports = project.reports || [];
      if (reports.length === 0) return true; // 沒有日誌 = 暫停中
      
      // 找到最新的日誌
      const latestReport = reports.reduce((latest: DailyReport, current: DailyReport) => {
        const latestDate = latest.updatedAt && typeof latest.updatedAt === 'object' && 'toDate' in latest.updatedAt
          ? (latest.updatedAt as { toDate: () => Date }).toDate()
          : new Date(latest.updatedAt as string);
        const currentDate = current.updatedAt && typeof current.updatedAt === 'object' && 'toDate' in current.updatedAt
          ? (current.updatedAt as { toDate: () => Date }).toDate()
          : new Date(current.updatedAt as string);
        return latestDate > currentDate ? latest : current;
      });
      
      const latestReportDate = latestReport.updatedAt && typeof latestReport.updatedAt === 'object' && 'toDate' in latestReport.updatedAt
        ? (latestReport.updatedAt as { toDate: () => Date }).toDate()
        : new Date(latestReport.updatedAt as string);
      
      return latestReportDate < threeDaysAgo;
    }).length;

    // 計算執行中專案：reports 中最後一筆日誌的 updatedAt 在 3 天內有更新
    const activeProjects = projects.filter(project => {
      const reports = project.reports || [];
      if (reports.length === 0) return false; // 沒有日誌 = 不是執行中
      
      // 找到最新的日誌
      const latestReport = reports.reduce((latest: DailyReport, current: DailyReport) => {
        const latestDate = latest.updatedAt && typeof latest.updatedAt === 'object' && 'toDate' in latest.updatedAt
          ? (latest.updatedAt as { toDate: () => Date }).toDate()
          : new Date(latest.updatedAt as string);
        const currentDate = current.updatedAt && typeof current.updatedAt === 'object' && 'toDate' in current.updatedAt
          ? (current.updatedAt as { toDate: () => Date }).toDate()
          : new Date(current.updatedAt as string);
        return latestDate > currentDate ? latest : current;
      });
      
      const latestReportDate = latestReport.updatedAt && typeof latestReport.updatedAt === 'object' && 'toDate' in latestReport.updatedAt
        ? (latestReport.updatedAt as { toDate: () => Date }).toDate()
        : new Date(latestReport.updatedAt as string);
      
      return latestReportDate >= threeDaysAgo;
    }).length;

    // 計算逾期專案：estimatedEndDate 超過今天
    const overdueProjects = projects.filter(project => {
      if (!project.estimatedEndDate) return false;
      const endDate = project.estimatedEndDate && typeof project.estimatedEndDate === 'object' && 'toDate' in project.estimatedEndDate
        ? (project.estimatedEndDate as { toDate: () => Date }).toDate()
        : new Date(project.estimatedEndDate as string);
      return endDate < now;
    }).length;

    // 計算高風險專案：問題追蹤中有 1 個安全問題
    const highRiskProjects = projects.filter(project => {
      if (!project.issues || !Array.isArray(project.issues)) return false;
      const safetyIssues = project.issues.filter(issue => issue.type === 'safety');
      return safetyIssues.length >= 1;
    }).length;

    const planningProjects = projects.filter(p => {
      const project = p as Project;
      const dynamicStatus = calculateDynamicProjectStatus(project);
      return dynamicStatus === 'planning';
    }).length;
    const approvedProjects = projects.filter(p => {
      const project = p as Project;
      const dynamicStatus = calculateDynamicProjectStatus(project);
      return dynamicStatus === 'approved';
    }).length;

    const riskDistribution = {
      low: projects.filter(p => p.riskLevel === 'low').length,
      medium: projects.filter(p => p.riskLevel === 'medium').length,
      high: projects.filter(p => p.riskLevel === 'high').length,
      critical: projects.filter(p => p.riskLevel === 'critical').length,
    };

    const healthDistribution = {
      excellent: projects.filter(p => p.healthLevel === 'excellent').length,
      good: projects.filter(p => p.healthLevel === 'good').length,
      fair: projects.filter(p => p.healthLevel === 'fair').length,
      poor: projects.filter(p => p.healthLevel === 'poor').length,
      critical: projects.filter(p => p.healthLevel === 'critical').length,
    };

    const phaseDistribution = {
      initiation: projects.filter(p => p.phase === 'initiation').length,
      planning: projects.filter(p => p.phase === 'planning').length,
      execution: projects.filter(p => p.phase === 'execution').length,
      monitoring: projects.filter(p => p.phase === 'monitoring').length,
      closure: projects.filter(p => p.phase === 'closure').length,
    };

    // 計算平均品質分數 - 使用新的扣分標準
    const qualityScores = projects.map(project => {
      const baseScore = project.qualityScore ?? 10;
      const issues = project.issues || [];
      const unresolvedIssues = issues.filter((issue: IssueRecord) => issue.status !== 'resolved');
      
      // 根據問題類型計算扣分
      let issueDeduction = 0;
      unresolvedIssues.forEach((issue: IssueRecord) => {
        switch (issue.type) {
          case 'progress':
            issueDeduction += 0.5; // 進度問題扣 0.5 分
            break;
          case 'quality':
            issueDeduction += 1; // 品質問題扣 1 分
            break;
          case 'safety':
            issueDeduction += 2; // 安全問題扣 2 分
            break;
          case 'other':
            issueDeduction += 0.1; // 其他問題扣 0.1 分
            break;
        }
      });
      
      return Math.max(0, Math.min(10, baseScore - issueDeduction));
    });
    
    const averageQualityScore = qualityScores.length > 0 
      ? Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length)
      : 0;

    const totalBudget = projects.reduce((sum, p) => sum + (p.estimatedBudget || 0), 0);
    const totalActualCost = projects.reduce((sum, p) => sum + (p.financialMetrics?.actualCost || 0), 0);
    const budgetVariance = totalBudget - totalActualCost;

    // 計算所有專案的品質/進度問題總數
    const totalQualityIssues = projects.reduce((sum, project) => {
      const issues = project.issues || [];
      const qualityOrProgressIssues = issues.filter((issue: IssueRecord) => issue.type === 'quality' || issue.type === 'progress');
      return sum + qualityOrProgressIssues.length;
    }, 0);

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      onHoldProjects,
      planningProjects,
      approvedProjects,
      riskDistribution,
      healthDistribution,
      phaseDistribution,
      averageQualityScore,
      totalBudget,
      totalActualCost,
      budgetVariance,
      overdueProjects,
      highRiskProjects,
      totalQualityIssues,
    };
  }, [snapshot]);

  return { stats, loading, error };
}

/**
 * 品質分數管理 Hook
 * 處理專案品質分數的計算和調整
 * 工程問題本來就不該發生，直接根據問題追蹤扣分
 */
export function useQualityScore(project: Project | null) {
  return useMemo(() => {
    if (!project) {
      return {
        currentScore: 10,
        baseScore: 10,
        issueDeduction: 0,
        qualityOrProgressIssuesCount: 0
      };
    }
    
    // 基礎品質分數
    const baseScore = project.qualityScore ?? 10;
    
    // 檢查未解決的問題數量
    const issues = project.issues || [];
    const unresolvedIssues = issues.filter((issue: IssueRecord) => issue.status !== 'resolved');
    
    // 根據問題類型計算扣分
    let issueDeduction = 0;
    let qualityOrProgressIssuesCount = 0;
    
    unresolvedIssues.forEach((issue: IssueRecord) => {
      switch (issue.type) {
        case 'progress':
          issueDeduction += 0.5; // 進度問題扣 0.5 分
          qualityOrProgressIssuesCount++;
          break;
        case 'quality':
          issueDeduction += 1; // 品質問題扣 1 分
          qualityOrProgressIssuesCount++;
          break;
        case 'safety':
          issueDeduction += 2; // 安全問題扣 2 分
          break;
        case 'other':
          issueDeduction += 0.1; // 其他問題扣 0.1 分
          break;
      }
    });
    
    // 計算最終分數，確保在 0-10 範圍內
    const currentScore = Math.max(0, Math.min(10, baseScore - issueDeduction));
    
    return {
      currentScore,
      baseScore,
      issueDeduction,
      qualityOrProgressIssuesCount
    };
  }, [project]);
}

/**
 * 更新專案品質分數
 */
export async function updateProjectQualityScore(projectId: string, newScore: number) {
  const { db, doc, updateDoc, Timestamp } = await import('@/lib/firebase-client');
  
  try {
    await updateDoc(doc(db, 'projects', projectId), {
      qualityScore: newScore,
      lastQualityAdjustment: Timestamp.now(),
    });
  } catch (error) {
    console.error('更新品質分數失敗:', error);
    throw error;
  }
}

/**
 * 根據日誌更新時間動態計算專案狀態
 * 使用專案日誌的 updatedAt 來判斷專案是執行中還是暫停中
 */
export function calculateDynamicProjectStatus(project: Project): ProjectStatus {
  // 如果專案已完成，保持 completed 狀態
  if (project.progress && project.progress >= 100) {
    return 'completed';
  }
  
  // 如果專案已取消或封存，保持原有狀態
  if (project.status === 'cancelled' || project.status === 'archived') {
    return project.status;
  }
  
  const reports = project.reports || [];
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  
  // 沒有日誌記錄 = 暫停中
  if (reports.length === 0) {
    return 'on-hold';
  }
  
  // 找到最新的日誌
  const latestReport = reports.reduce((latest: DailyReport, current: DailyReport) => {
    const latestDate = latest.updatedAt && typeof latest.updatedAt === 'object' && 'toDate' in latest.updatedAt
      ? (latest.updatedAt as { toDate: () => Date }).toDate()
      : new Date(latest.updatedAt as string);
    const currentDate = current.updatedAt && typeof current.updatedAt === 'object' && 'toDate' in current.updatedAt
      ? (current.updatedAt as { toDate: () => Date }).toDate()
      : new Date(current.updatedAt as string);
    return latestDate > currentDate ? latest : current;
  });
  
  const latestReportDate = latestReport.updatedAt && typeof latestReport.updatedAt === 'object' && 'toDate' in latestReport.updatedAt
    ? (latestReport.updatedAt as { toDate: () => Date }).toDate()
    : new Date(latestReport.updatedAt as string);
  
  // 最近 3 天內有日誌更新 = 執行中
  if (latestReportDate >= threeDaysAgo) {
    return 'in-progress';
  }
  
  // 超過 3 天沒有日誌更新 = 暫停中
  return 'on-hold';
}

/**
 * 根據品質分數扣分計算動態風險等級
 * 品質分數越低，風險等級越高
 */
function calculateDynamicRiskLevel(project: Project): ProjectRiskLevel {
  const baseScore = project.qualityScore ?? 10;
  const issues = project.issues || [];
  const unresolvedIssues = issues.filter((issue: IssueRecord) => issue.status !== 'resolved');
  
  // 根據問題類型計算扣分
  let issueDeduction = 0;
  unresolvedIssues.forEach((issue: IssueRecord) => {
    switch (issue.type) {
      case 'progress':
        issueDeduction += 0.5; // 進度問題扣 0.5 分
        break;
      case 'quality':
        issueDeduction += 1; // 品質問題扣 1 分
        break;
      case 'safety':
        issueDeduction += 2; // 安全問題扣 2 分
        break;
      case 'other':
        issueDeduction += 0.1; // 其他問題扣 0.1 分
        break;
    }
  });
  
  const currentScore = Math.max(0, Math.min(10, baseScore - issueDeduction));
  
  // 根據當前品質分數決定風險等級
  if (currentScore >= 8) return 'low';
  if (currentScore >= 6) return 'medium';
  if (currentScore >= 4) return 'high';
  return 'critical';
}
