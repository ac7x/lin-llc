/**
 * 日期工具模組
 * 提供統一的日期處理和格式化功能
 */

import React from "react";
import { format, isValid, parseISO, differenceInDays, addDays, isBefore, isAfter, isSameDay } from "date-fns";
import type { Locale } from "date-fns";
import { Timestamp } from 'firebase/firestore';
import { DateInput } from '@/types/common';
import { zhTW } from 'date-fns/locale';

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
 * 將輸入轉換為合法的 Date 物件
 */
export function parseToDate(value: DateInput): Date {
    if (value instanceof Date) return value;
    if (value instanceof Timestamp) return value.toDate();
    if (typeof value === 'string') return parseISO(value);
    if (typeof value === 'number') return new Date(value);
    throw new Error('無效的日期輸入');
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
export const DateFormat: React.FC<DateFormatProps> = ({
    value,
    formatPattern,
    fallback,
    locale,
}) => {
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
export function formatLocalDate(date: DateInput, locale: Locale = zhTW): string {
    const parsedDate = parseToDate(date);
    if (!isValid(parsedDate)) return '';
    return format(parsedDate, 'PPP', { locale });
}

/**
 * 格式化日期為 HTML date input 格式 (YYYY-MM-DD)
 */
export function formatDateForInput(date: DateInput): string {
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
export const formatDate = (timestamp: TimestampInput, formatStr = "yyyy-MM-dd"): string => {
    if (!timestamp) return "";
    try {
        return format(timestamp.toDate(), formatStr, { locale: zhTW });
    } catch {
        return "";
    }
};

export default DateFormat; 