'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckSquareIcon, UserIcon } from 'lucide-react';
import { useParams } from 'next/navigation';

export default function TaskPackagePage() {
  const params = useParams();
  const [assignedUids, setAssignedUids] = useState<string[]>([]);
  const [inputUid, setInputUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [taskData, setTaskData] = useState<any>(null);

  // 取得路由參數
  const projectId = params.projectId as string;
  const packageId = params.packageId as string;
  const subpackageId = params.subpackageId as string;
  const taskpackageId = params.taskpackageId as string;

  useEffect(() => {
    void (async () => {
      try {
        // 這裡應該根據路由參數獲取任務資料
        // 實際實現時需要從 projects/{projectId}/packages/{packageId}/subpackages/{subpackageId}/taskpackages/{taskpackageId}
        const taskRef = doc(db, 'taskpackages', `${projectId}_${packageId}_${subpackageId}_${taskpackageId}`);
        const snap = await getDoc(taskRef);
        if (snap.exists()) {
          setTaskData(snap.data());
          setAssignedUids(snap.data().assignedUids || []);
        }
      } catch (error) {
        console.error('載入任務資料失敗:', error);
      }
    })();
  }, [projectId, packageId, subpackageId, taskpackageId]);

  // 指派用戶（可多位）
  const handleAssign = async () => {
    if (!inputUid.trim() || assignedUids.includes(inputUid)) return;
    
    setLoading(true);
    try {
      const taskRef = doc(db, 'taskpackages', `${projectId}_${packageId}_${subpackageId}_${taskpackageId}`);
      // 更新 assignedUids 陣列
      await updateDoc(taskRef, { assignedUids: arrayUnion(inputUid) });
      setAssignedUids(prev => [...prev, inputUid]);
      setInputUid('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);
      
      // 寫入通知
      await addDoc(collection(db, 'notifications'), {
        targetUid: inputUid,
        title: '任務指派',
        message: `您已被指派到任務：${taskData?.name || '未命名任務'}`,
        type: 'info',
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('指派失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  // 移除指派
  const handleRemove = async (uid: string) => {
    setLoading(true);
    try {
      const taskRef = doc(db, 'taskpackages', `${projectId}_${packageId}_${subpackageId}_${taskpackageId}`);
      await updateDoc(taskRef, { assignedUids: arrayRemove(uid) });
      setAssignedUids(prev => prev.filter(u => u !== uid));
    } catch (error) {
      console.error('移除指派失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-4">
      <div className="space-y-6">
        {/* 任務資訊 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquareIcon className="h-5 w-5" />
              任務詳情
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>任務名稱：</strong>{taskData?.name || '未命名任務'}</p>
              <p><strong>任務描述：</strong>{taskData?.description || '無描述'}</p>
              <p><strong>任務狀態：</strong>{taskData?.status || '未開始'}</p>
            </div>
          </CardContent>
        </Card>

        {/* 指派用戶 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              指派用戶（可多人）
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="mb-2">
                <p className="text-sm text-muted-foreground">
                  目前指派用戶 UID：{assignedUids.length > 0 ? assignedUids.join(', ') : '尚未指派'}
                </p>
              </div>
              
              <div className="flex gap-2 items-center">
                <Input
                  placeholder="輸入用戶 UID..."
                  value={inputUid}
                  onChange={e => setInputUid(e.target.value)}
                  className="w-64"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      void handleAssign();
                    }
                  }}
                />
                <Button 
                  onClick={handleAssign} 
                  disabled={loading || !inputUid.trim() || assignedUids.includes(inputUid)}
                >
                  {loading ? '指派中...' : '指派'}
                </Button>
                {success && <span className="text-green-600 ml-2">指派成功！</span>}
              </div>
              
              <div className="space-y-2">
                {assignedUids.map(uid => (
                  <div key={uid} className="flex items-center gap-2 p-2 border rounded">
                    <span className="flex-1">{uid}</span>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => handleRemove(uid)} 
                      disabled={loading}
                    >
                      移除
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 