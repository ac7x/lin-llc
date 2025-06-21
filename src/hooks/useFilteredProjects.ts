import { useMemo } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';

import { collection, db } from '@/lib/firebase-client';
import type { 
  ProjectDocument, 
  ProjectStatus, 
  ProjectType, 
  ProjectPriority, 
  ProjectRiskLevel, 
  ProjectHealthLevel, 
  ProjectPhase 
} from '@/types/project';
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
  const [snapshot, loading, error] = useCollection(collection(db, 'projects'));

  const projects = useMemo(() => {
    if (!snapshot) return [];

    const mappedProjects = snapshot.docs.map((doc, idx) => {
      const data = doc.data();
      return {
        id: doc.id,
        idx: idx + 1,
        projectName: data.projectName || doc.id,
        contractId: data.contractId,
        createdAt: formatDate(data.createdAt),
        status: data.status,
        projectType: data.projectType,
        priority: data.priority,
        riskLevel: data.riskLevel,
        healthLevel: data.healthLevel,
        phase: data.phase,
        manager: data.manager,
        region: data.region,
        progress: data.progress || 0,
        startDate: data.startDate,
        estimatedEndDate: data.estimatedEndDate,
        estimatedBudget: data.estimatedBudget,
        actualBudget: data.actualBudget,
        qualityMetrics: data.qualityMetrics,
        safetyMetrics: data.safetyMetrics,
        financialMetrics: data.financialMetrics,
        milestones: data.milestones,
        risks: data.risks,
        changes: data.changes,
      } as ProjectDocument;
    });

    let filteredProjects = mappedProjects;

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
        const qualityScore = project.qualityMetrics?.overallQualityScore || 0;
        return qualityScore >= filters.qualityRange!.min && qualityScore <= filters.qualityRange!.max;
      });
    }

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
          return (a.qualityMetrics?.overallQualityScore || 0) - (b.qualityMetrics?.overallQualityScore || 0);
        case 'qualityScore-desc':
          return (b.qualityMetrics?.overallQualityScore || 0) - (a.qualityMetrics?.overallQualityScore || 0);
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
    
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === 'in-progress').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const onHoldProjects = projects.filter(p => p.status === 'on-hold').length;
    const planningProjects = projects.filter(p => p.status === 'planning').length;
    const approvedProjects = projects.filter(p => p.status === 'approved').length;

    const totalProgress = projects.reduce((sum, p) => sum + (p.progress || 0), 0);
    const averageProgress = totalProjects > 0 ? Math.round(totalProgress / totalProjects) : 0;

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

    const qualityScores = projects
      .filter(p => p.qualityMetrics?.overallQualityScore)
      .map(p => p.qualityMetrics.overallQualityScore);
    const averageQualityScore = qualityScores.length > 0 
      ? Math.round(qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length)
      : 0;

    const totalBudget = projects.reduce((sum, p) => sum + (p.estimatedBudget || 0), 0);
    const totalActualCost = projects.reduce((sum, p) => sum + (p.financialMetrics?.actualCost || 0), 0);
    const budgetVariance = totalBudget - totalActualCost;

    const overdueProjects = projects.filter(p => {
      if (!p.estimatedEndDate) return false;
      const endDate = p.estimatedEndDate && typeof p.estimatedEndDate === 'object' && 'toDate' in p.estimatedEndDate
        ? (p.estimatedEndDate as { toDate: () => Date }).toDate()
        : new Date(p.estimatedEndDate as string);
      return endDate < new Date() && p.status !== 'completed';
    }).length;

    const highRiskProjects = projects.filter(p => p.riskLevel === 'high' || p.riskLevel === 'critical').length;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      onHoldProjects,
      planningProjects,
      approvedProjects,
      averageProgress,
      riskDistribution,
      healthDistribution,
      phaseDistribution,
      averageQualityScore,
      totalBudget,
      totalActualCost,
      budgetVariance,
      overdueProjects,
      highRiskProjects,
    };
  }, [snapshot]);

  return { stats, loading, error };
}
