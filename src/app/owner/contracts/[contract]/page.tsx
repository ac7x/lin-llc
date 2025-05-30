"use client";

import { useParams, useRouter } from "next/navigation";
import { useDocument } from "react-firebase-hooks/firestore";
import { doc } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

export default function ContractDetailPage() {
    const params = useParams();
    const router = useRouter();
    const contractId = params?.contract as string;
    const [contractDoc, loading, error] = useDocument(contractId ? doc(db, "contracts", contractId) : null);

    if (loading) {
        return <main className="max-w-xl mx-auto px-4 py-8"><div>載入中...</div></main>;
    }
    if (error) {
        return <main className="max-w-xl mx-auto px-4 py-8"><div className="text-red-500">{String(error)}</div></main>;
    }
    if (!contractDoc || !contractDoc.exists()) {
        return <main className="max-w-xl mx-auto px-4 py-8"><div className="text-gray-400">找不到合約</div></main>;
    }

    const data = contractDoc.data();
    const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() : (data.createdAt ? new Date(data.createdAt) : null);

    return (
        <main className="max-w-xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">合約詳情</h1>
            <div className="mb-4">
                <div><span className="font-bold">合約名稱：</span> {data.contractName || data.contractId || contractId}</div>
                <div><span className="font-bold">合約ID：</span> {data.contractId || contractId}</div>
                <div><span className="font-bold">建立日期：</span> {createdAt ? createdAt.toLocaleDateString() : "-"}</div>
                <div>
                    <span className="font-bold">來源：</span>
                    {data.sourceType === "order" && data.sourceId ? (
                        <span>
                            訂單
                            <button
                                className="ml-2 text-blue-600 underline"
                                onClick={() => router.push(`/owner/orders/${data.sourceId}`)}
                            >
                                {data.sourceId}
                            </button>
                        </span>
                    ) : data.sourceType === "quote" && data.sourceId ? (
                        <span>
                            估價單
                            <button
                                className="ml-2 text-green-600 underline"
                                onClick={() => router.push(`/owner/quotes/${data.sourceId}`)}
                            >
                                {data.sourceId}
                            </button>
                        </span>
                    ) : (
                        <span>-</span>
                    )}
                </div>
            </div>
            {/* 其他合約內容顯示 */}
            <div className="mb-4">
                <span className="font-bold">合約內容：</span>
                <pre className="bg-gray-100 dark:bg-neutral-800 rounded p-2 mt-1 whitespace-pre-wrap border border-gray-200 dark:border-neutral-700">{data.contractContent || "（無內容）"}</pre>
            </div>
            <button className="bg-gray-300 px-4 py-2 rounded" onClick={() => router.push("/owner/contracts")}>返回列表</button>
        </main>
    );
}
