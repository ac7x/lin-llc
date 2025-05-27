// src/app/admin/projects/[projectId]/schedule/page.tsx
"use client";

import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, doc } from 'firebase/firestore';
import { useDocument } from 'react-firebase-hooks/firestore';

export default function ProjectSchedulePage({ params }: { params: { projectId: string } }) {
  const db = getFirestore(app);
  const scheduleRef = doc(db, `projects/${params.projectId}/schedule/default`);
  const [scheduleSnap, loading, error] = useDocument(scheduleRef);

  if (loading) return <div>載入中...</div>;
  if (error) return <div>發生錯誤: {error.message}</div>;

  const schedule = scheduleSnap?.exists() ? scheduleSnap.data() : null;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">排班設定</h2>
      {schedule ? (
        <div>
          <p>排班模式：{schedule.mode}</p>
          <p>人力需求：{schedule.requiredPersonnel}人/天</p>
        </div>
      ) : (
        <p>尚未設定排班。</p>
      )}
    </div>
  );
}
