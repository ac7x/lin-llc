/**
 * 專案過濾 Hook
 * 提供專案列表過濾、排序和統計功能
 */

import { useMemo } from 'react';
import type { 
  ProjectDocument, 
  ProjectStatus, 
  ProjectType, 
  ProjectPriority, 
  ProjectRiskLevel, 
  ProjectHealthLevel, 
  ProjectPhase,
  ProjectFilters,
  ProjectSortOption,
  ProjectStats
} from '../types/project';
import { convertToDate } from '../utils/dateUtils';
import { calculateProjectQualityScore } from '../utils/projectUtils';

interface UseFilteredProjectsReturn {
  filteredProjects: ProjectDocument[];
  projectStats: ProjectStats;
  qualityScoreInfo: {
    currentScore: number;
    baseScore: number;
    qualityOrProgressIssuesCount: number;
    totalIssuesCount: number;
  };
}

export function useFilteredProjects(
  projects: ProjectDocument[],
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
        const projectDate = convertToDate(project.startDate || null);
        if (!projectDate) return false;
        
        return projectDate >= filters.dateRange!.startDate && projectDate <= filters.dateRange!.endDate;
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
      
      let aValue: any = a[field as keyof ProjectDocument];
      let bValue: any = b[field as keyof ProjectDocument];
      
      // 處理日期排序
      if (field.includes('Date') || field.includes('At')) {
        aValue = convertToDate(aValue || null) || new Date(0);
        bValue = convertToDate(bValue || null) || new Date(0);
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
      const endDate = convertToDate(p.estimatedEndDate || null);
      if (!endDate) return false;
      return endDate < new Date() && p.status !== 'completed';
    }).length;
    
    const totalQualityIssues = projects.reduce((sum, project) => {
      return sum + (project.issues?.length || 0);
    }, 0);

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      onHoldProjects,
      overdueProjects,
      totalQualityIssues,
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
export function useProjectStats(projects: ProjectDocument[]): ProjectStats {
  return useMemo((): ProjectStats => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => 
      ['planning', 'approved', 'in-progress'].includes(p.status)
    ).length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const onHoldProjects = projects.filter(p => p.status === 'on-hold').length;
    const overdueProjects = projects.filter(p => {
      const endDate = convertToDate(p.estimatedEndDate || null);
      if (!endDate) return false;
      return endDate < new Date() && p.status !== 'completed';
    }).length;
    
    const totalQualityIssues = projects.reduce((sum, project) => {
      return sum + (project.issues?.length || 0);
    }, 0);

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      onHoldProjects,
      overdueProjects,
      totalQualityIssues,
    };
  }, [projects]);
}

export function useQualityScore(projects: ProjectDocument[]): {
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