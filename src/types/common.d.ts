import { Timestamp } from 'firebase/firestore';

// 基礎日期欄位類型
export type DateField = Timestamp;

// 日期輸入類型
export type DateInput = Date | string | number | Timestamp;

// 日期範圍類型
export interface DateRange {
  startDate: DateField;
  endDate: DateField;
}

// 帶有日期欄位的基礎介面
export interface BaseWithDates {
  createdAt: DateField;
  updatedAt: DateField;
}

// 帶有可選日期欄位的基礎介面
export interface BaseWithOptionalDates {
  createdAt?: DateField;
  updatedAt?: DateField;
}
