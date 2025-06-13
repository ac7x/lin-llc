import { Timestamp } from 'firebase/firestore';

/**
 * 日曆事件資料
 */
export interface CalendarEvent {
    id: string; // 事件唯一識別碼
    title: string; // 事件標題
    start: Timestamp; // 事件開始時間
    end: Timestamp; // 事件結束時間
    projectName?: string; // 所屬專案名稱（可選）
    workpackageId?: string; // 所屬工作包 ID（可選）
    allDay?: boolean; // 是否為全天事件（可選）
    progress?: number; // 事件進度百分比（可選）
    resourceId?: string; // 資源 ID（可選）
    actualStartDate?: Timestamp; // 實際開始時間（可選）
    actualEndDate?: Timestamp; // 實際結束時間（可選）
}

/**
 * 時間軸項目
 */
export interface TimelineItem {
    id: string | number; // 項目唯一識別碼
    content: string; // 項目內容
    start: Date | string | Timestamp; // 項目開始時間
    end?: Date | string | Timestamp; // 項目結束時間（可選）
    group?: string | number; // 所屬群組 ID（可選）
    className?: string; // 自訂 CSS 類名（可選）
    style?: string; // 自訂內聯樣式（可選）
    editable?: boolean; // 是否可編輯（可選）
    type?: string; // 項目類型（可選）
    subgroup?: string; // 所屬子群組（可選）
    subgroupOrder?: string | number; // 子群組排序（可選）
    title?: string; // 項目標題（可選）
    [key: string]: unknown; // 允許額外屬性
}

/**
 * 時間軸群組
 */
export interface TimelineGroup {
    id: string | number; // 群組唯一識別碼
    content: string; // 群組內容
    className?: string; // 自訂 CSS 類名（可選）
    style?: string; // 自訂內聯樣式（可選）
    subgroupStack?: boolean; // 是否堆疊子群組（可選）
    subgroupVisibility?: boolean; // 子群組是否可見（可選）
    title?: string; // 群組標題（可選）
    nestedGroups?: string[] | number[]; // 嵌套群組 ID 清單（可選）
    [key: string]: unknown; // 允許額外屬性
}

export interface TimelineOptions {
    editable?: boolean | { add?: boolean; remove?: boolean; updateTime?: boolean; updateGroup?: boolean };
    onMove?: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void;
    [key: string]: unknown;
}

// DataSet 改為 class，避免 interface 構造器錯誤
export class DataSet<T> {
    constructor(data: T[]);
    add(data: T | T[]): void;
    update(data: T | T[]): void;
    remove(ids: string | number | (string | number)[]): void;
    get(id: string | number): T | null;
    get(): T[];
    [key: string]: unknown;
}

export type DateType = Date | string | number;
