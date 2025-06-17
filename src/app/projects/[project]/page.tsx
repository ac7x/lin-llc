/**
 * 專案詳細頁面
 * 
 * 顯示單一專案的詳細資訊，提供以下功能：
 * - 專案基本資訊管理
 * - 工作包管理
 * - 專案進度追蹤
 * - 專案文件管理
 * - 專案成員管理
 */

"use client";

import { useParams } from "next/navigation";
import { useDocument, useCollection } from "react-firebase-hooks/firestore";
import { useState, useMemo } from "react";
// 新增 DND 相關引入
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ProjectJournalPage from "./project-journal/page";
import ProjectMaterialsPage from "./project-materials/page";
import ProjectIssuesPage from "./project-issues/page";
import SubWorkpackageSortingPage from "./workpackages/subworkpackages/page";
import ProjectCalendarPage from "./project-calendar/page";
import { TaiwanCityList } from "@/utils/taiwanCityUtils";
import { Project, Workpackage } from "@/types/project";
import { useAuth } from '@/hooks/useAuth';
import ProjectExpensesPage from "./project-expenses/page";
import { ROLE_NAMES, type RoleKey } from "@/utils/authUtils";
import type { AppUser } from "@/types/user";

// 在 handleUpdateProject 函數之前添加以下常數
const COST_CONTROLLER_ROLES: RoleKey[] = ['finance'];
const SUPERVISOR_ROLES: RoleKey[] = ['foreman'];
const SAFETY_OFFICER_ROLES: RoleKey[] = ['safety'];
const COORDINATOR_ROLES: RoleKey[] = ['manager'];

function getWorkpackageProgress(wp: Workpackage): number {
    if (!wp.subWorkpackages || wp.subWorkpackages.length === 0) return 0;
    let done = 0;
    let total = 0;
    for (const sw of wp.subWorkpackages) {
        if (typeof sw.estimatedQuantity === 'number' && sw.estimatedQuantity > 0) {
            done += typeof sw.actualQuantity === 'number' ? sw.actualQuantity : 0;
            total += sw.estimatedQuantity;
        }
    }
    if (total === 0) return 0;
    return Math.round((done / total) * 100);
}

function SortableWorkpackage({ wp, projectId }: { wp: Workpackage; projectId: string }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({ id: wp.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center hover:shadow-md transition-shadow duration-200"
        >
            <div className="flex-1 cursor-grab" {...attributes} {...listeners}>
                <div className="font-medium text-gray-900 dark:text-gray-100">{wp.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    <span className="inline-flex items-center">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                        進度: {getWorkpackageProgress(wp)}%
                    </span>
                    <span className="mx-2">•</span>
                    <span className="inline-flex items-center">
                        <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                        狀態: {wp.status || ''}
                    </span>
                </div>
            </div>
            <a
                href={`/projects/${projectId}/workpackages/${wp.id}`}
                className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors duration-200 flex items-center"
            >
                檢視
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </a>
        </div>
    );
}

export default function ProjectDetailPage() {
    const { db, doc, updateDoc, Timestamp, collection } = useAuth();
    const params = useParams();
    const projectId = params?.project as string;
    const [projectDoc, loading, error] = useDocument(doc(db, "projects", projectId));
    const [usersSnapshot] = useCollection(collection(db, "users"));
    const [tab, setTab] = useState<
        "journal" | "materials" | "issues" | "info" | "calendar" | "subworkpackages" | "expenses"
    >("journal");
    const [isEditing, setIsEditing] = useState(false);

    // 使用 useMemo 取得 project 物件
    const project = useMemo(() => {
        if (!projectDoc?.exists()) return null;
        return projectDoc.data() as Project;
    }, [projectDoc]);

    // 使用 useMemo 取得 workpackages
    const workpackages = useMemo(() => {
        return project?.workpackages || [];
    }, [project]);

    // 新增感應器設置
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // 使用 useMemo 取得符合角色的使用者
    const eligibleUsers = useMemo(() => {
        if (!usersSnapshot) return {
            costControllers: [],
            supervisors: [],
            safetyOfficers: [],
            coordinators: []
        };

        const users = usersSnapshot.docs.map(doc => doc.data() as AppUser);
        
        return {
            costControllers: users.filter(user => COST_CONTROLLER_ROLES.includes(user.role as RoleKey)),
            supervisors: users.filter(user => SUPERVISOR_ROLES.includes(user.role as RoleKey)),
            safetyOfficers: users.filter(user => SAFETY_OFFICER_ROLES.includes(user.role as RoleKey)),
            coordinators: users.filter(user => COORDINATOR_ROLES.includes(user.role as RoleKey))
        };
    }, [usersSnapshot]);

    // 新增處理拖曳結束事件
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = workpackages.findIndex(wp => wp.id === active.id);
            const newIndex = workpackages.findIndex(wp => wp.id === over.id);

            const updatedWorkpackages = arrayMove(workpackages, oldIndex, newIndex);

            // 更新到 Firestore
            try {
                await updateDoc(doc(db, "projects", projectId), {
                    workpackages: updatedWorkpackages
                });
            } catch (error) {
                console.error("更新工作包順序失敗:", error);
                alert("更新順序時出錯，請重試。");
            }
        }
    };

    const handleUpdateProject = async (formData: FormData) => {
        try {
            const startDate = formData.get("startDate")?.toString();
            const estimatedEndDate = formData.get("estimatedEndDate")?.toString();

            const updates = {
                projectName: formData.get("projectName"),
                contractId: formData.get("contractId"),
                coordinator: formData.get("coordinator"),
                supervisor: formData.get("supervisor"),
                safetyOfficer: formData.get("safetyOfficer"),
                region: formData.get("region"),
                address: formData.get("address"),
                owner: formData.get("owner"),
                startDate: startDate ? Timestamp.fromDate(new Date(startDate)) : null,
                estimatedEndDate: estimatedEndDate ? Timestamp.fromDate(new Date(estimatedEndDate)) : null,
                updatedAt: Timestamp.now()
            };

            await updateDoc(doc(db, "projects", projectId), updates);
            setIsEditing(false);
        } catch (error) {
            console.error("更新專案資訊失敗:", error);
            alert("更新失敗，請重試");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/50 text-red-800 dark:text-red-200 p-4 rounded-lg">
                錯誤: {error.message}
            </div>
        );
    }
    
    if (!project) {
        return (
            <div className="bg-yellow-50 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg">
                找不到專案
            </div>
        );
    }

    const renderTabContent = () => {
        switch (tab) {
            case "info":
                return (
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                        <div className="flex justify-between items-start mb-6">
                            <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">專案資訊</h2>
                            {/* 編輯按鈕 */}
                            <button
                                onClick={() => setIsEditing(true)}
                                className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-200"
                                title="編輯"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                        </div>

                        {/* 編輯表單彈窗 */}
                        {isEditing && (
                            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl">
                                    <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">編輯專案資訊</h2>
                                    <form onSubmit={async (e) => {
                                        e.preventDefault();
                                        const formData = new FormData(e.target as HTMLFormElement);
                                        await handleUpdateProject(formData);
                                    }} className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">專案名稱</label>
                                                <input 
                                                    name="projectName" 
                                                    defaultValue={project.projectName} 
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">合約ID</label>
                                                <input 
                                                    name="contractId" 
                                                    defaultValue={project.contractId} 
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">經理</label>
                                                <select
                                                    name="coordinator"
                                                    defaultValue={project.coordinator || ""}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                                >
                                                    <option value="">請選擇</option>
                                                    {eligibleUsers.coordinators.map(user => (
                                                        <option key={user.uid} value={user.uid}>
                                                            {user.displayName} ({ROLE_NAMES[user.role as RoleKey]})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">監工</label>
                                                <select
                                                    name="supervisor"
                                                    defaultValue={project.supervisor || ""}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                                >
                                                    <option value="">請選擇</option>
                                                    {eligibleUsers.supervisors.map(user => (
                                                        <option key={user.uid} value={user.uid}>
                                                            {user.displayName} ({ROLE_NAMES[user.role as RoleKey]})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">安全人員</label>
                                                <select
                                                    name="safetyOfficer"
                                                    defaultValue={project.safetyOfficer || ""}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                                >
                                                    <option value="">請選擇</option>
                                                    {eligibleUsers.safetyOfficers.map(user => (
                                                        <option key={user.uid} value={user.uid}>
                                                            {user.displayName} ({ROLE_NAMES[user.role as RoleKey]})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">成本控制員</label>
                                                <select
                                                    name="costController"
                                                    defaultValue={project.costController || ""}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                                >
                                                    <option value="">請選擇</option>
                                                    {eligibleUsers.costControllers.map(user => (
                                                        <option key={user.uid} value={user.uid}>
                                                            {user.displayName} ({ROLE_NAMES[user.role as RoleKey]})
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">地區</label>
                                                <select
                                                    name="region"
                                                    defaultValue={project.region || ""}
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                                >
                                                    <option value="">請選擇</option>
                                                    {TaiwanCityList.map(opt => (
                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">地址</label>
                                                <input 
                                                    name="address" 
                                                    defaultValue={project.address} 
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">業主</label>
                                                <input 
                                                    name="owner" 
                                                    defaultValue={project.owner} 
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">起始日</label>
                                                <input 
                                                    type="date" 
                                                    name="startDate" 
                                                    defaultValue={project.startDate?.toDate().toISOString().split('T')[0]} 
                                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200" 
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">預估結束日</label>
                                                <input 
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
                                                onClick={() => setIsEditing(false)}
                                                className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                            >
                                                取消
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                                            >
                                                確認儲存
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">專案名稱</label>
                                    <div className="mt-1 text-gray-900 dark:text-gray-100">{project.projectName}</div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">合約ID</label>
                                    <div className="mt-1 text-gray-900 dark:text-gray-100">{project.contractId || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">經理</label>
                                    <div className="mt-1 text-gray-900 dark:text-gray-100">
                                        {project.coordinator ? 
                                            eligibleUsers.coordinators.find(u => u.uid === project.coordinator)?.displayName || '-' 
                                            : '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">監工</label>
                                    <div className="mt-1 text-gray-900 dark:text-gray-100">
                                        {project.supervisor ? 
                                            eligibleUsers.supervisors.find(u => u.uid === project.supervisor)?.displayName || '-' 
                                            : '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">安全人員</label>
                                    <div className="mt-1 text-gray-900 dark:text-gray-100">
                                        {project.safetyOfficer ? 
                                            eligibleUsers.safetyOfficers.find(u => u.uid === project.safetyOfficer)?.displayName || '-' 
                                            : '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">成本控制員</label>
                                    <div className="mt-1 text-gray-900 dark:text-gray-100">
                                        {project.costController ? 
                                            eligibleUsers.costControllers.find(u => u.uid === project.costController)?.displayName || '-' 
                                            : '-'}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">地區</label>
                                    <div className="mt-1 text-gray-900 dark:text-gray-100">{project.region || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">地址</label>
                                    <div className="mt-1 text-gray-900 dark:text-gray-100">{project.address || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">業主</label>
                                    <div className="mt-1 text-gray-900 dark:text-gray-100">{project.owner || '-'}</div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">起始日</label>
                                    <div className="mt-1 text-gray-900 dark:text-gray-100">
                                        {project.startDate ? project.startDate.toDate().toLocaleDateString() : '-'}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">預估結束日</label>
                                    <div className="mt-1 text-gray-900 dark:text-gray-100">
                                        {project.estimatedEndDate ? project.estimatedEndDate.toDate().toLocaleDateString() : '-'}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 工作包列表 */}
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">工作包</h3>
                            {workpackages && workpackages.length > 0 ? (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleDragEnd}
                                >
                                    <SortableContext
                                        items={workpackages.map(wp => wp.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-3">
                                            {workpackages.map((wp) => (
                                                <SortableWorkpackage
                                                    key={wp.id}
                                                    wp={wp}
                                                    projectId={projectId}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    尚未建立工作包
                                </div>
                            )}
                        </div>
                    </div>
                );
            case "journal":
                return <ProjectJournalPage />;
            case "calendar":
                return <ProjectCalendarPage />;
            case "issues":
                return <ProjectIssuesPage />;
            case "subworkpackages":
                return <SubWorkpackageSortingPage />;
            case "materials":
                return <ProjectMaterialsPage />;
            case "expenses":
                return <ProjectExpensesPage />;
            default:
                return null;
        }
    };

    return (
        <main className="max-w-4xl mx-auto">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">{project.projectName}</h1>
                <div className="text-gray-600 dark:text-gray-300">狀態: {project.status}</div>
            </div>

            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200 dark:border-gray-700">
                <nav className="flex flex-wrap gap-1 -mb-px">
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                            tab === "journal"
                            ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                        }`}
                        onClick={() => setTab("journal")}
                    >
                        工作日誌
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                            tab === "calendar"
                            ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                        }`}
                        onClick={() => setTab("calendar")}
                    >
                        行程
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                            tab === "issues"
                            ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                        }`}
                        onClick={() => setTab("issues")}
                    >
                        問題追蹤
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                            tab === "subworkpackages"
                            ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                        }`}
                        onClick={() => setTab("subworkpackages")}
                    >
                        子工作包排序
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                            tab === "materials"
                            ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                        }`}
                        onClick={() => setTab("materials")}
                    >
                        材料管理
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                            tab === "expenses"
                            ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                        }`}
                        onClick={() => setTab("expenses")}
                    >
                        費用管理
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors duration-200 ${
                            tab === "info"
                            ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                        }`}
                        onClick={() => setTab("info")}
                    >
                        專案資訊
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {renderTabContent()}
        </main>
    );
}
