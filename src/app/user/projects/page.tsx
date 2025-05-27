"use client";

import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, collection } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import React from 'react';

export default function ProjectsPage() {
  const db = getFirestore(app);
  const projectsRef = collection(db, 'projects');
  const [projectsSnap, loading, error] = useCollection(projectsRef);

  return (
    <div className="pb-20 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">專案列表</h1>
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
              <li key={docSnap.id} className="border p-4 rounded shadow-sm">
                <div className="font-bold text-lg text-blue-700">{data.name || docSnap.id}</div>
                <div className="text-xs text-gray-700 mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <span>地區：{data.region || '—'}</span>
                  <span>
                    地址：{data.address || '—'}
                    {data.address && (
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(data.address)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 underline text-xs"
                      >
                        Google導航
                      </a>
                    )}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
