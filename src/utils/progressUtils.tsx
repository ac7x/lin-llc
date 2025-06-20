/**
 * 進度計算與顯示模組
 * 提供專案與工作包進度計算功能與進度顯示元件
 * 功能：
 * - calculateProjectProgress: 根據工作包估算數量計算整體專案進度
 * - calculateWorkpackageProgress: 計算工作包進度
 * - ProjectProgressPercent: 顯示專案進度百分比的 React 元件
 * - ProgressBar: 顯示工作包進度條的 React 元件
 */

import React from "react";
import { Project, Workpackage } from "@/types/project";

/**
 * 計算專案進度百分比（根據所有 subWorkpackages 的實際完成數量計算）
 * 使用 actualQuantity 總和除以 estimatedQuantity 總和
 * 若 estimatedQuantity 為 0 或未填，則不納入計算。
 * 若所有 estimatedQuantity 為 0，則回傳 0。
 */
export function calculateProjectProgress(project: Project): number {
  if (!project.workpackages || project.workpackages.length === 0) return 0;
  let totalEstimated = 0;
  let totalActual = 0;

  for (const wp of project.workpackages) {
    if (!wp.subWorkpackages || wp.subWorkpackages.length === 0) continue;
    for (const sub of wp.subWorkpackages) {
      const estimated = typeof sub.estimatedQuantity === "number" ? sub.estimatedQuantity : 0;
      if (estimated > 0) {
        const actual = typeof sub.actualQuantity === "number" ? sub.actualQuantity : 0;
        totalEstimated += estimated;
        totalActual += actual;
      }
    }
  }
  
  if (totalEstimated === 0) return 0;
  return Math.round((totalActual / totalEstimated) * 100);
}

/**
 * 計算工作包進度百分比（根據所有 subWorkpackages 的實際完成數量計算）
 * 使用 actualQuantity 總和除以 estimatedQuantity 總和
 * 若 estimatedQuantity 為 0 或未填，則不納入計算。
 * 若所有 estimatedQuantity 為 0，則回傳 0。
 */
export function calculateWorkpackageProgress(wp: Workpackage): number {
  if (!wp.subWorkpackages || wp.subWorkpackages.length === 0) return 0;
  let totalEstimated = 0;
  let totalActual = 0;

  for (const sub of wp.subWorkpackages) {
    const estimated = typeof sub.estimatedQuantity === "number" ? sub.estimatedQuantity : 0;
    if (estimated > 0) {
      const actual = typeof sub.actualQuantity === "number" ? sub.actualQuantity : 0;
      totalEstimated += estimated;
      totalActual += actual;
    }
  }
  
  if (totalEstimated === 0) return 0;
  return Math.round((totalActual / totalEstimated) * 100);
}

/**
 * React 組件：顯示專案進度百分比
 */
export const ProjectProgressPercent: React.FC<{ project: Project }> = ({ project }) => {
  const percent = calculateProjectProgress(project);
  return (
    <span
      title="專案進度百分比"
      className="ml-2 text-xs font-semibold text-blue-600 dark:text-blue-300 align-middle"
    >
      {percent}%
    </span>
  );
};

/**
 * React 組件：顯示工作包進度條
 */
export const ProgressBar: React.FC<{ wp: Workpackage }> = ({ wp }) => {
  const percent = calculateWorkpackageProgress(wp);
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div
        className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
        style={{ width: `${percent}%` }}
        title={`進度：${percent}%`}
      />
    </div>
  );
}; 