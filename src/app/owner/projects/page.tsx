"use client";

import Link from "next/link";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { useMemo, useState } from "react";

export default function ProjectsPage() {
    const [projectsSnapshot, loading, error] = useCollection(collection(db, "projects"));
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
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null),
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
        <main className="max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">專案列表</h1>
            <div className="mb-4 flex">
                <input
                    type="text"
                    className="border rounded px-2 py-1 w-full"
                    placeholder="搜尋專案名稱或合約ID"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
            </div>
            <table className="w-full border text-sm">
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
                    ) : error ? (
                        <tr><td colSpan={6} className="text-center text-red-500 py-4">{String(error)}</td></tr>
                    ) : rows.length > 0 ? (
                        rows.map(row => (
                            <tr key={row.projectId}>
                                <td className="border px-2 py-1 text-center">{row.idx}</td>
                                <td className="border px-2 py-1">{row.projectName}</td>
                                <td className="border px-2 py-1">{row.contractId}</td>
                                <td className="border px-2 py-1">{row.createdAt ? row.createdAt.toLocaleDateString() : "-"}</td>
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