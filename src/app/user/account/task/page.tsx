'use client';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { useGoogleAuth } from '@/hooks/use-google-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquareIcon } from 'lucide-react';

interface TaskPackage {
  id: string;
  name: string;
  description?: string;
  status?: string;
  assignedUids: string[];
  projectId?: string;
  packageId?: string;
  subpackageId?: string;
  completed?: number;
  total?: number;
  progress?: number;
}

export default function UserTaskPage() {
  const { user } = useGoogleAuth();
  const [tasks, setTasks] = useState<TaskPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      try {
        // 查詢所有 taskpackages，然後在記憶體中過濾
        const colRef = collection(db, 'taskpackages');
      const snap = await getDocs(colRef);
        const list: TaskPackage[] = [];
        
      snap.forEach(docSnap => {
          const data = docSnap.data() as TaskPackage;
          // 檢查當前用戶是否在指派清單中
          if (data.assignedUids && data.assignedUids.includes(user.uid)) {
            // 從文件 ID 解析專案資訊
            const idParts = docSnap.id.split('_');
            const taskInfo = {
              ...data,
              id: docSnap.id,
              projectId: idParts[0],
              packageId: idParts[1],
              subpackageId: idParts[2],
              taskpackageId: idParts[3]
            };
            list.push(taskInfo);
        }
      });
        
      setTasks(list);
      } catch (error) {
        console.error('載入任務失敗:', error);
      } finally {
      setLoading(false);
      }
    })();
  }, [user]);

  if (!user) {
    return <div className="p-4">請先登入</div>;
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in-progress': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">我的任務</h1>
      {loading ? (
        <div>載入中...</div>
      ) : tasks.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">目前沒有指派給您的任務</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map(task => (
            <Card key={task.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <CheckSquareIcon className="h-5 w-5" />
                    {task.name || '未命名任務'}
                  </CardTitle>
                  <Badge className={getStatusColor(task.status)}>
                    {task.status || '未開始'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {task.description || '無描述'}
                  </p>
                  <div className="flex items-center gap-4 text-sm">
                    <span>進度：{task.completed || 0} / {task.total || 0}</span>
                    <span>進度：{task.progress || 0}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    專案：{task.projectId} → 工作包：{task.packageId} → 子工作包：{task.subpackageId}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    指派給 {task.assignedUids.length} 位用戶
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
} 