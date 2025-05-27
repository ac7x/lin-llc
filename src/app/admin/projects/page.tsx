"use client";

import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { getUsersList } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';

export default function AdminProjectsPage() {
  const db = getFirestore(app);
  const projectsRef = collection(db, 'projects');
  const [projectsSnap, loading, error] = useCollection(projectsRef);
  const router = useRouter();
  const [taskCounts, setTaskCounts] = useState<{ [id: string]: number }>({});
  const [users, setUsers] = useState<{ uid: string; displayName?: string; email?: string }[]>([]);

  useEffect(() => {
    async function fetchTaskCounts() {
      if (!projectsSnap) return;
      const counts: { [id: string]: number } = {};
      for (const doc of projectsSnap.docs) {
        let total = 0;
        // 取得所有區域
        const areasRef = collection(db, "projects", doc.id, "areas");
        const areasSnap = await getDocs(areasRef);
        for (const areaDoc of areasSnap.docs) {
          const areaTasksRef = collection(db, "projects", doc.id, "areas", areaDoc.id, "tasks");
          const areaTasksSnap = await getDocs(areaTasksRef);
          total += areaTasksSnap.size;
        }
        counts[doc.id] = total;
      }
      setTaskCounts(counts);
    }
    fetchTaskCounts();
  }, [projectsSnap, db]);

  useEffect(() => {
    getUsersList().then(setUsers);
  }, []);

  return (
    <div className="pb-20 max-w-2xl mx-auto dark:bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 dark:text-gray-100">專案管理</h1>
      <div className="mb-6">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition dark:bg-blue-500 dark:hover:bg-blue-700"
          onClick={() => router.push('/admin/projects/add')}
        >
          新增專案
        </button>
      </div>
      {loading ? (
        <div className="dark:text-gray-200">載入中...</div>
      ) : error ? (
        <div className="text-red-600 dark:text-red-400">發生錯誤: {error.message}</div>
      ) : (
        <ul className="space-y-3">
          {projectsSnap?.docs.length === 0 && (
            <li className="text-gray-500 dark:text-gray-400">尚無專案</li>
          )}
          {projectsSnap?.docs.map(docSnap => {
            const data = docSnap.data();
            const manager = users.find(u => u.uid === data.manager);
            // supervisor/safety 可能為陣列
            const supervisors = Array.isArray(data.supervisor) ? data.supervisor : data.supervisor ? [data.supervisor] : [];
            const safeties = Array.isArray(data.safety) ? data.safety : data.safety ? [data.safety] : [];
            return (
              <li
                key={docSnap.id}
                className="border p-4 rounded cursor-pointer hover:bg-blue-50 transition group shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                onClick={() => router.push(`/admin/projects/${docSnap.id}`)}
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    router.push(`/admin/projects/${docSnap.id}`);
                  }
                }}
                role="button"
                aria-label={`前往專案 ${data.name || docSnap.id} 詳細頁`}
              >
                <div className="font-bold text-lg text-blue-700 group-hover:underline group-hover:text-blue-900 transition dark:text-blue-300 dark:group-hover:text-blue-200">
                  {data.name || docSnap.id}
                </div>
                <div className="text-sm text-gray-600 mt-1 line-clamp-2 dark:text-gray-300">{data.description || '—'}</div>
                <div className="text-xs text-gray-500 mt-1 dark:text-gray-400">任務數量：{taskCounts[docSnap.id] ?? '...'}</div>
                <div className="text-xs text-gray-700 mt-1 flex flex-wrap gap-x-4 gap-y-1 dark:text-gray-200">
                  <span>負責人：{manager?.displayName || manager?.email || data.manager || '—'}</span>
                  <span>現場監工：{
                    supervisors.length
                      ? supervisors.map(uid => {
                          const u = users.find(user => user.uid === uid);
                          return u?.displayName || u?.email || uid;
                        }).join(', ')
                      : '—'
                  }</span>
                  <span>安全衛生人員：{
                    safeties.length
                      ? safeties.map(uid => {
                          const u = users.find(user => user.uid === uid);
                          return u?.displayName || u?.email || uid;
                        }).join(', ')
                      : '—'
                  }</span>
                </div>
                <div className="text-xs text-gray-700 mt-1 flex flex-wrap gap-x-4 gap-y-1 dark:text-gray-200">
                  <span>地區：{data.region || '—'}</span>
                  <span>地址：{data.address || '—'}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
