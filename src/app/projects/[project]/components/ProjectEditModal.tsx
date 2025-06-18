/**
 * 專案編輯彈窗組件
 * 
 * 提供編輯專案基本資訊的功能，包括：
 * - 專案名稱、合約ID
 * - 專案成員（經理、監工、安全人員、成本控制員）
 * - 專案地點和時間資訊
 */

"use client";

import { useState } from "react";
import { doc, updateDoc, Timestamp, db } from '@/lib/firebase-client';
import { TaiwanCityList } from "@/utils/taiwanCityUtils";
import { ROLE_NAMES, type RoleKey } from "@/constants/roles";
import type { AppUser } from "@/types/auth";
import type { Project } from "@/types/project";

interface ProjectEditModalProps {
    project: Project;
    projectId: string;
    isOpen: boolean;
    onClose: () => void;
    eligibleUsers: {
        costControllers: AppUser[];
        supervisors: AppUser[];
        safetyOfficers: AppUser[];
        coordinators: AppUser[];
    };
}

export default function ProjectEditModal({
    project,
    projectId,
    isOpen,
    onClose,
    eligibleUsers
}: ProjectEditModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleUpdateProject = async (formData: FormData) => {
        try {
            setIsSubmitting(true);
            const startDate = formData.get("startDate")?.toString();
            const estimatedEndDate = formData.get("estimatedEndDate")?.toString();

            const updates = {
                projectName: formData.get("projectName"),
                contractId: formData.get("contractId"),
                coordinator: formData.get("coordinator"),
                supervisor: formData.get("supervisor"),
                safetyOfficer: formData.get("safetyOfficer"),
                costController: formData.get("costController"),
                region: formData.get("region"),
                address: formData.get("address"),
                owner: formData.get("owner"),
                startDate: startDate ? Timestamp.fromDate(new Date(startDate)) : null,
                estimatedEndDate: estimatedEndDate ? Timestamp.fromDate(new Date(estimatedEndDate)) : null,
                updatedAt: Timestamp.now()
            };

            await updateDoc(doc(db, "projects", projectId), updates);
            onClose();
        } catch (error) {
            console.error("更新專案資訊失敗:", error);
            alert("更新失敗，請重試");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                    編輯專案資訊
                </h2>
                <form onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target as HTMLFormElement);
                    await handleUpdateProject(formData);
                }} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                專案名稱
                            </label>
                            <input 
                                name="projectName" 
                                defaultValue={project.projectName} 
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200" 
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                合約ID
                            </label>
                            <input 
                                name="contractId" 
                                defaultValue={project.contractId} 
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                經理
                            </label>
                            <select
                                name="coordinator"
                                defaultValue={project.coordinator || ""}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                            >
                                <option key="coordinator-empty" value="">請選擇</option>
                                {eligibleUsers.coordinators.map((user, index) => (
                                    <option key={`coordinator-${user.uid}-${index}`} value={user.uid}>
                                        {user.displayName} ({ROLE_NAMES[(user.roles?.[0] || user.currentRole) as RoleKey]})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                監工
                            </label>
                            <select
                                name="supervisor"
                                defaultValue={project.supervisor || ""}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                            >
                                <option key="supervisor-empty" value="">請選擇</option>
                                {eligibleUsers.supervisors.map((user, index) => (
                                    <option key={`supervisor-${user.uid}-${index}`} value={user.uid}>
                                        {user.displayName} ({ROLE_NAMES[(user.roles?.[0] || user.currentRole) as RoleKey]})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                安全人員
                            </label>
                            <select
                                name="safetyOfficer"
                                defaultValue={project.safetyOfficer || ""}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                            >
                                <option key="safety-empty" value="">請選擇</option>
                                {eligibleUsers.safetyOfficers.map((user, index) => (
                                    <option key={`safety-${user.uid}-${index}`} value={user.uid}>
                                        {user.displayName} ({ROLE_NAMES[(user.roles?.[0] || user.currentRole) as RoleKey]})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                成本控制員
                            </label>
                            <select
                                name="costController"
                                defaultValue={project.costController || ""}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                            >
                                <option key="cost-empty" value="">請選擇</option>
                                {eligibleUsers.costControllers.map((user, index) => (
                                    <option key={`cost-${user.uid}-${index}`} value={user.uid}>
                                        {user.displayName} ({ROLE_NAMES[(user.roles?.[0] || user.currentRole) as RoleKey]})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                地區
                            </label>
                            <select
                                name="region"
                                defaultValue={project.region || ""}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                            >
                                <option key="region-empty" value="">請選擇</option>
                                {TaiwanCityList.map((opt, index) => (
                                    <option key={`region-${opt.value}-${index}`} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                地址
                            </label>
                            <input 
                                name="address" 
                                defaultValue={project.address} 
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                業主
                            </label>
                            <input 
                                name="owner" 
                                defaultValue={project.owner} 
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                起始日
                            </label>
                            <input 
                                key="startDate"
                                type="date" 
                                name="startDate" 
                                defaultValue={project.startDate?.toDate().toISOString().split('T')[0]} 
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                預估結束日
                            </label>
                            <input 
                                key="estimatedEndDate"
                                type="date" 
                                name="estimatedEndDate" 
                                defaultValue={project.estimatedEndDate?.toDate().toISOString().split('T')[0]} 
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200" 
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-50"
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 flex items-center"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    儲存中...
                                </>
                            ) : (
                                '確認儲存'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
} 