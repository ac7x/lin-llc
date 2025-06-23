/**
 * 風險管理工具函數
 * 提供專案風險評估和分析功能
 */

import type { ProjectRisk, PriorityLevel } from '../types';

/**
 * 計算風險評分
 */
export function calculateRiskScore(risk: ProjectRisk): number {
  const probabilityWeight = getProbabilityWeight(risk.probability);
  const impactWeight = getImpactWeight(risk.impact);
  
  return probabilityWeight * impactWeight;
}

/**
 * 取得風險等級
 */
export function getRiskLevel(risk: ProjectRisk): PriorityLevel {
  const score = calculateRiskScore(risk);
  
  if (score >= 15) return 'critical';
  if (score >= 10) return 'high';
  if (score >= 5) return 'medium';
  return 'low';
}

/**
 * 取得風險趨勢
 */
export function getRiskTrend(risks: ProjectRisk[]): 'improving' | 'stable' | 'declining' {
  const activeRisks = risks.filter(r => r.status !== 'closed');
  const highRisks = activeRisks.filter(r => 
    r.riskLevel === 'high' || r.riskLevel === 'critical'
  );
  
  const riskRatio = activeRisks.length > 0 ? highRisks.length / activeRisks.length : 0;
  
  if (riskRatio <= 0.2) return 'improving';
  if (riskRatio <= 0.5) return 'stable';
  return 'declining';
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