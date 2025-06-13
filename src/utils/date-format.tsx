import React from "react";
import { format, isValid, parseISO } from "date-fns";
import type { Locale } from "date-fns";

/**
 * 明確定義可接受的日期型別
 */
type DateInput = Date | string | number | { toDate: () => Date };

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
function parseToDate(value: DateInput): Date {
    if (value instanceof Date) return value;
    if (typeof value === "string") return parseISO(value);
    if (typeof value === "number") return new Date(value);
    return value.toDate(); // Firestore Timestamp-like object
}

const DateFormat: React.FC<DateFormatProps> = ({
    value,
    formatPattern,
    fallback,
    locale,
}) => {
    const date = parseToDate(value);

    if (!isValid(date)) {
        return <span>{fallback}</span>;
    }

    return <span>{format(date, formatPattern, { locale })}</span>;
};

export default DateFormat;
