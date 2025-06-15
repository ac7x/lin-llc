/**
 * 專案進度計算與顯示模組
 * 提供專案進度計算功能與進度顯示元件
 * 功能：
 * - calculateProjectProgress: 根據工作包估算數量計算整體專案進度
 * - ProjectProgressPercent: 顯示專案進度百分比的 React 元件
 */

import { Project } from "@/types/project";

/**
 * 計算專案進度百分比（根據所有 subWorkpackages 的 estimatedQuantity 與 progress 欄位加權平均）
 * 若 estimatedQuantity 為 0 或未填，則不納入計算。
 * 若所有 estimatedQuantity 為 0，則回傳 0。
 */
export function calculateProjectProgress(project: Project): number {
  if (!project.workpackages || project.workpackages.length === 0) return 0;
  let totalEstimated = 0;
  let totalProgress = 0;

  for (const wp of project.workpackages) {
    if (!wp.subWorkpackages || wp.subWorkpackages.length === 0) continue;
    for (const sub of wp.subWorkpackages) {
      const estimated = typeof sub.estimatedQuantity === "number" ? sub.estimatedQuantity : 0;
      const progress = typeof sub.progress === "number" ? sub.progress : 0;
      if (estimated > 0) {
        totalEstimated += estimated;
        totalProgress += (progress / 100) * estimated;
      }
    }
  }
  if (totalEstimated === 0) return 0;
  return Math.round((totalProgress / totalEstimated) * 100);
}

/**
 * React 組件：顯示專案進度百分比
 */
import React from "react";

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
