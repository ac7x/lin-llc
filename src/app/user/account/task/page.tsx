'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SubpackageTask {
  id: string;
  assignedUid: string;
  // 其他欄位可擴充
}

export default function UserTaskPage() {
  const { user } = useGoogleAuth();
  const [tasks, setTasks] = useState<SubpackageTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const colRef = collection(db, 'subpackages');
      const snap = await getDocs(colRef);
      const list: SubpackageTask[] = [];
      snap.forEach(docSnap => {
        const data = docSnap.data() as SubpackageTask;
        if (data.assignedUid === user.uid) {
          list.push({ ...data, id: docSnap.id });
        }
      });
      setTasks(list);
      setLoading(false);
    })();
  }, [user]);

  if (!user) {
    return <div className="p-4">請先登入</div>;
  }

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">我的任務</h1>
      {loading ? (
        <div>載入中...</div>
      ) : tasks.length === 0 ? (
        <div>目前沒有指派給您的子工作包。</div>
      ) : (
        <div className="grid gap-4">
          {tasks.map(task => (
            <Card key={task.id}>
              <CardHeader>
                <CardTitle>子工作包 ID：{task.id}</CardTitle>
              </CardHeader>
              <CardContent>
                <div>指派給您 (UID: {user.uid})</div>
                {/* 可擴充顯示更多資訊 */}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
} 