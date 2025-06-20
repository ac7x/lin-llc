/**
 * 日期工具模組
 * 提供統一的日期處理和格式化功能
 */

import {
  format,
  isValid,
  parseISO,
  differenceInDays,
  addDays,
  isBefore,
  isAfter,
  isSameDay,
} from 'date-fns';
import type { Locale } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import { Timestamp } from 'firebase/firestore';
import type { ReactElement } from 'react';
import React from 'react';

import { DateInput } from '@/types/common';

/**
 * 支援多種日期型別的通用日期格式化元件（所有 props 為必填）
 */
export interface DateFormatProps {
  value: DateInput;
  formatPattern: string;
  fallback: string;
  locale: Locale;
}

/**
 * 安全地將任何可能的 Timestamp 物件轉換為 Date
 * 這個函數會處理各種可能的 Timestamp 型別，包括 Firestore Timestamp 和其他具有 toDate 方法的物件
 */
export function safeToDate(value: unknown): Date | null {
  if (!value) return null;
  
  // 如果已經是 Date 物件
  if (value instanceof Date) return value;
  
  // 如果是 Firestore Timestamp
  if (value instanceof Timestamp) return value.toDate();
  
  // 如果是具有 toDate 方法的物件
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return null;
    }
  }
  
  // 如果是字串，嘗試解析
  if (typeof value === 'string') {
    const parsed = parseISO(value);
    if (isValid(parsed)) return parsed;
  }
  
  // 如果是數字，嘗試轉換為 Date
  if (typeof value === 'number') {
    const date = new Date(value);
    if (isValid(date)) return date;
  }
  
  return null;
}

/**
 * 將輸入轉換為合法的 Date 物件
 */
export function parseToDate(value: DateInput | null | undefined): Date {
  if (!value) return new Date(NaN); // 回傳無效日期
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'string') {
    const parsed = parseISO(value);
    if (isValid(parsed)) return parsed;
  }
  if (typeof value === 'number') return new Date(value);

  // 如果所有轉換都失敗，回傳無效日期
  return new Date(NaN);
}

/**
 * 將各種日期格式轉換為 Timestamp
 */
export function toTimestamp(value: DateInput): Timestamp {
  if (value instanceof Timestamp) return value;
  if (value instanceof Date) return Timestamp.fromDate(value);
  if (typeof value === 'string') return Timestamp.fromDate(parseISO(value));
  if (typeof value === 'number') return Timestamp.fromMillis(value);
  throw new Error('無效的日期輸入');
}

/**
 * 日期格式化 React 元件
 */
export const DateFormat = ({
  value,
  formatPattern,
  fallback,
  locale,
}: DateFormatProps): ReactElement => {
  const date = parseToDate(value);

  if (!isValid(date)) {
    return React.createElement('span', null, fallback);
  }

  return React.createElement('span', null, format(date, formatPattern, { locale }));
};

/**
 * 計算兩個日期之間的天數差
 */
export function getDaysDifference(startDate: DateInput, endDate: DateInput): number {
  const start = parseToDate(startDate);
  const end = parseToDate(endDate);
  return differenceInDays(end, start);
}

/**
 * 檢查日期是否在指定範圍內
 */
export function isDateInRange(date: DateInput, startDate: DateInput, endDate: DateInput): boolean {
  const checkDate = parseToDate(date);
  const start = parseToDate(startDate);
  const end = parseToDate(endDate);
  return !isBefore(checkDate, start) && !isAfter(checkDate, end);
}

/**
 * 格式化日期為本地化字串
 */
export function formatLocalDate(date: DateInput | null | undefined, locale: Locale = zhTW): string {
  const parsedDate = parseToDate(date);
  if (!isValid(parsedDate)) return '';
  return format(parsedDate, 'PPP', { locale });
}

/**
 * 格式化日期為 HTML date input 格式 (YYYY-MM-DD)
 */
export function formatDateForInput(date: DateInput | null | undefined): string {
  const parsedDate = parseToDate(date);
  if (!isValid(parsedDate)) return '';
  return format(parsedDate, 'yyyy-MM-dd');
}

/**
 * 格式化時間為本地化字串
 */
export function formatLocalTime(date: DateInput, locale: Locale = zhTW): string {
  const parsedDate = parseToDate(date);
  if (!isValid(parsedDate)) return '';
  return format(parsedDate, 'p', { locale });
}

/**
 * 格式化日期時間為本地化字串
 */
export function formatLocalDateTime(date: DateInput, locale: Locale = zhTW): string {
  const parsedDate = parseToDate(date);
  if (!isValid(parsedDate)) return '';
  return format(parsedDate, 'PPP p', { locale });
}

/**
 * 獲取相對時間描述（例如：3天前、2小時後）
 */
export function getRelativeTimeDescription(date: DateInput, locale: Locale = zhTW): string {
  const parsedDate = parseToDate(date);
  if (!isValid(parsedDate)) return '';
  return format(parsedDate, 'PPp', { locale });
}

/**
 * 檢查日期是否為今天
 */
export function isToday(date: DateInput): boolean {
  const parsedDate = parseToDate(date);
  return isSameDay(parsedDate, new Date());
}

/**
 * 獲取日期範圍
 */
export function getDateRange(startDate: DateInput, days: number): Date[] {
  const start = parseToDate(startDate);
  return Array.from({ length: days }, (_, i) => addDays(start, i));
}

type TimestampInput = Timestamp | null | undefined;

/**
 * 將 Firestore Timestamp 轉為 yyyy-MM-dd 格式字串
 */
export const formatDate = (timestamp: TimestampInput, formatStr = 'yyyy-MM-dd'): string => {
  if (!timestamp) return '';
  try {
    return format(timestamp.toDate(), formatStr, { locale: zhTW });
  } catch {
    return '';
  }
};
