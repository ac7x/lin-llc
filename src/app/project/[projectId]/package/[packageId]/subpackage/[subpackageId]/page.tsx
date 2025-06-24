'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, setDoc, collection, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SubpackagePage() {
  // 取得路由參數
  const [assignedUids, setAssignedUids] = useState<string[]>([]);
  const [inputUid, setInputUid] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Firestore 路徑
  // subpackage 資料建議存於: projects/{projectId}/packages/{packageId}/subpackages/{subpackageId}
  // 這裡僅示範指派用戶
  useEffect(() => {
    void (async () => {
      const subRef = doc(db, 'subpackages', window.location.pathname);
      const snap = await getDoc(subRef);
      if (snap.exists()) {
        setAssignedUids(snap.data().assignedUids || []);
      }
    })();
  }, []);

  // 指派用戶（可多位）
  const handleAssign = async () => {
    setLoading(true);
    const subRef = doc(db, 'subpackages', window.location.pathname);
    // 更新 assignedUids 陣列
    await updateDoc(subRef, { assignedUids: arrayUnion(inputUid) });
    setAssignedUids(prev => [...prev, inputUid]);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 1500);
    setLoading(false);
    // 寫入通知
    await addDoc(collection(db, 'notifications'), {
      targetUid: inputUid,
      title: '任務指派',
      message: `您已被指派到子工作包：${window.location.pathname}`,
      type: 'info',
      isRead: false,
      createdAt: new Date().toISOString(),
    });
  };

  // 移除指派
  const handleRemove = async (uid: string) => {
    setLoading(true);
    const subRef = doc(db, 'subpackages', window.location.pathname);
    await updateDoc(subRef, { assignedUids: arrayRemove(uid) });
    setAssignedUids(prev => prev.filter(u => u !== uid));
    setLoading(false);
  };

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">
        指派子工作包任務（可多人）
      </h1>
      <div className="mb-2">目前指派用戶 UID：{assignedUids.length > 0 ? assignedUids.join(', ') : '尚未指派'}</div>
      <div className="flex gap-2 items-center mb-4">
        <Input
          placeholder="輸入用戶 UID..."
          value={inputUid}
          onChange={e => setInputUid(e.target.value)}
          className="w-64"
        />
        <Button onClick={handleAssign} disabled={loading || !inputUid || assignedUids.includes(inputUid)}>
          {loading ? '指派中...' : '指派'}
        </Button>
        {success && <span className="text-green-600 ml-2">指派成功！</span>}
      </div>
      <div className="space-y-2">
        {assignedUids.map(uid => (
          <div key={uid} className="flex items-center gap-2">
            <span>{uid}</span>
            <Button size="sm" variant="outline" onClick={() => handleRemove(uid)} disabled={loading}>
              移除
            </Button>
          </div>
        ))}
      </div>
    </main>
  );
} 