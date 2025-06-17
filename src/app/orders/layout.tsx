/**
 * 訂單模組布局
 * 
 * 提供訂單相關頁面的共用布局，包含：
 * - 訂單側邊導航選單
 * - 訂單相關功能連結
 * - 響應式設計
 * - 權限控制
 */

"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCollection } from "react-firebase-hooks/firestore";
import { db } from "@/lib/firebase-client";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useAuth } from "@/app/signin/hooks/useAuth";
import { Unauthorized } from '@/components/common/Unauthorized';
import type { User } from "firebase/auth";
import type { RoleKey } from "@/constants/roles";

interface ExtendedUser extends User {
    currentRole?: RoleKey;
}

const OrderSideNav: React.FC = () => {
    const pathname = usePathname();
    const baseNavs = [
        { label: "訂單列表", href: "/orders", icon: "📋" },
        { label: "新增訂單", href: "/orders/add", icon: "➕" },
    ];

    const [ordersSnapshot] = useCollection(collection(db, 'finance', 'default', 'orders'));

    // 從數據庫獲取訂單列表
    const orderNavs = ordersSnapshot?.docs.map(doc => ({
        label: doc.data().orderName || `訂單 ${doc.id}`,
        href: `/orders/${doc.id}`,
        icon: "📄"
    })) || [];

    // 合併基礎導航和動態訂單導航
    const navs = [
        baseNavs[0],  // 訂單列表
        ...orderNavs,  // 動態訂單列表
        baseNavs[1]   // 新增訂單
    ];

    return (
        <nav className="space-y-2">
            {navs.map((nav) => (
                <Link
                    key={nav.href}
                    href={nav.href}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                        pathname === nav.href
                            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }`}
                >
                    <span className="text-lg">{nav.icon}</span>
                    <span>{nav.label}</span>
                </Link>
            ))}
        </nav>
    );
};

export default function OrdersLayout({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [hasPermission, setHasPermission] = useState<boolean>(false);
    const [checkingPermission, setCheckingPermission] = useState<boolean>(true);

    useEffect(() => {
        const checkPermission = async (): Promise<void> => {
            const extendedUser = user as ExtendedUser;
            if (!extendedUser?.currentRole) {
                setHasPermission(false);
                setCheckingPermission(false);
                return;
            }

            try {
                // 從 members 集合獲取用戶資料
                const memberRef = doc(db, 'members', extendedUser.uid);
                const memberDoc = await getDoc(memberRef);
                const memberData = memberDoc.data();

                if (memberData?.rolePermissions?.[extendedUser.currentRole]) {
                    setHasPermission(true);
                } else {
                    setHasPermission(false);
                }
            } catch (error) {
                console.error('檢查權限失敗:', error);
                setHasPermission(false);
            } finally {
                setCheckingPermission(false);
            }
        };

        void checkPermission();
    }, [user]);

    // 如果正在檢查權限，顯示載入中
    if (checkingPermission) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-white dark:bg-gray-900">
                <div className="text-gray-600 dark:text-gray-300">載入中...</div>
            </div>
        );
    }

    // 如果沒有權限，顯示未授權頁面
    if (!hasPermission) {
        return <Unauthorized message="您沒有權限訪問訂單頁面" />;
    }

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="w-72 p-6 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-sm">
                <h2 className="text-xl font-semibold mb-6 text-gray-900 dark:text-gray-100">訂單管理</h2>
                <OrderSideNav />
            </div>
            <div className="flex-1 p-6">{children}</div>
        </div>
    );
}
