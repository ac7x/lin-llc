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
import { useDocument } from "react-firebase-hooks/firestore";
import { useMemo } from "react";
import ProjectJournalPage from "./project-journal/page";
import ProjectMaterialsPage from "./project-materials/page";
import ProjectIssuesPage from "./project-issues/page";
import SubWorkpackageSortingPage from "./workpackages/subworkpackages/page";
import ProjectCalendarPage from "./project-calendar/page";
import ProjectExpensesPage from "./project-expenses/page";
import ProjectInfoPage from "./components/ProjectInfoPage";
import { doc, db } from '@/lib/firebase-client';
import { useAuth } from '@/hooks/useAuth';
import type { Project } from "@/types/project";
import Tabs from "@/components/common/Tabs";
import { DataLoader } from "@/components/common/DataLoader";

export default function ProjectDetailPage() {
    const { loading: authLoading } = useAuth();
    const params = useParams();
    const projectId = params?.project as string;
    const [projectDoc, loading, error] = useDocument(doc(db, "projects", projectId));

    const project = useMemo(() => {
        if (!projectDoc?.exists()) return null;
        return projectDoc.data() as Project;
    }, [projectDoc]);

    const projectNotFound = (
        <div className="bg-yellow-50 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg">
            找不到專案
        </div>
    );

    return (
        <DataLoader
            loading={loading}
            authLoading={authLoading}
            error={error ?? undefined}
            data={project}
            emptyComponent={projectNotFound}
        >
            {(loadedProject) => {
                const tabs = [
                    { key: "journal", label: "工作日誌", content: <ProjectJournalPage /> },
                    { key: "calendar", label: "行程", content: <ProjectCalendarPage /> },
                    { key: "issues", label: "問題追蹤", content: <ProjectIssuesPage /> },
                    { key: "subworkpackages", label: "子工作包排序", content: <SubWorkpackageSortingPage /> },
                    { key: "materials", label: "材料管理", content: <ProjectMaterialsPage /> },
                    { key: "expenses", label: "費用管理", content: <ProjectExpensesPage /> },
                    { key: "info", label: "專案資訊", content: <ProjectInfoPage project={loadedProject} projectId={projectId} /> },
                ];

                return (
                    <main className="max-w-4xl mx-auto">
                        <div className="mb-6">
                            <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">{loadedProject.projectName}</h1>
                            <div className="text-gray-600 dark:text-gray-300">狀態: {loadedProject.status}</div>
                        </div>

                        <Tabs tabs={tabs} initialTab="journal" />
                    </main>
                );
            }}
        </DataLoader>
    );
} 