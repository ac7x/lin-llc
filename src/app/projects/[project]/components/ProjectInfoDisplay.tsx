/**
 * 專案資訊顯示組件
 * 
 * 顯示專案的基本資訊，包括：
 * - 專案名稱、合約ID
 * - 專案成員資訊
 * - 專案地點和時間資訊
 */

"use client";

import type { AppUser } from "@/types/auth";
import type { Project } from "@/types/project";

interface ProjectInfoDisplayProps {
    project: Project;
    eligibleUsers: {
        costControllers: AppUser[];
        supervisors: AppUser[];
        safetyOfficers: AppUser[];
        coordinators: AppUser[];
    };
}

export default function ProjectInfoDisplay({
    project,
    eligibleUsers
}: ProjectInfoDisplayProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        專案名稱
                    </label>
                    <div className="mt-1 text-gray-900 dark:text-gray-100">
                        {project.projectName}
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        合約ID
                    </label>
                    <div className="mt-1 text-gray-900 dark:text-gray-100">
                        {project.contractId || '-'}
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        經理
                    </label>
                    <div className="mt-1 text-gray-900 dark:text-gray-100">
                        {project.coordinator ? 
                            eligibleUsers.coordinators.find(u => u.uid === project.coordinator)?.displayName || '-' 
                            : '-'}
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        監工
                    </label>
                    <div className="mt-1 text-gray-900 dark:text-gray-100">
                        {project.supervisor ? 
                            eligibleUsers.supervisors.find(u => u.uid === project.supervisor)?.displayName || '-' 
                            : '-'}
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        安全人員
                    </label>
                    <div className="mt-1 text-gray-900 dark:text-gray-100">
                        {project.safetyOfficer ? 
                            eligibleUsers.safetyOfficers.find(u => u.uid === project.safetyOfficer)?.displayName || '-' 
                            : '-'}
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        成本控制員
                    </label>
                    <div className="mt-1 text-gray-900 dark:text-gray-100">
                        {project.costController ? 
                            eligibleUsers.costControllers.find(u => u.uid === project.costController)?.displayName || '-' 
                            : '-'}
                    </div>
                </div>
            </div>
            <div className="space-y-4">
                <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        地區
                    </label>
                    <div className="mt-1 text-gray-900 dark:text-gray-100">
                        {project.region || '-'}
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        地址
                    </label>
                    <div className="mt-1 text-gray-900 dark:text-gray-100">
                        {project.address || '-'}
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        業主
                    </label>
                    <div className="mt-1 text-gray-900 dark:text-gray-100">
                        {project.owner || '-'}
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        起始日
                    </label>
                    <div className="mt-1 text-gray-900 dark:text-gray-100">
                        {project.startDate ? project.startDate.toDate().toLocaleDateString() : '-'}
                    </div>
                </div>
                <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                        預估結束日
                    </label>
                    <div className="mt-1 text-gray-900 dark:text-gray-100">
                        {project.estimatedEndDate ? project.estimatedEndDate.toDate().toLocaleDateString() : '-'}
                    </div>
                </div>
            </div>
        </div>
    );
} 