"use client";

import { useCollection } from "react-firebase-hooks/firestore";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { useState, useMemo } from "react";

// 定義合約列型別
interface ContractRow {
    idx: number;
    id: string;
    name: string;
    createdAt: Date | null;
    raw: Record<string, unknown>;
}

export default function ImportProjectPage() {
    const [contractsSnapshot] = useCollection(collection(db, "finance", "default", "contracts"));
    const [importingId, setImportingId] = useState<string | null>(null);
    const [message, setMessage] = useState<string>("");

    const contractRows: ContractRow[] = useMemo(() => {
        if (!contractsSnapshot) return [];
        return contractsSnapshot.docs.map((doc, idx) => {
            const data = doc.data();
            return {
                idx: idx + 1,
                id: (data.contractId as string) || doc.id,
                name: (data.contractName as string) || (data.contractId as string) || doc.id,
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null),
                raw: data,
            };
        });
    }, [contractsSnapshot]);

    // 匯入合約建立專案
    const handleImport = async (row: ContractRow) => {
        setImportingId(row.id);
        setMessage("");
        try {
            const projectData = {
                projectName: row.name,
                contractId: row.id,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                status: "新建立",
                zones: [
                    {
                        zoneId: "default",
                        zoneName: "默認分區",
                        desc: "此為自動建立的默認分區",
                        order: 0,
                        createdAt: new Date(),
                    },
                ],
            };
            await addDoc(collection(db, "projects"), projectData);
            setMessage(`已成功由合約建立專案，合約ID: ${row.id}`);
        } catch (err) {
            setMessage("建立失敗: " + (err instanceof Error ? err.message : String(err)));
        } finally {
            setImportingId(null);
        }
    };

    return (
        <main className="max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-6">從合約建立專案</h1>
            {message && <div className="mb-4 text-green-600">{message}</div>}
            <table className="w-full border text-sm">
                <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="border px-2 py-1">序號</th>
                        <th className="border px-2 py-1">合約名稱</th>
                        <th className="border px-2 py-1">建立日期</th>
                        <th className="border px-2 py-1">操作</th>
                    </tr>
                </thead>
                <tbody>
                    {contractRows.length === 0 ? (
                        <tr><td colSpan={4} className="text-center text-gray-400 py-4">尚無合約</td></tr>
                    ) : (
                        contractRows.map(row => (
                            <tr key={row.id}>
                                <td className="border px-2 py-1 text-center">{row.idx}</td>
                                <td className="border px-2 py-1">{row.name}</td>
                                <td className="border px-2 py-1">{row.createdAt ? row.createdAt.toLocaleDateString() : '-'}</td>
                                <td className="border px-2 py-1">
                                    <button
                                        className="bg-blue-500 text-white px-3 py-1 rounded disabled:opacity-50"
                                        disabled={!!importingId}
                                        onClick={() => handleImport(row)}
                                    >
                                        {importingId === row.id ? '建立中...' : '建立專案'}
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </main>
    );
}