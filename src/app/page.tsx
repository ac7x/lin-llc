"use client";

import React, { useState } from 'react';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase/firebase-client';  // 請依你專案路徑調整

const FirestoreTestPage: React.FC = () => {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWrite = async () => {
    setLoading(true);
    try {
      const docRef = await addDoc(collection(db, 'testCollection'), {
        content: text,
        createdAt: new Date().toISOString(),
      });
      console.log('寫入成功，ID:', docRef.id);
      alert('寫入成功');
      setText('');
    } catch (error) {
      console.error('寫入失敗:', error);
      alert('寫入失敗，請看console');
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Firestore 寫入測試</h1>
      <input
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="輸入測試文字"
        style={{ padding: 8, width: '300px', marginRight: 8 }}
      />
      <button onClick={handleWrite} disabled={loading || !text}>
        {loading ? '寫入中...' : '寫入 Firestore'}
      </button>
    </div>
  );
};

export default FirestoreTestPage;