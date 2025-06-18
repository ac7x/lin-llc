/**
 * 合約詳細頁面
 * 
 * 顯示單一合約的詳細資訊，提供以下功能：
 * - 合約資訊編輯
 * - 合約條款管理
 * - 合約狀態追蹤
 * - 合約文件管理
 * - PDF 匯出
 */

"use client";

import { useParams, useRouter } from "next/navigation";
import { useDocument } from "react-firebase-hooks/firestore";
import { useAuth } from '@/app/signin/hooks/useAuth';
import { db, doc } from '@/lib/firebase-client';

export default function ContractDetailPage() {
    const { loading: authLoading } = useAuth();
    const params = useParams();
    const router = useRouter();
    const contractId = params?.contract as string;
    const [contractDoc, loading, error] = useDocument(contractId ? doc(db, "finance", "default", "contracts", contractId) : null);

    if (authLoading || loading) {
        return <main className="max-w-2xl mx-auto px-4 py-8 bg-white dark:bg-gray-900"><div>載入中...</div></main>;
    }
    if (error) {
        return <main className="max-w-2xl mx-auto px-4 py-8 bg-white dark:bg-gray-900"><div className="text-red-500">{String(error)}</div></main>;
    }
    if (!contractDoc || !contractDoc.exists()) {
        return <main className="max-w-2xl mx-auto px-4 py-8 bg-white dark:bg-gray-900"><div className="text-gray-400 dark:text-gray-500">找不到合約</div></main>;
    }

    const data = contractDoc.data();
    const createdAt = data.createdAt?.toDate();
    const contractItems = Array.isArray(data.contractItems) ? data.contractItems : [];

    return (
        <main className="max-w-2xl mx-auto px-4 py-8 bg-white dark:bg-gray-900">
            <h1 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">合約詳情</h1>
            <div className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                此合約可能由訂單或估價單產生，來源資訊如下。
            </div>
            <div className="mb-4 space-y-2">
                <div><span className="font-bold">合約名稱：</span> {data.contractName || data.contractId || contractId}</div>
                <div><span className="font-bold">合約ID：</span> {data.contractId || contractId}</div>
                <div><span className="font-bold">合約金額：</span> {data.contractPrice ?? '-'}</div>
                <div><span className="font-bold">建立日期：</span> {createdAt ? createdAt.toLocaleDateString() : "-"}</div>
                <div><span className="font-bold">客戶名稱：</span> {data.clientName ?? '-'}</div>
                <div><span className="font-bold">聯絡人：</span> {data.clientContact ?? '-'}</div>
                <div><span className="font-bold">電話：</span> {data.clientPhone ?? '-'}</div>
                <div><span className="font-bold">Email：</span> {data.clientEmail ?? '-'}</div>
                <div>
                    <span className="font-bold">來源：</span>
                    {data.sourceType === "order" && data.sourceId ? (
                        <span>
                            訂單
                            <button
                                className="ml-2 text-blue-600 hover:underline dark:text-blue-400"
                                onClick={() => router.push(`/orders/${data.sourceId}`)}
                            >
                                {data.sourceId}
                            </button>
                        </span>
                    ) : data.sourceType === "quote" && data.sourceId ? (
                        <span>
                            估價單
                            <button
                                className="ml-2 text-green-600 hover:underline dark:text-green-400"
                                onClick={() => router.push(`/quotes/${data.sourceId}`)}
                            >
                                {data.sourceId}
                            </button>
                        </span>
                    ) : (
                        <span>-</span>
                    )}
                </div>
            </div>
            {/* 合約項目表格 */}
            {contractItems.length > 0 && (
                <div className="mb-4">
                    <div className="font-bold mb-2">合約項目</div>
                    <table className="w-full border text-sm mb-2 bg-white dark:bg-gray-900">
                        <thead>
                            <tr className="bg-gray-100 dark:bg-gray-800">
                                <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">項目ID</th>
                                <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">單價</th>
                                <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">數量</th>
                                <th className="border px-2 py-1 border-gray-300 dark:border-gray-700">權重</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contractItems.map((item, idx) => (
                                <tr key={item.contractItemId || idx} className="bg-white dark:bg-gray-900">
                                    <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">{item.contractItemId ?? '-'}</td>
                                    <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">{item.contractItemPrice ?? '-'}</td>
                                    <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">{item.contractItemQuantity ?? '-'}</td>
                                    <td className="border px-2 py-1 border-gray-300 dark:border-gray-700">{item.contractItemWeight !== undefined ? item.contractItemWeight : '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {/* 合約條款內容 */}
            <div className="mb-4">
                <span className="font-bold">合約條款：</span>
                <pre className="bg-gray-100 dark:bg-gray-800 rounded p-2 mt-1 whitespace-pre-wrap border border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-200">{data.contractContent || "（無內容）"}</pre>
            </div>
            <button className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 px-4 py-2 rounded hover:bg-gray-300 dark:hover:bg-gray-600" onClick={() => router.push("/contracts")}>返回列表</button>
        </main>
    );
}
