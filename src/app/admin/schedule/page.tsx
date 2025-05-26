'use client';

import React, { useEffect, useState } from 'react';
import TimelineComponent from '../../../components/Timeline';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../../modules/shared/infrastructure/persistence/firebase/firebase-client';

const TIMELINE_ID = 'default'; // 可改成動態 ID

interface TimelineGroup {
  id: string;
  content: string;
}

const SchedulePage: React.FC = () => {
  const [groupName, setGroupName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemStart, setItemStart] = useState('');
  const [itemEnd, setItemEnd] = useState('');
  const [groups, setGroups] = useState<TimelineGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string>('');

  // 取得 groups 列表
  useEffect(() => {
    const fetchGroups = async () => {
      const groupSnapshot = await getDocs(collection(db, 'Project', TIMELINE_ID, 'groups'));
      const groupList = groupSnapshot.docs.map(doc => ({
        id: doc.id,
        content: doc.data().name,
      }));
      setGroups(groupList);
      // 預設選中第一個 group
      if (groupList.length > 0) setSelectedGroupId(groupList[0].id);
    };
    fetchGroups();
  }, []);

  const handleAddGroup = async () => {
    try {
      await addDoc(collection(db, 'Project', TIMELINE_ID, 'groups'), {
        name: groupName
      });
      setGroupName('');
      // 重新載入 group
      const groupSnapshot = await getDocs(collection(db, 'Project', TIMELINE_ID, 'groups'));
      const groupList = groupSnapshot.docs.map(doc => ({
        id: doc.id,
        content: doc.data().name,
      }));
      setGroups(groupList);
      if (groupList.length > 0) setSelectedGroupId(groupList[0].id);
    } catch (error) {
      console.error('Error adding group:', error);
    }
  };

  const handleAddItem = async () => {
    try {
      const startDate = new Date(itemStart);
      startDate.setMinutes(0, 0, 0); // 對齊到整點

      const endDate = itemEnd ? new Date(itemEnd) : null;
      if (endDate) endDate.setMinutes(0, 0, 0); // 對齊到整點

      await addDoc(collection(db, 'Project', TIMELINE_ID, 'items'), {
        content: itemName,
        start: startDate.toISOString(),
        end: endDate ? endDate.toISOString() : null,
        group: selectedGroupId || null, // 指定 group ID，沒選則 null
      });

      setItemName('');
      setItemStart('');
      setItemEnd('');
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Schedule</h1>

      <div className="mb-4 space-x-2">
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group Name"
          className="border px-2 py-1"
        />
        <button onClick={handleAddGroup} className="bg-blue-500 text-white px-4 py-1 rounded">
          Add Group
        </button>
      </div>

      <div className="mb-4 space-x-2 flex flex-wrap items-center">
        <input
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="Item Name"
          className="border px-2 py-1"
        />
        <input
          type="datetime-local"
          value={itemStart}
          onChange={(e) => setItemStart(e.target.value)}
          className="border px-2 py-1"
        />
        <input
          type="datetime-local"
          value={itemEnd}
          onChange={(e) => setItemEnd(e.target.value)}
          className="border px-2 py-1"
        />
        <select
          value={selectedGroupId}
          onChange={e => setSelectedGroupId(e.target.value)}
          className="border px-2 py-1"
        >
          {groups.map(group => (
            <option key={group.id} value={group.id}>{group.content}</option>
          ))}
        </select>
        <button onClick={handleAddItem} className="bg-green-500 text-white px-4 py-1 rounded">
          Add Item
        </button>
      </div>

      <TimelineComponent />
    </div>
  );
};

export default SchedulePage;