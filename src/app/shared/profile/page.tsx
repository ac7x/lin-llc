"use client";
import Image from "next/image";
import { auth } from "@/lib/firebase/firebase-client";
import { signOut } from "firebase/auth";
import { useAuthState } from 'react-firebase-hooks/auth';
import { useRouter } from "next/navigation";
import SignIn from "@/components/signin";
import { useEffect } from "react";
import { db, doc, getDoc } from "@/lib/firebase/firebase-firestore";
import { diagnoseAppCheck } from "@/lib/firebase/firebase-appcheck";

function UserInfo({ user, className = "" }: {
    user: { displayName?: string | null; email?: string | null; photoURL?: string | null; };
    className?: string;
}) {
    return (
        <div className={`flex flex-col items-center justify-center space-y-2 ${className}`}>
            {user.photoURL && (
                <Image
                    src={user.photoURL}
                    alt="頭像"
                    width={64}
                    height={64}
                    className="rounded-full border-2 border-white dark:border-neutral-800 shadow"
                />
            )}
            <div className="text-lg font-semibold">{user.displayName || '—'}</div>
            <div className="text-gray-500 dark:text-gray-400 text-sm">{user.email || '—'}</div>
        </div>
    );
}

export default function ProfilePage() {
    const [user, loading] = useAuthState(auth);
    const router = useRouter();

    const handleLogout = async () => {
        await signOut(auth);
        router.push("/");
    };

    // 新增 Firestore 讀取，觸發 App Check
    useEffect(() => {
        const testAppCheck = async () => {
            try {
                // 隨便讀一個不存在的文件
                const ref = doc(db, "test", "appcheck-demo");
                await getDoc(ref);
                // 你可以在這裡 console.log("App Check Firestore read success");
            } catch {
                // 忽略錯誤
            }
        };
        testAppCheck();

        // 顯示 App Check 狀態
        console.log(diagnoseAppCheck());
    }, []);

    if (loading) return <div className="p-6 flex items-center justify-center min-h-screen">載入中...</div>;
    if (!user) return (
        <div className="p-6 flex items-center justify-center min-h-screen">
            <SignIn />
        </div>
    );

    return (
        <>
            <div className="min-h-screen flex items-center justify-center bg-white dark:bg-neutral-900">
                <div className="p-8 max-w-md w-full bg-white dark:bg-neutral-900 shadow-xl rounded-xl flex flex-col items-center justify-center space-y-6 mx-auto">
                    <UserInfo user={user} className="w-full" />
                    <button
                        className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors font-semibold text-lg mt-2 text-center"
                        onClick={handleLogout}
                    >
                        登出
                    </button>
                </div>
            </div>
        </>
    );
}