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
  { min: 0, max: 9, color: "#8A63D2" },     // 紫色
  { min: 10, max: 19, color: "#5A3EBA" },   // 深藍紫色
  { min: 20, max: 29, color: "#00BFFF" },   // 亮藍色
  { min: 30, max: 39, color: "#00A8FF" },   // 亮藍色(另一色)
  { min: 40, max: 49, color: "#00C3FF" },   // 藍綠漸變中間色
  { min: 50, max: 59, color: "#00E0DC" },   // 青綠色
  { min: 60, max: 69, color: "#00F5A0" },   // 青綠色(亮)
  { min: 70, max: 79, color: "#00E0DC" },   // 青綠色(回到較深)
  { min: 80, max: 89, color: "#00C3FF" },   // 藍綠漸變中間色
  { min: 90, max: 100, color: "#8A63D2" },  // 紫色(收尾)
];

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
