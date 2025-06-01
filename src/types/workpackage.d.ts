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

