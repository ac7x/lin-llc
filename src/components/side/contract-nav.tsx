// src/modules/contract/interfaces/navigation/side/contract-nav.tsx

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFirebase } from "@/hooks/useFirebase";
import { useCollection } from "react-firebase-hooks/firestore";

export default function ContractNav() {
    const { db, collection, doc, setDoc, deleteDoc } = useFirebase();
    const pathname = usePathname();
    const navs = [
        { label: "合約總表", href: "/owner/contracts" },
        { label: "生成合約", href: "/owner/contracts/create" },
    ];
    const [contractsSnapshot, loading, error] = useCollection(collection(db, "finance", "default", "contracts"));
    return (
        <nav className="w-48 min-h-screen border-r bg-gray-50 dark:bg-gray-900 p-4">
            <h2 className="text-lg font-bold mb-4 text-center">合約管理</h2>
            <ul className="space-y-2">
                {/* 合約總表按鈕 */}
                <li key={navs[0].href}>
                    <Link
                        href={navs[0].href}
                        className={`block px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 ${pathname === navs[0].href ? "bg-blue-200 dark:bg-gray-700 font-bold" : ""}`}
                    >
                        {navs[0].label}
                    </Link>
                </li>
                {/* 動態合約列表 */}
                {loading ? (
                    <li className="text-gray-400 px-3 py-2">載入中...</li>
                ) : error ? (
                    <li className="text-red-500 px-3 py-2">{String(error)}</li>
                ) : contractsSnapshot && contractsSnapshot.docs.length > 0 ? (
                    contractsSnapshot.docs.map(contract => {
                        const data = contract.data();
                        const contractHref = `/owner/contracts/${data.contractId || contract.id}`;
                        return (
                            <li key={data.contractId || contract.id} className="flex items-center group">
                                <Link
                                    href={contractHref}
                                    className={`flex-1 block px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 ${pathname === contractHref ? "bg-blue-200 dark:bg-gray-700 font-bold" : ""}`}
                                >
                                    {data.contractName || data.contractId || contract.id}
                                </Link>
                                <button
                                    title="封存合約"
                                    className="ml-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                    onClick={async (e) => {
                                        e.preventDefault();
                                        if (!window.confirm('確定要封存此合約？')) return;
                                        const contractData = { ...data, archivedAt: new Date() };
                                        const userId = data.ownerId || "default";
                                        await setDoc(doc(db, "archived", userId, "contracts", data.contractId || contract.id), contractData);
                                        await deleteDoc(doc(db, "contracts", data.contractId || contract.id));
                                    }}
                                >
                                    🗑️
                                </button>
                            </li>
                        );
                    })
                ) : null}
                {/* 匯入合約按鈕 */}
                <li key={navs[1].href}>
                    <Link
                        href={navs[1].href}
                        className={`block px-3 py-2 rounded hover:bg-blue-100 dark:hover:bg-gray-800 ${pathname === navs[1].href ? "bg-blue-200 dark:bg-gray-700 font-bold" : ""}`}
                    >
                        {navs[1].label}
                    </Link>
                </li>
            </ul>
        </nav>
    );
}
