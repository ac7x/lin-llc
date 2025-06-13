"use client";

import { useState, useMemo } from "react";
import { Timestamp } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { nanoid } from "nanoid";
import { Workpackage } from "@/types/project";
import { ContractItem } from "@/types/finance";
import { db } from "@/lib/firebase-client";
import { collection, addDoc } from "firebase/firestore";

// 定義合約列型別
interface ContractRow {
    idx: number;
    id: string;
    name: string;
    createdAt: Date | null;
    raw: Record<string, unknown>;
}

export default function ImportProjectPage() {
    // 取得所有已建立專案的 contractId 清單，避免重複建立
    const [projectsSnapshot] = useCollection(collection(db, "projects"));

    // 取得已建立專案的 contractId Set
    const existingContractIds = useMemo(() => {
        if (!projectsSnapshot) return new Set<string>();
        return new Set(
            projectsSnapshot.docs
                .map(doc => doc.data()?.contractId)
                .filter((id): id is string => !!id)
        );
    }, [projectsSnapshot]);

    const [contractsSnapshot] = useCollection(collection(db, "finance", "default", "contracts"));
    const [importingId, setImportingId] = useState<string | null>(null);
    const [message, setMessage] = useState<string>("");

    // 僅顯示尚未建立專案的合約
    const contractRows: ContractRow[] = useMemo(() => {
        if (!contractsSnapshot) return [];
        return contractsSnapshot.docs
            .filter(doc => {
                const data = doc.data();
                const contractId = (data.contractId as string) || doc.id;
                return !existingContractIds.has(contractId);
            })
            .map((doc, idx) => {
                const data = doc.data();
                return {
                    idx: idx + 1,
                    id: (data.contractId as string) || doc.id,
                    name: (data.contractName as string) || (data.contractId as string) || doc.id,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null),
                    raw: data,
                };
            });
    }, [contractsSnapshot, existingContractIds]);    // 將合約項目轉換為工作包
    const convertContractItemsToWorkpackages = (contractItems: ContractItem[]): Workpackage[] => {
        if (!contractItems || !Array.isArray(contractItems) || contractItems.length === 0) {
            return [];
        }

        // 將合約項目轉換為工作包
        return contractItems.map(item => {
            const id = nanoid(8); // 使用 nanoid 生成唯一 ID

            // 注意：若 contractItemPrice 已為總價，budget 直接取用
            // 若 contractItemPrice 為單價，請改為 item.contractItemPrice * item.contractItemQuantity
            const workpackage: Workpackage = {
                id,
                name: String(item.contractItemId),
                description: `合約項目 ${item.contractItemId}`,
                status: "待開始",
                progress: 0,
                createdAt: Timestamp.now(),
                budget: item.contractItemPrice, // 只取 contractItemPrice，避免重複計算
                category: "合約項目",
                priority: "medium",
                subWorkpackages: []
            };

            return workpackage;
        });
    };

    // 匯入合約建立專案
    const handleImport = async (row: ContractRow) => {
        setImportingId(row.id);
        setMessage("");
        try {
            // 取得合約項目並轉換為工作包
            const contractItems = row.raw.contractItems as ContractItem[] || [];
            const workpackages = convertContractItemsToWorkpackages(contractItems);

            // 預設一個基本的分解資料，包含必要的節點欄位與可選欄位
            const decomposition = {
                nodes: [
                    {
                        id: "root",                // 節點唯一識別碼
                        type: "custom",            // 可選欄位：節點類型
                        position: { x: 0, y: 50 },// 節點座標，x=0 貼齊左邊
                        data: { label: row.name || "專案分解" }, // 自訂資料型別，至少含 label
                        // ...其他可選欄位如 width, height 等...
                    },
                ],
                edges: [],
            };
            const projectData = {
                projectName: row.name,
                contractId: row.id,
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                status: "新建立",
                decomposition, // 專案分解資料
                workpackages, // 將合約項目轉換後的工作包列表
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
        <main className="max-w-2xl mx-auto px-4 py-8 bg-white dark:bg-gray-800 text-black dark:text-gray-100 rounded shadow">
            <h1 className="text-2xl font-bold mb-6">從合約建立專案</h1>
            {message && <div className="mb-4 text-green-600">{message}</div>}
            <table className="w-full border text-sm bg-white dark:bg-gray-900 text-black dark:text-gray-100">
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