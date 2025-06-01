// 任務介面定義
export interface Task {
    id: string;
    name: string;
    description?: string;
    status?: 'pending' | 'in-progress' | 'completed';
    dueDate?: string;
    assignedTo?: string;
    completed: boolean;
    createdAt: string;
}

// 子工作包介面定義
export interface SubWorkpackage {
    id: string;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    progress?: number;
    assignedTo?: string;
    createdAt: string;
    tasks: Task[];
}

// 工作包介面定義
export interface Workpackage {
    id: string;
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    progress?: number;
    assignedTo?: string;
    createdAt: string;
    // 工作包特有的欄位
    budget?: number;
    category?: string;
    priority?: 'low' | 'medium' | 'high';
    // 子工作包
    subWorkpackages: SubWorkpackage[];
}

// 增加工作日誌介面
interface DailyReport {
    id: string;
    date: string;
    weather: string;
    temperature: number;
    rainfall: number;
    workforceCount: number;
    materials: MaterialEntry[];
    activities: ActivityLog[];
    issues: IssueRecord[];
    photos: PhotoRecord[];
    createdBy: string;
    createdAt: string;
}

// 增加施工活動記錄
interface ActivityLog {
    id: string;
    workpackageId: string;
    description: string;
    startTime: string;
    endTime: string;
    workforce: number;
    progress: number;
    notes: string;
}

// 增加物料紀錄
interface MaterialEntry {
    materialId: string;
    name: string;
    quantity: number;
    unit: string;
    supplier: string;
    notes: string;
}

// 增加問題記錄
interface IssueRecord {
    id: string;
    type: 'quality' | 'safety' | 'progress' | 'other';
    description: string;
    severity: 'low' | 'medium' | 'high';
    status: 'open' | 'in-progress' | 'resolved';
    assignedTo: string;
    dueDate: string;
    resolution?: string;
}

// 照片記錄介面
interface PhotoRecord {
    id: string;
    url: string;
    type: 'progress' | 'issue' | 'material' | 'safety' | 'other';
    description: string;
    workpackageId?: string;
    zoneId?: string;
    createdAt: string;
    createdBy: string;
}