/**
 * 封存管理頁面
 * 
 * 提供系統封存資料的管理功能，包含：
 * - 封存資料瀏覽
 * - 封存資料還原
 * - 封存資料刪除
 * - 封存設定管理
 * - 封存歷史記錄
 */

"use client";

import { useState, useEffect } from "react";
import { useAuth } from '@/hooks/useAuth';

// 定義導航權限項目的型別
interface NavPermissionItem {
    id: string;
    defaultRoles: string[];
}

export default function ArchivedPage() {
    const { db, collection, getDocs, deleteDoc, doc, getDoc } = useAuth();
    const { user, userRoles, loading: authLoading } = useAuth();
    const [clickCount, setClickCount] = useState(0);
    const [lastClickTime, setLastClickTime] = useState<number>(0);
    const [authState, setAuthState] = useState<{
        hasPermission: boolean | null;
        isLoading: boolean;
    }>({
        hasPermission: null,
        isLoading: true
    });

    // 檢查導航權限
    useEffect(() => {
        async function checkNavPermission() {
            // 如果 auth 還在載入中，不進行權限檢查
            if (authLoading) {
                return;
            }

            if (!user || !userRoles) {
                setAuthState({
                    hasPermission: false,
                    isLoading: false
                });
                return;
            }

            try {
                const navPermissionsDoc = await getDoc(doc(db, 'settings', 'navPermissions'));
                if (!navPermissionsDoc.exists()) {
                    setAuthState({
                        hasPermission: false,
                        isLoading: false
                    });
                    return;
                }

                const data = navPermissionsDoc.data();
                const archiveNav = data.items?.find((item: NavPermissionItem) => item.id === 'archive');
                
                if (!archiveNav) {
                    setAuthState({
                        hasPermission: false,
                        isLoading: false
                    });
                    return;
                }

                // 檢查用戶角色是否有權限
                const hasAccess = userRoles.some(role => 
                    archiveNav.defaultRoles.includes(role)
                );

                setAuthState({
                    hasPermission: hasAccess,
                    isLoading: false
                });
            } catch (error) {
                console.error('檢查導航權限失敗:', error);
                setAuthState({
                    hasPermission: false,
                    isLoading: false
                });
            }
        }

        checkNavPermission();
    }, [user, userRoles, authLoading, db, doc, getDoc]);

    // 如果正在載入權限，顯示載入中
    if (authState.isLoading) {
        return (
            <main className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                </div>
            </main>
        );
    }

    // 如果沒有權限，顯示拒絕存取訊息
    if (!authState.hasPermission) {
        return (
            <main className="max-w-4xl mx-auto">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                    <div className="flex flex-col items-center justify-center py-12">
                        <svg className="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">存取被拒絕</h2>
                        <p className="text-gray-600 dark:text-gray-400">您沒有權限存取此頁面</p>
                    </div>
                </div>
            </main>
        );
    }

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
            try {
                const subCollections = ["orders", "quotes", "contracts", "projects"];
                for (const sub of subCollections) {
                    const colRef = collection(db, `archived/default/${sub}`);
                    const snap = await getDocs(colRef);
                    for (const docSnap of snap.docs) {
                        await deleteDoc(docSnap.ref);
                    }
                }
                await deleteDoc(doc(db, "archived", "default"));
                setClickCount(0);
            } catch (err) {
                alert("刪除失敗: " + (err instanceof Error ? err.message : String(err)));
            }
        }
    };

    return (
        <main className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex flex-col items-center justify-center py-12">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-4">封存管理</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-center mb-8">
                        請從左側選擇要瀏覽的封存資料
                    </p>
                    <button
                        className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 text-lg bg-transparent border-none cursor-pointer focus:outline-none transition-colors duration-200"
                        onClick={handleRemoveAll}
                    >
                        連點5次可清除所有封存資料
                    </button>
                </div>
            </div>
        </main>
    );
}
