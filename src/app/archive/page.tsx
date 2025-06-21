/**
 * 封存管理頁面
 *
 * 提供系統封存資料的管理功能，包含：
 * - 封存資料瀏覽
 * - 封存資料還原
 * - 封存資料刪除
 * - 封存設定管理
 * - 封存歷史記錄
 */

'use client';

import { useState } from 'react';

import { db, collection, getDocs, deleteDoc, doc } from '@/lib/firebase-client';

export default function ArchivePage() {
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState<number>(0);

  // 連點5次觸發移除所有封存資料
  const handleRemoveAll = async () => {
    const now = Date.now();
    if (now - lastClickTime > 2000) {
      setClickCount(1);
    } else {
      setClickCount(prev => prev + 1);
    }
    setLastClickTime(now);
    if (clickCount + 1 >= 5) {
      try {
        const subCollections = ['orders', 'quotes', 'contracts', 'projects'];
        for (const sub of subCollections) {
          const colRef = collection(db, `archived/default/${sub}`);
          const snap = await getDocs(colRef);
          for (const docSnap of snap.docs) {
            await deleteDoc(docSnap.ref);
          }
        }
        await deleteDoc(doc(db, 'archived', 'default'));
        setClickCount(0);
      } catch (_error) {
        alert(`刪除失敗: ${_err instanceof Error ? _err.message : String(_error)}`);
      }
    }
  };

  return (
    <main className='max-w-4xl mx-auto'>
      <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
        <div className='flex flex-col items-center justify-center py-12'>
          <h1 className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-4'>
            封存管理
          </h1>
          <p className='text-gray-500 dark:text-gray-400 text-center mb-8'>
            請從左側選擇要瀏覽的封存資料
          </p>
          <button
            className='text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 text-lg bg-transparent border-none cursor-pointer focus:outline-none transition-colors duration-200'
            onClick={handleRemoveAll}
          >
            連點5次可清除所有封存資料
          </button>
        </div>
      </div>
    </main>
  );
}
