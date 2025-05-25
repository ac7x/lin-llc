'use client';

import React, { useState } from 'react';
import TimelineComponent from '../../../components/Timeline';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '../../../firebase/firebase-client';

const TIMELINE_ID = 'default'; // 可改成動態 ID

const SchedulePage: React.FC = () => {
  const [groupName, setGroupName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemStart, setItemStart] = useState('');
  const [itemEnd, setItemEnd] = useState('');

  const handleAddGroup = async () => {
    try {
      await addDoc(collection(db, 'timelines', TIMELINE_ID, 'groups'), { name: groupName });
      setGroupName('');
    } catch (error) {
      console.error('Error adding group:', error);
    }
  };

  const handleAddItem = async () => {
    try {
      await addDoc(collection(db, 'timelines', TIMELINE_ID, 'timelineItems'), {
        content: itemName,
        start: new Date(itemStart).toISOString(),
        end: itemEnd ? new Date(itemEnd).toISOString() : null,
        group: null, // 或選擇指定 group id
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

      <div className="mb-4 space-x-2">
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
        <button onClick={handleAddItem} className="bg-green-500 text-white px-4 py-1 rounded">
          Add Item
        </button>
      </div>

      <TimelineComponent />
    </div>
  );
};

export default SchedulePage;