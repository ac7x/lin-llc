/**
 * 專案管理工具函數
 * 
 * 提供專業化的專案管理功能，包含：
 * - 進度計算與分析
 * - 風險評估與管理
 * - 品質指標計算
 * - 財務績效分析
 * - 專案健康度評估
 */

import type { 
  Project, 
  Workpackage, 
  ProjectRisk, 
  ProjectMilestone,
  ProjectRiskLevel,
  ProjectPriority,
  ProjectHealthLevel
} from '../types/project';
import { convertToDate } from './dateUtils';

// ===== 進度計算與分析 =====

/**
 * 計算專案進度百分比（根據所有 subWorkpackages 的實際完成數量計算）
 */
function calculateProjectProgress(project: Project): number {
  if (!project.workpackages || project.workpackages.length === 0) return 0;
  
  let totalEstimated = 0;
  let totalActual = 0;

  for (const wp of project.workpackages) {
    if (!wp.subWorkpackages || wp.subWorkpackages.length === 0) continue;
    for (const sub of wp.subWorkpackages) {
      const estimated = typeof sub.estimatedQuantity === 'number' ? sub.estimatedQuantity : 0;
      if (estimated > 0) {
        const actual = typeof sub.actualQuantity === 'number' ? sub.actualQuantity : 0;
        totalEstimated += estimated;
        totalActual += actual;
      }
    }
  }

  if (totalEstimated === 0) return 0;
  return Math.round((totalActual / totalEstimated) * 100);
}

/**
 * 計算時程績效指數 (SPI)
 * 基於計劃進度與實際進度的比較
 */
export function calculateSchedulePerformanceIndex(project: Project): number {
  const plannedProgress = project.progress || 0;
  const actualProgress = calculateProjectProgress(project);
  
  if (plannedProgress === 0) return 1;
  return actualProgress / plannedProgress;
}

/**
 * 計算成本績效指數 (CPI)
 * 基於預算與實際成本的比較
 */
export function calculateCostPerformanceIndex(project: Project): number {
  const plannedCost = project.estimatedBudget || 0;
  const actualCost = project.actualBudget || 0;
  
  if (plannedCost === 0) return 1;
  return plannedCost / actualCost;
}

// ===== 風險評估與管理 =====

/**
 * 計算專案整體風險等級
 * 基於所有風險項目的綜合評估
 */
export function calculateProjectRiskLevel(risks: ProjectRisk[]): ProjectRiskLevel {
  if (!risks || risks.length === 0) return 'low';

  let totalRiskScore = 0;
  let activeRisks = 0;

  for (const risk of risks) {
    if (risk.status === 'closed') continue;
    
    const probabilityWeight = getProbabilityWeight(risk.probability);
    const impactWeight = getImpactWeight(risk.impact);
    const riskScore = probabilityWeight * impactWeight;
    
    totalRiskScore += riskScore;
    activeRisks++;
  }

  if (activeRisks === 0) return 'low';

  const averageRiskScore = totalRiskScore / activeRisks;
  
  if (averageRiskScore >= 15) return 'critical';
  if (averageRiskScore >= 10) return 'high';
  if (averageRiskScore >= 5) return 'medium';
  return 'low';
}

/**
 * 取得高風險項目
 */
export function getHighRiskItems(risks: ProjectRisk[]): ProjectRisk[] {
  return risks.filter(risk => 
    risk.status !== 'closed' && 
    (risk.riskLevel === 'high' || risk.riskLevel === 'critical')
  );
}

/**
 * 取得概率權重
 */
function getProbabilityWeight(probability: string): number {
  switch (probability) {
    case 'high': return 5;
    case 'medium': return 3;
    case 'low': return 1;
    default: return 1;
  }
}

/**
 * 取得影響權重
 */
function getImpactWeight(impact: string): number {
  switch (impact) {
    case 'high': return 5;
    case 'medium': return 3;
    case 'low': return 1;
    default: return 1;
  }
}

// ===== 品質指標計算 =====

/**
 * 計算專案整體品質評分
 * 基於工作包的品質指標
 */
export function calculateProjectQualityScore(project: Project): number {
  if (!project.workpackages || project.workpackages.length === 0) return 0;

  let totalScore = 0;
  let validWorkpackages = 0;

  for (const wp of project.workpackages) {
    if (wp.qualityMetrics) {
      const wpScore = calculateWorkpackageQualityScore(wp);
      if (wpScore > 0) {
        totalScore += wpScore;
        validWorkpackages++;
      }
    }
  }

  if (validWorkpackages === 0) return 0;
  return Math.round(totalScore / validWorkpackages);
}

/**
 * 計算工作包品質評分
 */
export function calculateWorkpackageQualityScore(wp: Workpackage): number {
  if (!wp.qualityMetrics) return 0;

  const { inspectionPassRate, defectRate, reworkPercentage } = wp.qualityMetrics;
  
  // 品質評分計算公式
  let score = 10; // 基礎分數
  
  // 檢驗通過率影響 (權重 40%)
  if (inspectionPassRate < 90) score -= (90 - inspectionPassRate) * 0.4;
  
  // 缺陷率影響 (權重 35%)
  if (defectRate > 5) score -= (defectRate - 5) * 0.35;
  
  // 重工百分比影響 (權重 25%)
  if (reworkPercentage > 10) score -= (reworkPercentage - 10) * 0.25;
  
  return Math.max(0, Math.min(10, Math.round(score)));
}

// ===== 里程碑管理 =====

/**
 * 取得即將到來的里程碑
 */
export function getUpcomingMilestones(milestones: ProjectMilestone[]): ProjectMilestone[] {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  
  return milestones.filter(milestone => {
    if (milestone.status === 'completed') return false;
    
    const targetDate = convertToDate(milestone.targetDate);
    if (!targetDate) return false;
    
    return targetDate >= now && targetDate <= thirtyDaysFromNow;
  }).sort((a, b) => {
    const dateA = convertToDate(a.targetDate);
    const dateB = convertToDate(b.targetDate);
    if (!dateA || !dateB) return 0;
    return dateA.getTime() - dateB.getTime();
  });
}

/**
 * 取得逾期里程碑
 */
export function getOverdueMilestones(milestones: ProjectMilestone[]): ProjectMilestone[] {
  const now = new Date();
  
  return milestones.filter(milestone => {
    if (milestone.status === 'completed') return false;
    
    const targetDate = convertToDate(milestone.targetDate);
    if (!targetDate) return false;
    
    return targetDate < now;
  }).sort((a, b) => {
    const dateA = convertToDate(a.targetDate);
    const dateB = convertToDate(b.targetDate);
    if (!dateA || !dateB) return 0;
    return dateA.getTime() - dateB.getTime();
  });
}

// ===== 專案健康度評估 =====

/**
 * 計算專案健康度評分 (0-100)
 * 綜合考慮進度、品質、風險、財務等因素
 */
export function calculateProjectHealthScore(project: Project): number {
  let totalScore = 0;
  let maxScore = 0;

  // 進度健康度 (權重 30%)
  const progressScore = Math.min(100, (project.progress || 0) * 1.2);
  totalScore += progressScore * 0.3;
  maxScore += 100 * 0.3;

  // 品質健康度 (權重 25%)
  const qualityScore = (project.qualityMetrics?.overallQualityScore || 0) * 10;
  totalScore += qualityScore * 0.25;
  maxScore += 100 * 0.25;

  // 風險健康度 (權重 20%)
  const riskScore = calculateRiskHealthScore(project.risks || []);
  totalScore += riskScore * 0.2;
  maxScore += 100 * 0.2;

  // 財務健康度 (權重 15%)
  const financialScore = calculateFinancialHealthScore(project);
  totalScore += financialScore * 0.15;
  maxScore += 100 * 0.15;

  // 時程健康度 (權重 10%)
  const scheduleScore = calculateScheduleHealthScore(project);
  totalScore += scheduleScore * 0.1;
  maxScore += 100 * 0.1;

  return Math.round((totalScore / maxScore) * 100);
}

/**
 * 計算風險健康度評分
 */
function calculateRiskHealthScore(risks: ProjectRisk[]): number {
  if (risks.length === 0) return 100;

  const highRiskCount = risks.filter(r => 
    r.status !== 'closed' && (r.riskLevel === 'high' || r.riskLevel === 'critical')
  ).length;

  const totalActiveRisks = risks.filter(r => r.status !== 'closed').length;
  
  if (totalActiveRisks === 0) return 100;
  
  const riskRatio = highRiskCount / totalActiveRisks;
  return Math.max(0, 100 - (riskRatio * 100));
}

/**
 * 計算財務健康度評分
 */
function calculateFinancialHealthScore(project: Project): number {
  const cpi = calculateCostPerformanceIndex(project);
  
  if (cpi >= 1.0) return 100;
  if (cpi >= 0.9) return 80;
  if (cpi >= 0.8) return 60;
  if (cpi >= 0.7) return 40;
  return 20;
}

/**
 * 計算時程健康度評分
 */
function calculateScheduleHealthScore(project: Project): number {
  const spi = calculateSchedulePerformanceIndex(project);
  
  if (spi >= 1.0) return 100;
  if (spi >= 0.9) return 80;
  if (spi >= 0.8) return 60;
  if (spi >= 0.7) return 40;
  return 20;
}

// ===== 專案狀態分析 =====

/**
 * 分析專案狀態趨勢
 */
export function analyzeProjectStatusTrend(project: Project): {
  trend: 'improving' | 'stable' | 'declining';
  indicators: string[];
} {
  const indicators: string[] = [];
  let positiveCount = 0;
  let negativeCount = 0;

  // 進度分析
  const progress = project.progress || 0;
  if (progress >= 80) {
    indicators.push('進度良好');
    positiveCount++;
  } else if (progress < 50) {
    indicators.push('進度落後');
    negativeCount++;
  }

  // 品質分析
  const qualityScore = project.qualityMetrics?.overallQualityScore || 0;
  if (qualityScore >= 8) {
    indicators.push('品質優良');
    positiveCount++;
  } else if (qualityScore < 6) {
    indicators.push('品質需改善');
    negativeCount++;
  }

  // 風險分析
  const highRisks = getHighRiskItems(project.risks || []);
  if (highRisks.length === 0) {
    indicators.push('風險可控');
    positiveCount++;
  } else {
    indicators.push(`存在 ${highRisks.length} 個高風險項目`);
    negativeCount++;
  }

  // 財務分析
  const cpi = calculateCostPerformanceIndex(project);
  if (cpi >= 1.0) {
    indicators.push('成本控制良好');
    positiveCount++;
  } else if (cpi < 0.9) {
    indicators.push('成本超支');
    negativeCount++;
  }

  // 判斷趨勢
  let trend: 'improving' | 'stable' | 'declining';
  if (positiveCount > negativeCount) {
    trend = 'improving';
  } else if (positiveCount < negativeCount) {
    trend = 'declining';
  } else {
    trend = 'stable';
  }

  return { trend, indicators };
}

// ===== 專案優先級計算 =====

/**
 * 計算專案優先級分數
 * 用於自動化優先級排序
 */
export function calculateProjectPriorityScore(project: Project): number {
  let score = 0;

  // 基礎優先級分數
  const priorityScores: Record<ProjectPriority, number> = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };
  score += priorityScores[project.priority || 'medium'] * 10;

  // 風險等級影響
  const riskScores: Record<ProjectRiskLevel, number> = {
    low: 0,
    medium: 5,
    high: 10,
    critical: 15,
  };
  score += riskScores[project.riskLevel || 'low'];

  // 進度影響 (進度低的專案優先級更高)
  const progress = project.progress || 0;
  if (progress < 30) score += 10;
  else if (progress < 60) score += 5;

  // 健康度影響
  const healthScore = calculateProjectHealthScore(project);
  if (healthScore < 50) score += 8;
  else if (healthScore < 70) score += 4;

  return score;
} 