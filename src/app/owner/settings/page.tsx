"use client";

import { useState, useEffect } from 'react';
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function OwnerSettingsPage() {
    const [archiveRetentionDays, setArchiveRetentionDaysState] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    // 載入現有設定
    useEffect(() => {
        async function fetchRetentionDays() {
            const docRef = doc(db, 'settings', 'archive');
            const snapshot = await getDoc(docRef);
            if (snapshot.exists()) {
                const data = snapshot.data();
                setArchiveRetentionDaysState(typeof data.retentionDays === 'number' ? data.retentionDays : null);
            } else {
                setArchiveRetentionDaysState(null);
            }
            setLoading(false);
        }
        fetchRetentionDays();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (archiveRetentionDays && archiveRetentionDays > 0) {
            await setDoc(doc(db, 'settings', 'archive'), { retentionDays: archiveRetentionDays }, { merge: true });
            alert(`已設定封存自動刪除天數為 ${archiveRetentionDays} 天`);
        }
    };

    if (loading) return <main className="p-6">載入中...</main>;

    return (
        <main className="p-6">
            <h1 className="text-2xl font-bold mb-4">設定</h1>
            <p className="mb-6">這是業主的設定頁面。</p>
            <form onSubmit={handleSubmit} className="max-w-md space-y-4">
                <div>
                    <label className="block font-medium mb-1">
                        封存自動刪除天數
                    </label>
                    <input
                        type="number"
                        min={1}
                        className="border rounded px-2 py-1 w-32"
                        value={archiveRetentionDays ?? ''}
                        onChange={e => setArchiveRetentionDaysState(Number(e.target.value))}
                    />
                    <span className="ml-2 text-gray-500">天</span>
                </div>
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
                >
                    儲存
                </button>
            </form>
        </main>
    );
}
