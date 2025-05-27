// src/app/admin/projects/[projectId]/tasks/page.tsx
"use client";

import { app } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { getFirestore, collection } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useParams } from 'next/navigation';

type Task = {
  id: string;
  name?: string;
  assignee?: string;
  // ...可擴充其他欄位
};

export default function ProjectTasksPage() {
  const params = useParams();
  const projectId = params?.projectId as string;

  const db = getFirestore(app);
  const tasksRef = collection(db, `projects/${projectId}/tasks`);
  const [tasksSnap, loading, error] = useCollection(tasksRef);

  if (loading) return <div>載入中...</div>;
  if (error) return <div>發生錯誤: {error.message}</div>;

  const tasks: Task[] = tasksSnap
    ? tasksSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as Omit<Task, 'id'>) }))
    : [];

  return (
    <div>
      <h2 className="text-xl font-bold">任務列表</h2>
      {tasks.length === 0 ? (
        <p>尚未有任務。</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {tasks.map(task => (
            <li key={task.id}>
              <div className="p-2 border rounded">
                <p className="font-semibold">{task.name ?? '(未命名任務)'}</p>
                <p>負責人：{task.assignee ?? '(未指定)'}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
