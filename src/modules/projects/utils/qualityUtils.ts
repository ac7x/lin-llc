/**
 * 品質管理工具函數
 * 提供專案品質評分和趨勢分析功能
 */

import type { Project, Workpackage } from '../types/project';

/**
 * 計算品質評分
 */
export function calculateQualityScore(project: Project): number {
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
function calculateWorkpackageQualityScore(wp: Workpackage): number {
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

/**
 * 更新品質評分
 */
export function updateQualityScore(project: Project, newScore: number): Project {
  return {
    ...project,
    qualityScore: newScore,
    lastQualityAdjustment: new Date(),
  };
}

/**
 * 取得品質趨勢
 */
export function getQualityTrend(project: Project): 'improving' | 'stable' | 'declining' {
  const currentScore = project.qualityScore || 0;
  
  if (currentScore >= 8) return 'improving';
  if (currentScore >= 6) return 'stable';
  return 'declining';
} 