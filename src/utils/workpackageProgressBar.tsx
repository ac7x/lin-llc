/**
 * 工作包進度顯示模組
 * 提供工作包進度計算與進度條顯示功能
 * 功能：
 * - calculateWorkpackageProgress: 根據實際完成數量計算工作包進度
 * - WorkpackageProgressBar: 顯示工作包進度條與百分比的 React 元件
 */

import React from "react";
import type { Workpackage } from "@/types/project";

/**
 * 計算工作包進度百分比（根據所有 subWorkpackages 的 estimatedQuantity 與 actualQuantity 欄位）
 * 若 estimatedQuantity 為 0 或未填，則不納入計算。
 * 若所有 estimatedQuantity 為 0，則回傳 0。
 */
export function calculateWorkpackageProgress(wp: Workpackage): number {
  if (!wp.subWorkpackages || wp.subWorkpackages.length === 0) return 0;
  let done = 0;
  let total = 0;
  for (const sw of wp.subWorkpackages) {
    if (typeof sw.estimatedQuantity === "number" && sw.estimatedQuantity > 0) {
      done += typeof sw.actualQuantity === "number" ? sw.actualQuantity : 0;
      total += sw.estimatedQuantity;
    }
  }
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

/**
 * React 組件：顯示工作包進度條與百分比
 */
export const WorkpackageProgressBar: React.FC<{ wp: Workpackage }> = ({ wp }) => {
  const percent = calculateWorkpackageProgress(wp);
  return (
    <div className="flex items-center gap-2">
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
        <div
          className="bg-blue-600 dark:bg-blue-400 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        ></div>
      </div>
      <span className="text-xs font-semibold text-blue-600 dark:text-blue-300 min-w-[2.5rem] text-right">
        {percent}%
      </span>
    </div>
  );
};
