"use client";

import Link from "next/link";
import { db, collection } from "@/lib/firebase-client";
import { useCollection } from "react-firebase-hooks/firestore";
import { useMemo, useState } from "react";

export default function ArchivedProjectsPage() {
    // 修改為從 archived/default/projects 集合讀取
    const [projectsSnapshot, loading] = useCollection(
        collection(db, "archived", "default", "projects")
    );
    const [search, setSearch] = useState("");

    const rows = useMemo(() => {
        if (!projectsSnapshot) return [];
        let arr = projectsSnapshot.docs
            .map((doc, idx) => {
                const data = doc.data();
                return {
                    idx: idx + 1,
                    projectId: doc.id,
                    projectName: data.projectName || doc.id,
                    contractId: data.contractId,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null),
                    archivedAt: data.archivedAt?.toDate ? data.archivedAt.toDate() : (data.archivedAt ? new Date(data.archivedAt) : null),
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
        <main className="max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6 dark:text-gray-100">封存專案列表</h1>
            <div className="mb-4 flex">
                <input
                    type="text"
                    className="border rounded px-2 py-1 w-full dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700"
                    placeholder="搜尋專案名稱或合約ID"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <table className="w-full border text-sm dark:border-gray-700">
                <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100">序號</th>
                        <th className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100">專案名稱</th>
                        <th className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100">合約ID</th>
                        <th className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100">建立日期</th>
                        <th className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100">封存日期</th>
                        <th className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan={6} className="text-center py-4 dark:text-gray-300">載入中...</td></tr>
                    ) : rows.length > 0 ? (
                        rows.map(row => (
                            <tr key={row.projectId}>
                                <td className="border px-2 py-1 text-center dark:border-gray-700 dark:text-gray-100">{row.idx}</td>
                                <td className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100">{row.projectName}</td>
                                <td className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100">{row.contractId}</td>
                                <td className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100">{row.createdAt ? row.createdAt.toLocaleDateString() : "-"}</td>
                                <td className="border px-2 py-1 dark:border-gray-700 dark:text-gray-100">{row.archivedAt ? row.archivedAt.toLocaleDateString() : "-"}</td>
                                <td className="border px-2 py-1 dark:border-gray-700">
                                    <Link href={`/owner/projects/${row.projectId}`} className="text-blue-600 hover:underline dark:text-blue-400">查看</Link>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr><td colSpan={6} className="text-center text-gray-400 py-4 dark:text-gray-500">尚無封存專案</td></tr>
                    )}
                </tbody>
            </table>
        </main>
    );
}
