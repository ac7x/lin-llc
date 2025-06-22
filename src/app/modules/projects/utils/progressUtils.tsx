/**
 * 進度計算與顯示模組
 * 提供專案與工作包進度計算功能與進度顯示元件
 * 功能：
 * - calculateProjectProgress: 根據工作包估算數量計算整體專案進度
 * - calculateWorkpackageProgress: 計算工作包進度
 * - ProjectProgressPercent: 顯示專案進度百分比的 React 元件
 * - ProgressBar: 顯示工作包進度條的 React 元件
 * - 整合專業化專案管理功能
 */

import type { ReactElement } from 'react';

import { projectStyles } from '../styles';
import { calculateProjectProgress, calculateWorkpackageProgress } from '../types';
import type { Project, WorkPackage } from '../types';

/**
 * 取得進度顏色
 */
export function getProgressColor(percent: number, type: 'bg' | 'text' | 'border' = 'bg'): string {
  if (percent >= 80) {
    return type === 'bg' ? 'bg-green-500' : type === 'text' ? 'text-green-600 dark:text-green-400' : 'border-green-500';
  } else if (percent >= 60) {
    return type === 'bg' ? 'bg-blue-500' : type === 'text' ? 'text-blue-600 dark:text-blue-400' : 'border-blue-500';
  } else if (percent >= 40) {
    return type === 'bg' ? 'bg-yellow-500' : type === 'text' ? 'text-yellow-600 dark:text-yellow-400' : 'border-yellow-500';
  } else {
    return type === 'bg' ? 'bg-red-500' : type === 'text' ? 'text-red-600 dark:text-red-400' : 'border-red-500';
  }
}

/**
 * React 組件：顯示專案進度百分比
 */
export const ProjectProgressPercent = ({ project }: { project: Project }): ReactElement => {
  const percent = calculateProjectProgress(project);

  return (
    <span className={`text-xs font-medium ${getProgressColor(percent, 'text')}`}>
      {percent}%
    </span>
  );
};

/**
 * React 組件：顯示進度條
 */
export const ProgressBar = ({ 
  percent, 
  className = '' 
}: { 
  percent: number; 
  className?: string;
}): ReactElement => {
  const clampedPercent = Math.min(100, Math.max(0, percent));
  const progressColor = getProgressColor(percent, 'bg');

  return (
    <div className={`${projectStyles.progress.container} ${className}`}>
      <div 
        className={`${projectStyles.progress.bar} ${progressColor}`}
        style={{ width: `${clampedPercent}%` }}
      />
    </div>
  );
};

/**
 * React 組件：顯示進度條與百分比
 */
export const ProgressBarWithPercent = ({ 
  percent, 
  showPercent = true,
  className = '' 
}: { 
  percent: number; 
  showPercent?: boolean;
  className?: string;
}): ReactElement => {
  return (
    <div className={`space-y-1 ${className}`}>
      <ProgressBar percent={percent} />
      {showPercent && (
        <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>進度</span>
          <span>{percent}%</span>
        </div>
      )}
    </div>
  );
};

/**
 * React 組件：顯示專案健康度指示器
 */
export const ProjectHealthIndicator = ({ 
  project 
}: { 
  project: Project 
}): ReactElement => {
  const progress = project.progress || 0;
  const qualityScore = project.qualityMetrics?.overallQualityScore || 0;
  
  // 簡化的健康度計算
  let healthScore = 0;
  if (progress >= 80 && qualityScore >= 8) healthScore = 100;
  else if (progress >= 60 && qualityScore >= 6) healthScore = 75;
  else if (progress >= 40 && qualityScore >= 4) healthScore = 50;
  else healthScore = 25;

  const getHealthIcon = (score: number) => {
    if (score >= 80) return '🟢';
    if (score >= 60) return '��';
    if (score >= 40) return '🟠';
    return '🔴';
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className={`flex items-center space-x-1 ${getHealthColor(healthScore)}`}>
      <span className="text-sm">{getHealthIcon(healthScore)}</span>
      <span className="text-xs font-medium">{healthScore}</span>
    </div>
  );
}; 