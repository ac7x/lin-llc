"use client";

import { useState } from "react";
import { useAuth } from '@/hooks/useAuth';

export default function ArchivedPage() {
    const { db, collection, getDocs, deleteDoc, doc } = useAuth();
    const [clickCount, setClickCount] = useState(0);
    const [lastClickTime, setLastClickTime] = useState<number>(0);

    // 連點5次觸發移除所有封存資料
    const handleRemoveAll = async () => {
        const now = Date.now();
        if (now - lastClickTime > 2000) {
            setClickCount(1);
        } else {
            setClickCount(prev => prev + 1);
        }
        setLastClickTime(now);
        if (clickCount + 1 >= 5) {
            // 直接刪除 archived/default 下所有子集合的所有文件
            try {
                const subCollections = ["orders", "quotes", "contracts", "projects"];
                for (const sub of subCollections) {
                    const colRef = collection(db, `archived/default/${sub}`);
                    const snap = await getDocs(colRef);
                    for (const docSnap of snap.docs) {
                        await deleteDoc(docSnap.ref);
                    }
                }
                // 最後刪除 archived/default 文件本身（雖然 Firestore 沒有直接刪除 collection 的 API，只能刪除文件）
                await deleteDoc(doc(db, "archived", "default"));
                setClickCount(0);
            } catch (err) {
                alert("刪除失敗: " + (err instanceof Error ? err.message : String(err)));
            }
        }
    };

    return (
        <main className="flex items-center justify-center h-full w-full">
            <button
                className="text-gray-400 text-lg bg-transparent border-none cursor-pointer focus:outline-none dark:text-gray-500"
                onClick={handleRemoveAll}
            >
                請從左側選擇要瀏覽的封存資料
            </button>
        </main>
    );
}
