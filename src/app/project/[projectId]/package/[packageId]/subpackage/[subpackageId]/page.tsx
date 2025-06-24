'use client';
import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-init';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export default function SubpackagePage() {
  // 取得路由參數
  const [assignedUid, setAssignedUid] = useState('');
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
        setAssignedUid(snap.data().assignedUid || '');
      }
    })();
  }, []);

  const handleAssign = async () => {
    setLoading(true);
    const subRef = doc(db, 'subpackages', window.location.pathname);
    await updateDoc(subRef, { assignedUid: inputUid });
    setAssignedUid(inputUid);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 1500);
    setLoading(false);
  };

  return (
    <main className="p-4">
      <h1 className="text-xl font-bold mb-4">
        指派子工作包任務
      </h1>
      <div className="mb-2">目前指派用戶 UID：{assignedUid || '尚未指派'}</div>
      <div className="flex gap-2 items-center">
        <Input
          placeholder="輸入用戶 UID..."
          value={inputUid}
          onChange={e => setInputUid(e.target.value)}
          className="w-64"
        />
        <Button onClick={handleAssign} disabled={loading || !inputUid}>
          {loading ? '指派中...' : '指派'}
        </Button>
        {success && <span className="text-green-600 ml-2">指派成功！</span>}
      </div>
    </main>
  );
} 