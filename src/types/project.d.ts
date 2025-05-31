export interface Zone {
    zoneId: string;
    zoneName: string;
    desc?: string;
    order?: number;
    createdAt: Date;
}

export interface Project {
    projectId: string;
    projectName: string;
    contractId?: string;
    status: string;
    coordinator?: string;
    inspector?: string;
    safety?: string;
    area?: string;
    address?: string;
    startDate?: Date;
    estimatedEndDate?: Date;
    owner?: string;
    createdAt: Date;
    updatedAt: Date;
    zones: Zone[];
    supervisor?: string;      // 監工
    safetyOfficer?: string;   // 安全人員
    region?: string;          // 地區
}
