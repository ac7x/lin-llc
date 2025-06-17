import { Timestamp } from 'firebase/firestore';

// 統一的日期類型定義
export type DateField = Timestamp | null;

// 日期輸入類型（用於轉換）
export type DateInput = Date | string | number | Timestamp | null;

// 日期範圍類型
export interface DateRange {
  startDate: DateField;
  endDate: DateField;
}

// 帶有日期的基本介面
export interface BaseWithDates {
  createdAt: DateField;
  updatedAt: DateField;
}

// 帶有可選日期的基本介面
export interface BaseWithOptionalDates {
  createdAt?: DateField;
  updatedAt?: DateField;
} 