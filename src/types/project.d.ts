import { Workpackage } from './workpackage';

export interface Zone {
    zoneId: string;
    zoneName: string;
    desc?: string;
    order?: number;
    createdAt: Date;
}

export interface Project {
    projectId?: string;
    projectName: string;
    contractId?: string;
    status: string;
    coordinator?: string;
    inspector?: string;
    safety?: string;
    area?: string;
    address?: string;
    startDate?: Date | string;
    estimatedEndDate?: Date | string;
    owner?: string;
    createdAt: Date;
    updatedAt: Date;
    zones?: Zone[];
    supervisor?: string;      // 監工
    safetyOfficer?: string;   // 安全人員
    region?: string;          // 地區
    workpackages: Workpackage[]; // 工作包列表
    decomposition?: object;      // 專案分解資料
}
