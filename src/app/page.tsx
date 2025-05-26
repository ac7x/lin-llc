"use client";

import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../modules/shared/infrastructure/persistence/firebase/firebase-client'; // 確保路徑正確

const GroupAddTestPage: React.FC = () => {
  const [groupName, setGroupName] = useState('');
  const [message, setMessage] = useState('');

  const handleAddGroup = async () => {
    if (!groupName.trim()) {
      setMessage('請輸入有效的組名稱');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'groups'), {
        name: groupName.trim()
      });
      setMessage(`成功新增 group：${docRef.id}`);
      setGroupName('');
    } catch (error) {
      console.error('寫入失敗:', error);
      setMessage('寫入失敗，請檢查 console 錯誤');
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">測試寫入 Firestore - groups</h1>

      <input
        className="border px-3 py-2 w-full"
        type="text"
        placeholder="請輸入 Group 名稱"
        value={groupName}
        onChange={(e) => setGroupName(e.target.value)}
      />

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={handleAddGroup}
      >
        新增 Group
      </button>

      {message && <p className="text-sm mt-2">{message}</p>}
    </div>
  );
};

export default GroupAddTestPage;