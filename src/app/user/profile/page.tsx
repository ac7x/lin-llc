'use client';

import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User } from 'firebase/auth';
import { firebaseApp } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { UserBottomNav } from '@/modules/shared/interfaces/navigation/user-bottom-nav';
import Image from 'next/image';

export default function UserProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth(firebaseApp);
        const unsub = onAuthStateChanged(auth, u => {
            setUser(u);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const handleLogin = async () => {
        const auth = getAuth(firebaseApp);
        const provider = new GoogleAuthProvider();
        await signInWithPopup(auth, provider);
    };

    const handleLogout = async () => {
        const auth = getAuth(firebaseApp);
        await signOut(auth);
    };

    if (loading) return <div className="p-8">載入中...</div>;

    return (
        <main className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            <div className="bg-white dark:bg-gray-800 rounded shadow p-6 w-full max-w-md">
                <h1 className="text-2xl font-bold mb-4">個人檔案</h1>
                {user ? (
                    <div className="space-y-2">
                        <div><b>UID：</b>{user.uid}</div>
                        <div><b>Email：</b>{user.email || '—'}</div>
                        <div><b>名稱：</b>{user.displayName || '—'}</div>
                        {user.photoURL && (
                            <Image
                                src={user.photoURL}
                                alt="使用者頭像"
                                width={128}
                                height={128}
                                className="rounded-full"
                            />
                        )}
                        <button
                            onClick={handleLogout}
                            className="mt-4 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
                        >
                            登出
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center">
                        <div className="mb-4">尚未登入</div>
                        <button
                            onClick={handleLogin}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
                        >
                            使用 Google 登入
                        </button>
                    </div>
                )}
            </div>
            <UserBottomNav />
        </main>
    );
}
