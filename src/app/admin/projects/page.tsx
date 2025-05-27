"use client";

import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AdminProjectsPage() {
  const db = getFirestore(app);
  const projectsRef = collection(db, 'projects');
  const [projectsSnap, loading, error] = useCollection(projectsRef);
  const router = useRouter();
  const [taskCounts, setTaskCounts] = useState<{ [id: string]: number }>({});

  useEffect(() => {
    async function fetchTaskCounts() {
      if (!projectsSnap) return;
      const counts: { [id: string]: number } = {};
      for (const doc of projectsSnap.docs) {
        const tasksRef = collection(db, "projects", doc.id, "tasks");
        const tasksSnap = await getDocs(tasksRef);
        counts[doc.id] = tasksSnap.size;
      }
      setTaskCounts(counts);
    }
    fetchTaskCounts();
  }, [projectsSnap, db]);

  return (
    <div className="pb-20 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">專案管理</h1>
      <div className="mb-6">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          onClick={() => router.push('/admin/projects/add')}
        >
          新增專案
        </button>
      </div>
      {loading ? (
        <div>載入中...</div>
      ) : error ? (
        <div className="text-red-600">發生錯誤: {error.message}</div>
      ) : (
        <ul className="space-y-3">
          {projectsSnap?.docs.length === 0 && (
            <li className="text-gray-500">尚無專案</li>
          )}
          {projectsSnap?.docs.map(docSnap => {
            const data = docSnap.data();
            return (
              <li
                key={docSnap.id}
                className="border p-4 rounded cursor-pointer hover:bg-blue-50 transition group shadow-sm"
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
                <div className="font-bold text-lg text-blue-700 group-hover:underline group-hover:text-blue-900 transition">
                  {data.name || docSnap.id}
                </div>
                <div className="text-sm text-gray-600 mt-1 line-clamp-2">{data.description || '—'}</div>
                <div className="text-xs text-gray-500 mt-1">
                  任務數量：{taskCounts[docSnap.id] ?? '...'}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
