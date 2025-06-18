/**
 * 專案管理相關型別定義
 * 包含工作包、任務、日報、區域等資料結構
 * 用於管理專案生命週期中的各項活動和資源
 */

import { DateField, BaseWithDates } from './common';

// ===== Workpackage/Project 型別合併區 =====

export type PhotoType = 'progress' | 'issue' | 'material' | 'safety' | 'other'; // 照片類型

export interface Task extends BaseWithDates {
    id: string; // 任務唯一識別碼
    name: string; // 任務名稱
    description?: string; // 任務描述（可選）
    status?: 'pending' | 'in-progress' | 'completed'; // 任務狀態（可選）
    dueDate?: DateField; // 任務截止日期（可選）
    assignedTo?: string; // 任務分配對象（可選）
    completed: boolean; // 任務是否完成
}

export interface ProgressHistoryRecord {
    date: DateField;
    doneCount: number;
    percent: number;
}

export interface SubWorkpackage extends BaseWithDates {
    id: string;
    name: string;
    description?: string;
    actualStartDate?: DateField;
    actualEndDate?: DateField;
    plannedStartDate?: DateField;
    plannedEndDate?: DateField;
    status?: string;
    progress?: number;
    assignedTo?: string;
    priority?: number;
    estimatedQuantity?: number;
    actualQuantity?: number;
    unit?: string;
    budget?: number;
    estimatedStartDate?: DateField;
    estimatedEndDate?: DateField;
    progressHistory?: ProgressHistoryRecord[];
    tasks?: Task[];
}

export interface Workpackage extends BaseWithDates {
    id: string;
    name: string;
    description?: string;
    actualStartDate?: DateField;
    actualEndDate?: DateField;
    plannedStartDate?: DateField;
    plannedEndDate?: DateField;
    estimatedStartDate?: DateField;
    estimatedEndDate?: DateField;
    status?: string;
    progress?: number;
    assignedTo?: string;
    budget?: number;
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    subWorkpackages: SubWorkpackage[];
}

export interface DailyReport extends BaseWithDates {
    id: string;
    date: DateField;
    weather: string;
    temperature: number;
    rainfall: number;
    workforceCount: number;
    materials: MaterialEntry[];
    activities: ActivityLog[];
    issues?: IssueRecord[] | string;
    photos: PhotoRecord[];
    createdBy: string;
    description?: string; // 新增，對應 UI 的工作描述
    projectProgress?: number; // 新增，記錄當日專案總進度
}

export interface ActivityLog extends BaseWithDates {
    id: string;
    workpackageId: string;
    description: string;
    startTime: DateField;
    endTime: DateField;
    workforce: number;
    progress: number;
    notes: string;
}

export interface MaterialEntry extends BaseWithDates {
    materialId: string;
    name: string;
    quantity: number;
    unit: string;
    supplier: string;
    notes: string;
}

export interface IssueRecord extends BaseWithDates {
    id: string;
    type: 'quality' | 'safety' | 'progress' | 'other';
    description: string;
    severity: 'low' | 'medium' | 'high';
    status: 'open' | 'in-progress' | 'resolved';
    assignedTo: string;
    dueDate: DateField;
    resolution?: string;
    resolved?: boolean; // 允許 resolved 屬性，與現有程式一致
}

export interface PhotoRecord extends BaseWithDates {
    id: string;
    url: string;
    type: PhotoType;
    description: string;
    workpackageId?: string;
    zoneId?: string;
    reportId?: string;
    createdBy: string;
}

export interface Zone extends BaseWithDates {
    zoneId: string;
    zoneName: string;
    desc?: string;
    order?: number;
}

export interface Expense extends BaseWithDates {
    id: string;
    description: string;
    amount: number;
    date: DateField;
    category: string;
    createdBy: string;
    updatedBy: string;
}

export interface Project extends BaseWithDates {
    projectId?: string; // 專案唯一識別碼（可選）
    projectName: string; // 專案名稱
    contractId?: string; // 合約 ID（可選）
    status: string; // 專案狀態
    coordinator?: string; // 專案協調人（可選）
    inspector?: string; // 專案檢查員（可選）
    safety?: string; // 專案安全負責人（可選）
    area?: string; // 專案區域（可選）
    address?: string; // 專案地址（可選）
    startDate?: DateField; // 專案開始日期（可選）
    estimatedEndDate?: DateField; // 預計結束日期（可選）
    owner?: string; // 專案擁有者（可選）
    zones?: Zone[]; // 專案區域清單（可選）
    supervisor?: string; // 專案監督人（可選）
    safetyOfficer?: string; // 專案安全官（可選）
    costController?: string; // 專案成本控制員（可選）
    region?: string; // 專案地區（可選）
    workpackages: Workpackage[]; // 專案的工作包清單
    decomposition?: object; // 專案分解結構（可選）
    reports?: DailyReport[]; // 專案的日報清單（可選）
    photos?: PhotoRecord[]; // 專案的照片清單（可選）
    materials?: MaterialEntry[]; // 專案的材料清單（可選）
    issues?: IssueRecord[]; // 專案的問題清單（可選）
    expenses?: Expense[]; // 專案的費用清單（可選）
    roles?: string[]; // 專案的角色權限清單（可選）
}

// ===== Template 型別區 =====

export interface SubWorkpackageTemplateItem extends BaseWithDates {
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

export interface Template extends BaseWithDates {
    id: string;
    name: string;
    description: string;
    category: string;
    subWorkpackages: SubWorkpackageTemplateItem[];
    createdBy: string;
}

/**
 * 將範本轉換為子工作包時的選項
 * - workpackageId: 指定要套用的工作包 ID（可選）
 * - estimatedStartDate: 預計開始日期（可選，ISO 字串）
 * - estimatedEndDate: 預計結束日期（可選，ISO 字串）
 * - assignedTo: 負責人（可選）
 */
export type TemplateToSubWorkpackageOptions = {
    workpackageId?: string;
    estimatedStartDate?: DateField;
    estimatedEndDate?: DateField;
    assignedTo?: string;
};

export interface ExpenseItem extends BaseWithDates {
    expenseItemId: string; // 項目唯一識別碼
    description: string; // 項目描述
    quantity: number; // 項目數量
    unitPrice: number; // 單價
    amount: number; // 總金額
    workpackageId: string; // 關聯工作包 ID
    subWorkpackageId?: string; // 可選：關聯子工作包
}

export interface ExpenseData extends BaseWithDates {
    expenseId: string; // 支出編號
    expenseNumber: string; // 支出號碼
    expenseDate: DateField; // 支出日期
    clientName: string; // 客戶名稱
    clientContact: string; // 客戶聯絡人
    clientPhone: string; // 客戶電話
    clientEmail: string; // 客戶 Email
    projectId: string; // 關聯專案
    type: '請款' | '支出'; // 支出性質
    items: ExpenseItem[]; // 支出項目清單
    totalAmount: number; // 總金額
    relatedOrderId?: string; // 相關訂單編號（可選）
    relatedContractId?: string; // 相關合約編號（可選）
    status: 'draft' | 'issued' | 'cancelled'; // 支出狀態
    notes?: string; // 備註（可選）
    expenseName?: string; // 支出名稱（對應專案名稱，可選）
    expenses?: Expense[]; // 支出紀錄（可選）
}

export interface ContractData extends BaseWithDates {
    contractId: string; // 合約唯一識別碼
    contractNumber: string; // 合約編號
    contractDate: DateField; // 合約日期
    clientName: string; // 客戶名稱
    clientContact: string; // 客戶聯絡人
    clientPhone: string; // 客戶電話
    clientEmail: string; // 客戶 Email
    projectId: string; // 關聯專案
    type: '請款' | '支出'; // 合約性質
    items: ContractItem[]; // 合約項目清單
    totalAmount: number; // 總金額
    relatedOrderId?: string; // 相關訂單編號（可選）
    status: 'draft' | 'issued' | 'cancelled'; // 合約狀態
    notes?: string; // 備註（可選）
    contractName?: string; // 合約名稱（對應專案名稱，可選）
    contracts?: Contract[]; // 合約紀錄（可選）
}