/**
 * 專案列表頁面
 * 
 * 顯示所有專案的列表，提供以下功能：
 * - 專案搜尋和篩選
 * - 專案狀態追蹤
 * - 日期格式化顯示
 * - 專案進度顯示
 * - 專案管理功能
 */

"use client";

import { useState } from "react";
import { useAuth } from '@/hooks/useAuth';
import { useFilteredProjects } from "./useFilteredProjects";
import { ProjectsTable } from "./components/ProjectsTable";
import { DataLoader } from "@/components/common/DataLoader";

export default function ProjectsPage() {
    const { loading: authLoading } = useAuth();
    const [search, setSearch] = useState("");
    const { projects, loading, error } = useFilteredProjects(search);

    return (
        <main className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">專案列表</h1>
                    <div className="relative">
                        <input
                            type="text"
                            className="w-full md:w-80 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                            placeholder="搜尋專案名稱或合約ID"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            🔍
                        </span>
                    </div>
                </div>

                <DataLoader
                    loading={loading}
                    authLoading={authLoading}
                    error={error ?? undefined}
                    data={projects}
                >
                    {(loadedProjects) => <ProjectsTable projects={loadedProjects} />}
                </DataLoader>
            </div>
        </main>
    );
}