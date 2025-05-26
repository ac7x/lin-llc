import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../modules/shared/infrastructure/persistence/firebase/firebase-client';

const TestTimelineControl: React.FC = () => {
  const [groupTitle, setGroupTitle] = useState('');
  const [itemContent, setItemContent] = useState('');
  const [itemStart, setItemStart] = useState('');
  const [itemEnd, setItemEnd] = useState('');
  const [itemGroup, setItemGroup] = useState('');
  const [groupMsg, setGroupMsg] = useState('');
  const [itemMsg, setItemMsg] = useState('');

  // 新增群組
  const handleAddGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupTitle) return;
    try {
      await addDoc(collection(db, 'schedules_groups'), { title: groupTitle });
      setGroupMsg('群組新增成功');
      setGroupTitle('');
    } catch {
      setGroupMsg('群組新增失敗');
    }
  };

  // 新增項目
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemContent || !itemStart || !itemGroup) return;
    try {
      await addDoc(collection(db, 'schedules'), {
        content: itemContent,
        start: itemStart,
        end: itemEnd || null,
        group: itemGroup,
      });
      setItemMsg('項目新增成功');
      setItemContent('');
      setItemStart('');
      setItemEnd('');
      setItemGroup('');
    } catch {
      setItemMsg('項目新增失敗');
    }
  };

  return (
    <div style={{ marginBottom: 24, border: '1px solid #ccc', padding: 16 }}>
      <h3>測試：新增群組</h3>
      <form onSubmit={handleAddGroup} style={{ marginBottom: 12 }}>
        <input
          type="text"
          placeholder="群組名稱"
          value={groupTitle}
          onChange={e => setGroupTitle(e.target.value)}
          required
        />
        <button type="submit">新增群組</button>
        <span style={{ marginLeft: 8, color: 'green' }}>{groupMsg}</span>
      </form>
      <h3>測試：新增項目</h3>
      <form onSubmit={handleAddItem}>
        <input
          type="text"
          placeholder="項目內容"
          value={itemContent}
          onChange={e => setItemContent(e.target.value)}
          required
        />
        <input
          type="datetime-local"
          placeholder="開始時間"
          value={itemStart}
          onChange={e => setItemStart(e.target.value)}
          required
        />
        <input
          type="datetime-local"
          placeholder="結束時間"
          value={itemEnd}
          onChange={e => setItemEnd(e.target.value)}
        />
        <input
          type="text"
          placeholder="群組ID"
          value={itemGroup}
          onChange={e => setItemGroup(e.target.value)}
          required
        />
        <button type="submit">新增項目</button>
        <span style={{ marginLeft: 8, color: 'green' }}>{itemMsg}</span>
      </form>
      <div style={{ fontSize: 12, color: '#888', marginTop: 8 }}>
        ※ 請先新增群組，複製群組ID填入項目群組ID欄位
      </div>
    </div>
  );
};

export default TestTimelineControl;
