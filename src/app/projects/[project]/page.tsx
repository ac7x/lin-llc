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
import ProjectJournalPage from "./project-journal/page";
import ProjectMaterialsPage from "./project-materials/page";
import ProjectIssuesPage from "./project-issues/page";
import SubWorkpackageSortingPage from "./workpackages/subworkpackages/page";
import ProjectCalendarPage from "./project-calendar/page";
import ProjectExpensesPage from "./project-expenses/page";
import ProjectInfoPage from "./components/ProjectInfoPage";
import { type RoleKey } from "@/constants/roles";
import type { AppUser } from "@/types/auth";
import { collection, doc, db } from '@/lib/firebase-client';
import { useAuth } from '@/hooks/useAuth';
import type { Project } from "@/types/project";

// 角色常數
const COST_CONTROLLER_ROLES: RoleKey[] = ['finance'];
const SUPERVISOR_ROLES: RoleKey[] = ['foreman'];
const SAFETY_OFFICER_ROLES: RoleKey[] = ['safety'];
const COORDINATOR_ROLES: RoleKey[] = ['manager'];

export default function ProjectDetailPage() {
    const { loading: authLoading } = useAuth();
    const params = useParams();
    const projectId = params?.project as string;
    const [projectDoc, loading, error] = useDocument(doc(db, "projects", projectId));
    const [usersSnapshot] = useCollection(collection(db, "members"));
    const [tab, setTab] = useState<
        "journal" | "materials" | "issues" | "info" | "calendar" | "subworkpackages" | "expenses"
    >("journal");

    // 使用 useMemo 取得 project 物件
    const project = useMemo(() => {
        if (!projectDoc?.exists()) return null;
        return projectDoc.data() as Project;
    }, [projectDoc]);

    // 使用 useMemo 取得符合角色的使用者
    const eligibleUsers = useMemo(() => {
        if (!usersSnapshot) return {
            costControllers: [],
            supervisors: [],
            safetyOfficers: [],
            coordinators: []
        };

        const users = usersSnapshot.docs.map(doc => doc.data() as AppUser);
        
        // 使用 Set 來追蹤已分配的使用者，避免重複
        const assignedUsers = new Set<string>();
        
        const costControllers = users.filter(user => {
            const hasRole = COST_CONTROLLER_ROLES.includes((user.roles?.[0] || user.currentRole) as RoleKey);
            if (hasRole && !assignedUsers.has(user.uid)) {
                assignedUsers.add(user.uid);
                return true;
            }
            return false;
        });
        
        const supervisors = users.filter(user => {
            const hasRole = SUPERVISOR_ROLES.includes((user.roles?.[0] || user.currentRole) as RoleKey);
            if (hasRole && !assignedUsers.has(user.uid)) {
                assignedUsers.add(user.uid);
                return true;
            }
            return false;
        });
        
        const safetyOfficers = users.filter(user => {
            const hasRole = SAFETY_OFFICER_ROLES.includes((user.roles?.[0] || user.currentRole) as RoleKey);
            if (hasRole && !assignedUsers.has(user.uid)) {
                assignedUsers.add(user.uid);
                return true;
            }
            return false;
        });
        
        const coordinators = users.filter(user => {
            const hasRole = COORDINATOR_ROLES.includes((user.roles?.[0] || user.currentRole) as RoleKey);
            if (hasRole && !assignedUsers.has(user.uid)) {
                assignedUsers.add(user.uid);
                return true;
            }
            return false;
        });
        
        return {
            costControllers,
            supervisors,
            safetyOfficers,
            coordinators
        };
    }, [usersSnapshot]);

    if (authLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

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
                    <ProjectInfoPage
                        project={project}
                        projectId={projectId}
                        eligibleUsers={eligibleUsers}
                    />
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
                        key="journal"
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
                        key="calendar"
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
                        key="issues"
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
                        key="subworkpackages"
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
                        key="materials"
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
                        key="expenses"
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
                        key="info"
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