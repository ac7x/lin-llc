"use client";

import Link from "next/link";
import { db, collection } from "@/lib/firebase-client";
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

    return (
        <main className="max-w-2xl mx-auto px-4 py-8 bg-white dark:bg-gray-800 text-black dark:text-gray-100 rounded shadow">
            <h1 className="text-2xl font-bold mb-6">專案列表</h1>
            <div className="mb-4 flex">
                <input
                    type="text"
                    className="border rounded px-2 py-1 w-full bg-white dark:bg-gray-900 text-black dark:text-gray-100 border-gray-300 dark:border-gray-700"
                    placeholder="搜尋專案名稱或合約ID"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <table className="w-full border text-sm bg-white dark:bg-gray-900 text-black dark:text-gray-100">
                <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="border px-2 py-1">序號</th>
                        <th className="border px-2 py-1">專案名稱</th>
                        <th className="border px-2 py-1">合約ID</th>
                        <th className="border px-2 py-1">建立日期</th>
                        <th className="border px-2 py-1">狀態</th>
                        <th className="border px-2 py-1">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={6} className="text-center py-4">載入中...</td></tr>
                    ) : rows.length > 0 ? (
                        rows.map(row => (
                            <tr key={row.projectId}>
                                <td className="border px-2 py-1 text-center">{row.idx}</td>
                                <td className="border px-2 py-1">{row.projectName}</td>
                                <td className="border px-2 py-1">{row.contractId}</td>
                                <td className="border px-2 py-1">{row.createdAt || "-"}</td>
                                <td className="border px-2 py-1">{row.status ?? '-'}</td>
                                <td className="border px-2 py-1">
                                    <Link href={`/owner/projects/${row.projectId}`} className="text-blue-600 hover:underline">查看</Link>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan={6} className="text-center text-gray-400 py-4">尚無專案</td></tr>
                    )}
                </tbody>
            </table>
        </main>
    );
}