/**
 * 專案過濾 Hook
 * 提供專案列表過濾、排序和統計功能
 */

import { useState, useMemo, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import type { Project, ProjectFilters, ProjectSortOption, ProjectStats } from '@/app/test-projects/types/project';
import { 
  calculateProjectQualityScore,
  calculateSchedulePerformanceIndex,
  calculateCostPerformanceIndex,
  getUpcomingMilestones,
  getOverdueMilestones,
  analyzeProjectStatusTrend,
  calculateProjectPriorityScore
} from '@/app/test-projects/utils/projectUtils';

interface UseFilteredProjectsReturn {
  filteredProjects: Project[];
  projectStats: ProjectStats;
  qualityScoreInfo: {
    currentScore: number;
    baseScore: number;
    qualityOrProgressIssuesCount: number;
    totalIssuesCount: number;
  };
}

export function useFilteredProjects(
  projects: Project[],
  filters: ProjectFilters,
  sortOption: ProjectSortOption = 'createdAt-desc'
): UseFilteredProjectsReturn {
  
  const filteredProjects = useMemo(() => {
    let result = [...projects];

    // 搜尋過濾
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      result = result.filter(project => 
        project.projectName.toLowerCase().includes(searchTerm) ||
        project.contractId?.toLowerCase().includes(searchTerm) ||
        project.area?.toLowerCase().includes(searchTerm) ||
        project.address?.toLowerCase().includes(searchTerm)
      );
    }

    // 狀態過濾
    if (filters.status) {
      result = result.filter(project => project.status === filters.status);
    }

    // 專案類型過濾
    if (filters.projectType) {
      result = result.filter(project => project.projectType === filters.projectType);
    }

    // 優先級過濾
    if (filters.priority) {
      result = result.filter(project => project.priority === filters.priority);
    }

    // 風險等級過濾
    if (filters.riskLevel) {
      result = result.filter(project => project.riskLevel === filters.riskLevel);
    }

    // 健康度過濾
    if (filters.healthLevel) {
      result = result.filter(project => project.healthLevel === filters.healthLevel);
    }

    // 階段過濾
    if (filters.phase) {
      result = result.filter(project => project.phase === filters.phase);
    }

    // 經理過濾
    if (filters.manager) {
      result = result.filter(project => project.manager === filters.manager);
    }

    // 地區過濾
    if (filters.region) {
      result = result.filter(project => project.region === filters.region);
    }

    // 日期範圍過濾
    if (filters.dateRange) {
      result = result.filter(project => {
        const projectDate = project.startDate ? 
          (project.startDate instanceof Date ? project.startDate : 
           typeof project.startDate === 'string' ? new Date(project.startDate) :
           project.startDate?.toDate?.() || new Date()) : null;
        if (!projectDate) return false;
        
        return projectDate >= filters.dateRange!.startDate && 
               projectDate <= filters.dateRange!.endDate;
      });
    }

    // 進度範圍過濾
    if (filters.progressRange) {
      result = result.filter(project => {
        const progress = project.progress || 0;
        return progress >= filters.progressRange!.min && progress <= filters.progressRange!.max;
      });
    }

    // 預算範圍過濾
    if (filters.budgetRange) {
      result = result.filter(project => {
        const budget = project.estimatedBudget || 0;
        return budget >= filters.budgetRange!.min && budget <= filters.budgetRange!.max;
      });
    }

    // 品質範圍過濾
    if (filters.qualityRange) {
      result = result.filter(project => {
        const qualityScore = project.qualityScore || 0;
        return qualityScore >= filters.qualityRange!.min && qualityScore <= filters.qualityRange!.max;
      });
    }

    // 排序
    result.sort((a, b) => {
      const [field, direction] = sortOption.split('-') as [string, 'asc' | 'desc'];
      
      let aValue: any = a[field as keyof Project];
      let bValue: any = b[field as keyof Project];
      
      // 處理日期排序
      if (field.includes('Date') || field.includes('At')) {
        aValue = aValue ? 
          (aValue instanceof Date ? aValue : 
           typeof aValue === 'string' ? new Date(aValue) :
           aValue?.toDate?.() || new Date()) : new Date(0);
        bValue = bValue ? 
          (bValue instanceof Date ? bValue : 
           typeof bValue === 'string' ? new Date(bValue) :
           bValue?.toDate?.() || new Date()) : new Date(0);
      }
      
      // 處理字串排序
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      // 處理數值排序
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        if (direction === 'asc') {
          return aValue - bValue;
        } else {
          return bValue - aValue;
        }
      }
      
      // 處理字串和日期排序
      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return result;
  }, [projects, filters, sortOption]);

  const projectStats = useMemo((): ProjectStats => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => 
      ['planning', 'approved', 'in-progress'].includes(p.status)
    ).length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const onHoldProjects = projects.filter(p => p.status === 'on-hold').length;
    const overdueProjects = projects.filter(p => {
      const endDate = p.estimatedEndDate ? 
        (p.estimatedEndDate instanceof Date ? p.estimatedEndDate : 
         typeof p.estimatedEndDate === 'string' ? new Date(p.estimatedEndDate) :
         p.estimatedEndDate?.toDate?.() || new Date()) : null;
      if (!endDate) return false;
      return endDate < new Date() && p.status !== 'completed';
    }).length;
    
    const totalQualityIssues = projects.reduce((sum, project) => {
      return sum + (project.issues?.length || 0);
    }, 0);

    const averageQualityScore = projects.reduce((sum, project) => sum + (project.qualityScore || 0), 0) / Math.max(1, projects.length);

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      onHoldProjects,
      overdueProjects,
      totalQualityIssues,
      averageQualityScore,
    };
  }, [projects]);

  const qualityScoreInfo = useMemo(() => {
    const currentScore = projects.reduce((sum, project) => {
      return sum + (project.qualityScore || 0);
    }, 0) / Math.max(projects.length, 1);

    const baseScore = 10; // 基礎品質分數
    const qualityOrProgressIssuesCount = projects.reduce((sum, project) => {
      const issues = project.issues || [];
      return sum + issues.filter(issue => 
        issue.type === 'quality' || issue.type === 'progress'
      ).length;
    }, 0);

    const totalIssuesCount = projects.reduce((sum, project) => {
      return sum + (project.issues?.length || 0);
    }, 0);

    return {
      currentScore: Math.round(currentScore * 10) / 10,
      baseScore,
      qualityOrProgressIssuesCount,
      totalIssuesCount,
    };
  }, [projects]);

  return {
    filteredProjects,
    projectStats,
    qualityScoreInfo,
  };
}

// 重新導出統計功能
export function useProjectStats(projects: Project[]): ProjectStats {
  return useMemo((): ProjectStats => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => 
      ['planning', 'approved', 'in-progress'].includes(p.status)
    ).length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const onHoldProjects = projects.filter(p => p.status === 'on-hold').length;
    const overdueProjects = projects.filter(p => {
      const endDate = p.estimatedEndDate ? 
        (p.estimatedEndDate instanceof Date ? p.estimatedEndDate : 
         typeof p.estimatedEndDate === 'string' ? new Date(p.estimatedEndDate) :
         p.estimatedEndDate?.toDate?.() || new Date()) : null;
      if (!endDate) return false;
      return endDate < new Date() && p.status !== 'completed';
    }).length;
    
    const totalQualityIssues = projects.reduce((sum, project) => {
      return sum + (project.issues?.length || 0);
    }, 0);

    const averageQualityScore = projects.reduce((sum, project) => sum + (project.qualityScore || 0), 0) / Math.max(1, projects.length);

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      onHoldProjects,
      overdueProjects,
      totalQualityIssues,
      averageQualityScore,
    };
  }, [projects]);
}

export function useQualityScore(projects: Project[]): {
  currentScore: number;
  baseScore: number;
  qualityOrProgressIssuesCount: number;
  totalIssuesCount: number;
} {
  return useMemo(() => {
    const currentScore = projects.reduce((sum, project) => {
      return sum + (project.qualityScore || 0);
    }, 0) / Math.max(projects.length, 1);

    const baseScore = 10; // 基礎品質分數
    const qualityOrProgressIssuesCount = projects.reduce((sum, project) => {
      const issues = project.issues || [];
      return sum + issues.filter(issue => 
        issue.type === 'quality' || issue.type === 'progress'
      ).length;
    }, 0);

    const totalIssuesCount = projects.reduce((sum, project) => {
      return sum + (project.issues?.length || 0);
    }, 0);

    return {
      currentScore: Math.round(currentScore * 10) / 10,
      baseScore,
      qualityOrProgressIssuesCount,
      totalIssuesCount,
    };
  }, [projects]);
} 

const fetchProjects = async (): Promise<Project[]> => {
  try {
    const projectsRef = collection(db, 'projects');
    const q = query(projectsRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as unknown as Project[];
  } catch (error) {
    console.error('取得專案列表失敗:', error);
    return [];
  }
};

const fetchProjectStats = async (): Promise<ProjectStats> => {
  try {
    const projects = await fetchProjects();
    
    return {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'in-progress').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      onHoldProjects: projects.filter(p => p.status === 'on-hold').length,
      overdueProjects: projects.filter(p => {
        const endDate = p.estimatedEndDate ? 
          (p.estimatedEndDate instanceof Date ? p.estimatedEndDate : 
           typeof p.estimatedEndDate === 'string' ? new Date(p.estimatedEndDate) :
           p.estimatedEndDate?.toDate?.() || new Date()) : null;
        if (!endDate) return false;
        return endDate < new Date() && p.status !== 'completed';
      }).length,
      totalQualityIssues: projects.reduce((sum, p) => sum + (p.issues?.length || 0), 0),
      averageQualityScore: projects.reduce((sum, p) => sum + (p.qualityScore || 0), 0) / Math.max(1, projects.length),
    };
  } catch (error) {
    console.error('取得專案統計失敗:', error);
    return {
      totalProjects: 0,
      activeProjects: 0,
      completedProjects: 0,
      onHoldProjects: 0,
      overdueProjects: 0,
      totalQualityIssues: 0,
      averageQualityScore: 0,
    };
  }
}; 