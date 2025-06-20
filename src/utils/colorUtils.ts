/**
 * 顏色工具模組
 * 提供進度條顏色漸變與顏色混合功能
 * - ProgressColorScale: 定義進度條的顏色刻度（0-100%）
 * - getGradientColorByPercent: 根據百分比計算兩個顏色之間的漸變色
 */

import { colord, extend } from "colord";
import mixPlugin from "colord/plugins/mix";

extend([mixPlugin]);

export const ProgressColorScale = [
  { min: 0, max: 9, color: "#FF6B6B" },     // 鮮紅色 - 未開始
  { min: 10, max: 19, color: "#FF8E53" },   // 橙紅色 - 剛開始
  { min: 20, max: 29, color: "#FFB347" },   // 橙色 - 初期階段
  { min: 30, max: 39, color: "#FFD93D" },   // 金黃色 - 準備階段
  { min: 40, max: 49, color: "#6BCF7F" },   // 淺綠色 - 進行中
  { min: 50, max: 59, color: "#4ECDC4" },   // 青綠色 - 中期階段
  { min: 60, max: 69, color: "#45B7D1" },   // 天藍色 - 後期階段
  { min: 70, max: 79, color: "#96CEB4" },   // 薄荷綠 - 接近完成
  { min: 80, max: 89, color: "#FFEAA7" },   // 淺黃色 - 收尾階段
  { min: 90, max: 100, color: "#55A3FF" },  // 藍色 - 已完成
];

// 新增：進度階段描述
export const ProgressStageDescriptions = {
  0: "未開始",
  10: "剛開始", 
  20: "初期階段",
  30: "準備階段",
  40: "進行中",
  50: "中期階段",
  60: "後期階段",
  70: "接近完成",
  80: "收尾階段",
  90: "已完成"
} as const;

/**
 * 根據百分比取得漸變色
 * @param percent 0~100
 * @param fromColor 起始色 (預設紅)
 * @param toColor 結束色 (預設綠)
 * @returns HEX 色碼
 */
export function getGradientColorByPercent(
  percent: number,
  fromColor = "#dc3545",
  toColor = "#28a745"
): string {
  const p = Math.max(0, Math.min(100, percent)) / 100;
  return colord(fromColor).mix(toColor, p).toHex();
}

/**
 * 根據進度百分比取得對應的階段描述
 * @param percent 0~100
 * @returns 階段描述文字
 */
export function getProgressStageDescription(percent: number): string {
  const stage = Math.floor(percent / 10) * 10;
  return ProgressStageDescriptions[stage as keyof typeof ProgressStageDescriptions] || "未知階段";
}

/**
 * 根據進度百分比取得對應的顏色和描述
 * @param percent 0~100
 * @returns { color: string, description: string }
 */
export function getProgressInfo(percent: number): { color: string; description: string } {
  const scale = ProgressColorScale.find(
    s => percent >= s.min && percent <= s.max
  );
  
  return {
    color: scale?.color || "#CCCCCC",
    description: getProgressStageDescription(percent)
  };
}
