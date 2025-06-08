import { Timestamp } from 'firebase/firestore';

// ===== Workpackage/Project 型別合併區 =====

export type PhotoType = 'progress' | 'issue' | 'material' | 'safety' | 'other'; // 照片類型

export interface Task {
    id: string; // 任務唯一識別碼
    name: string; // 任務名稱
    description?: string; // 任務描述（可選）
    status?: 'pending' | 'in-progress' | 'completed'; // 任務狀態（可選）
    dueDate?: Timestamp; // 任務截止日期（可選）
    assignedTo?: string; // 任務分配對象（可選）
    completed: boolean; // 任務是否完成
    createdAt: Timestamp; // 任務建立時間
}

export interface ProgressHistoryRecord {
    date: Timestamp;
    doneCount: number;
    percent: number;
}

export interface SubWorkpackage {
    id: string;
    name: string;
    description?: string;
    actualStartDate?: Timestamp;
    actualEndDate?: Timestamp;
    status?: string;
    progress?: number;
    assignedTo?: string;
    createdAt: Timestamp;
    tasks: Task[];
    priority?: number;
    estimatedQuantity?: number;
    actualQuantity?: number;
    unit?: string;
    budget?: number;
    estimatedStartDate?: Timestamp;
    estimatedEndDate?: Timestamp;
    progressHistory?: ProgressHistoryRecord[];
}

export interface Workpackage {
    id: string;
    name: string;
    description?: string;
    actualStartDate?: Timestamp;
    actualEndDate?: Timestamp;
    estimatedStartDate?: Timestamp;
    estimatedEndDate?: Timestamp;
    status?: string;
    progress?: number;
    assignedTo?: string;
    createdAt: Timestamp;
    budget?: number;
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    subWorkpackages: SubWorkpackage[];
}

export interface DailyReport {
    id: string;
    date: Timestamp;
    weather: string;
    temperature: number;
    rainfall: number;
    workforceCount: number;
    materials: MaterialEntry[];
    activities: ActivityLog[];
    issues?: IssueRecord[] | string;
    photos: PhotoRecord[];
    createdBy: string;
    createdAt: Timestamp;
    description?: string; // 新增，對應 UI 的工作描述
}

export interface ActivityLog {
    id: string;
    workpackageId: string;
    description: string;
    startTime: Timestamp;
    endTime: Timestamp;
    workforce: number;
    progress: number;
    notes: string;
}

export interface MaterialEntry {
    materialId: string;
    name: string;
    quantity: number;
    unit: string;
    supplier: string;
    notes: string;
}

export interface IssueRecord {
    id: string;
    type: 'quality' | 'safety' | 'progress' | 'other';
    description: string;
    severity: 'low' | 'medium' | 'high';
    status: 'open' | 'in-progress' | 'resolved';
    assignedTo: string;
    dueDate: Timestamp;
    resolution?: string;
    resolved?: boolean; // 允許 resolved 屬性，與現有程式一致
}

export interface PhotoRecord {
    id: string;
    url: string;
    type: PhotoType;
    description: string;
    workpackageId?: string;
    zoneId?: string;
    reportId?: string;
    createdAt: Timestamp;
    createdBy: string;
}

export interface Zone {
    zoneId: string;
    zoneName: string;
    desc?: string;
    order?: number;
    createdAt: Timestamp;
}

export interface Project {
    projectId?: string; // 專案唯一識別碼（可選）
    projectName: string; // 專案名稱
    contractId?: string; // 合約 ID（可選）
    status: string; // 專案狀態
    coordinator?: string; // 專案協調人（可選）
    inspector?: string; // 專案檢查員（可選）
    safety?: string; // 專案安全負責人（可選）
    area?: string; // 專案區域（可選）
    address?: string; // 專案地址（可選）
    startDate?: Timestamp; // 專案開始日期（可選）
    estimatedEndDate?: Timestamp; // 預計結束日期（可選）
    owner?: string; // 專案擁有者（可選）
    createdAt: Timestamp; // 專案建立時間
    updatedAt: Timestamp; // 專案更新時間
    zones?: Zone[]; // 專案區域清單（可選）
    supervisor?: string; // 專案監督人（可選）
    safetyOfficer?: string; // 專案安全官（可選）
    region?: string; // 專案地區（可選）
    workpackages: Workpackage[]; // 專案的工作包清單
    decomposition?: object; // 專案分解結構（可選）
    reports?: DailyReport[]; // 專案的日報清單（可選）
    photos?: PhotoRecord[]; // 專案的照片清單（可選）
    materials?: MaterialEntry[]; // 專案的材料清單（可選）
    issues?: IssueRecord[]; // 專案的問題清單（可選）
}

// ===== Template 型別區 =====

export interface SubWorkpackageTemplateItem {
    id: string;
    name: string;
    description?: string;
    estimatedQuantity?: number;
    unit?: string;
    tasks?: {
        name: string;
        description?: string;
    }[];
}

export interface Template {
    id: string;
    name: string;
    description: string;
    category: string;
    subWorkpackages: SubWorkpackageTemplateItem[];
    createdBy: string;
    createdAt: Timestamp;
    updatedAt: Timestamp;
}

/**
 * 將範本轉換為子工作包時的選項
 * - workpackageId: 指定要套用的工作包 ID（可選）
 * - estimatedStartDate: 預計開始日期（可選，ISO 字串）
 * - estimatedEndDate: 預計結束日期（可選，ISO 字串）
 */
export type TemplateToSubWorkpackageOptions = {
    workpackageId?: string;
    estimatedStartDate?: Timestamp;
    estimatedEndDate?: Timestamp;
};
