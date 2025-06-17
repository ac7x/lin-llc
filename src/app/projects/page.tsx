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

import Link from "next/link";
import { useAuth } from '@/hooks/useAuth';
import { useCollection } from "react-firebase-hooks/firestore";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import type { Timestamp } from "firebase/firestore";

// 嚴格型別：只接受 Timestamp | null | undefined
type TimestampInput = Timestamp | null | undefined;

/**
 * 將 Firestore Timestamp 轉為 yyyy-MM-dd 格式字串
 */
const formatDate = (timestamp: TimestampInput, formatStr = "yyyy-MM-dd"): string => {
    if (!timestamp) return "";
    try {
        return format(timestamp.toDate(), formatStr, { locale: zhTW });
    } catch {
        return "";
    }
};

export default function ProjectsPage() {
    const { db, collection } = useAuth();
    const [projectsSnapshot, loading] = useCollection(collection(db, "projects"));
    const [search, setSearch] = useState("");

    const rows = useMemo(() => {
        if (!projectsSnapshot) return [];
        let arr = projectsSnapshot.docs.map((doc, idx) => {
            const data = doc.data();
            return {
                idx: idx + 1,
                projectId: doc.id,
                projectName: data.projectName || doc.id,
                contractId: data.contractId,
                createdAt: formatDate(data.createdAt),
                status: data.status,
            };
        });
        if (search.trim()) {
            const s = search.trim().toLowerCase();
            arr = arr.filter(
                r =>
                    String(r.projectName).toLowerCase().includes(s) ||
                    String(r.contractId).toLowerCase().includes(s)
            );
        }
        return arr;
    }, [projectsSnapshot, search]);

    // 如果正在載入專案資料，顯示載入中
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

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

                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-900">
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">序號</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">專案名稱</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">合約ID</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">建立日期</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">狀態</th>
                                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : rows.length > 0 ? (
                                rows.map(row => (
                                    <tr key={row.projectId} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200">
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{row.idx}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{row.projectName}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{row.contractId}</td>
                                        <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{row.createdAt || "-"}</td>
                                        <td className="px-4 py-3 text-sm">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                row.status === "進行中" ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" :
                                                row.status === "已完成" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                                                row.status === "已暫停" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                                                "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
                                            }`}>
                                                {row.status ?? '-'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm">
                                            <Link 
                                                href={`/projects/${row.projectId}`}
                                                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                                            >
                                                查看
                                                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                </svg>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                        尚無專案
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
}