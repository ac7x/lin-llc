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

import { Project, Workpackage } from '@/types/project';
import { calculateProjectProgress as calculateProjectProgressNew, calculateWorkpackageProgress as calculateWorkpackageProgressNew } from '@/utils/projectUtils';

/**
 * 計算專案進度百分比（根據所有 subWorkpackages 的實際完成數量計算）
 * 使用 actualQuantity 總和除以 estimatedQuantity 總和
 * 若 estimatedQuantity 為 0 或未填，則不納入計算。
 * 若所有 estimatedQuantity 為 0，則回傳 0。
 * 
 * @deprecated 請使用 @/utils/projectUtils 中的 calculateProjectProgress
 */
export function calculateProjectProgress(project: Project): number {
  return calculateProjectProgressNew(project);
}

/**
 * 計算工作包進度百分比（根據所有 subWorkpackages 的實際完成數量計算）
 * 使用 actualQuantity 總和除以 estimatedQuantity 總和
 * 若 estimatedQuantity 為 0 或未填，則不納入計算。
 * 若所有 estimatedQuantity 為 0，則回傳 0。
 * 
 * @deprecated 請使用 @/utils/projectUtils 中的 calculateWorkpackageProgress
 */
export function calculateWorkpackageProgress(wp: Workpackage): number {
  return calculateWorkpackageProgressNew(wp);
}

/**
 * React 組件：顯示專案進度百分比
 */
export const ProjectProgressPercent = ({ project }: { project: Project }): ReactElement => {
  const percent = calculateProjectProgress(project);
  const getColorClass = (progress: number) => {
    if (progress >= 80) return 'text-green-600 dark:text-green-400';
    if (progress >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (progress >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <span className={`text-xs font-medium ${getColorClass(percent)}`}>
      {percent}%
    </span>
  );
};

/**
 * React 組件：顯示工作包進度條
 */
export const ProgressBar = ({ wp }: { wp: Workpackage }): ReactElement => {
  const percent = calculateWorkpackageProgress(wp);
  const getColorClass = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 60) return 'bg-yellow-500';
    if (progress >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className='w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2'>
      <div
        className={`${getColorClass(percent)} h-2 rounded-full transition-all duration-300`}
        style={{ width: `${percent}%` }}
        title={`進度：${percent}%`}
      />
    </div>
  );
};

/**
 * React 組件：顯示進度條與百分比
 */
export const ProgressBarWithPercent = ({ 
  progress, 
  showPercent = true,
  size = 'normal' 
}: { 
  progress: number; 
  showPercent?: boolean;
  size?: 'small' | 'normal' | 'large';
}): ReactElement => {
  const getColorClass = (percent: number) => {
    if (percent >= 80) return 'bg-green-500';
    if (percent >= 60) return 'bg-yellow-500';
    if (percent >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getHeightClass = (size: string) => {
    switch (size) {
      case 'small': return 'h-1';
      case 'large': return 'h-3';
      default: return 'h-2';
    }
  };

  const getTextSizeClass = (size: string) => {
    switch (size) {
      case 'small': return 'text-xs';
      case 'large': return 'text-sm';
      default: return 'text-xs';
    }
  };

  return (
    <div className='flex items-center space-x-2'>
      <div className={`flex-1 bg-gray-200 dark:bg-gray-700 rounded-full ${getHeightClass(size)}`}>
        <div
          className={`${getColorClass(progress)} ${getHeightClass(size)} rounded-full transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />
      </div>
      {showPercent && (
        <span className={`${getTextSizeClass(size)} text-gray-600 dark:text-gray-400 min-w-[2rem]`}>
          {progress}%
        </span>
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
  // 這裡可以整合 projectUtils 中的健康度計算
  const progress = project.progress || 0;
  const qualityScore = project.qualityMetrics?.overallQualityScore || 0;
  
  // 簡化的健康度計算
  let healthScore = 0;
  if (progress >= 80 && qualityScore >= 8) healthScore = 100;
  else if (progress >= 60 && qualityScore >= 6) healthScore = 75;
  else if (progress >= 40 && qualityScore >= 4) healthScore = 50;
  else healthScore = 25;

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400';
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400';
    if (score >= 40) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getHealthIcon = (score: number) => {
    if (score >= 80) return '🟢';
    if (score >= 60) return '🟡';
    if (score >= 40) return '🟠';
    return '🔴';
  };

  return (
    <div className={`flex items-center space-x-1 ${getHealthColor(healthScore)}`}>
      <span className='text-sm'>{getHealthIcon(healthScore)}</span>
      <span className='text-xs font-medium'>{healthScore}</span>
    </div>
  );
};
