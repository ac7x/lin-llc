"use client";

import { useEffect, useState } from 'react';
import firebaseClient, { User, DocumentData } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { UserBottomNav } from '@/modules/shared/interfaces/navigation/user-bottom-nav';
import Image from 'next/image';

const USERS_COLLECTION = "users";

export default function UserProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = firebaseClient.onAuthStateChange(async (u) => {
      setUser(u);
      setLoading(false);

      // 拉 Firestore 用戶資料
      if (u) {
        const docResult = await firebaseClient.getDocument(USERS_COLLECTION, u.uid);
        if (docResult.success && docResult.data) {
          setUserProfile(docResult.data);
        } else {
          setUserProfile(null); // 修正: 用 null，而不是 undefined
        }
      } else {
        setUserProfile(null); // 修正: 用 null，而不是 undefined
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await firebaseClient.signOut();
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
            <div><b>名稱：</b>{user.displayName || userProfile?.displayName || '—'}</div>
            {user.photoURL || userProfile?.photoURL ? (
              <Image
                src={user.photoURL || userProfile?.photoURL}
                alt="使用者頭像"
                width={128}
                height={128}
                className="rounded-full"
              />
            ) : null}
            <div><b>建立時間：</b>{userProfile?.createdAt ? (userProfile.createdAt.toDate ? userProfile.createdAt.toDate().toLocaleString() : String(userProfile.createdAt)) : '—'}</div>
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
          </div>
        )}
      </div>
      <UserBottomNav />
    </main>
  );
}