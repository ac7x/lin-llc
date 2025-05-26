import React, { useEffect, useRef, useState } from 'react';
import { DataSet, Timeline } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../modules/shared/infrastructure/persistence/firebase/firebase-client';

interface TimelineItem {
  id: string;
  content: string;
  start: string;
  group: string;
}

interface TimelineGroup {
  id: string;
  content: string;
}

const TimelineComponent: React.FC = () => {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [groups, setGroups] = useState<TimelineGroup[]>([]);

  // UI State for adding
  const [groupName, setGroupName] = useState('');
  const [itemName, setItemName] = useState('');
  const [itemStart, setItemStart] = useState('');
  const [itemGroup, setItemGroup] = useState('');

  // Sync timelineItems
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'timelineItems'), (snapshot) => {
      const newItems = snapshot.docs.map(doc => ({
        id: doc.id,
        content: doc.data().content,
        start: doc.data().start,
        group: doc.data().group || '',
      } as TimelineItem));
      setItems(newItems);
    });
    return () => unsubscribe();
  }, []);

  // Sync groups
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'groups'), (snapshot) => {
      const newGroups = snapshot.docs.map(doc => ({
        id: doc.id,
        content: doc.data().name,
      } as TimelineGroup));
      setGroups(newGroups);
    });
    return () => unsubscribe();
  }, []);

  // vis-timeline
  useEffect(() => {
    if (timelineRef.current) {
      const itemsDS = new DataSet(items);
      const groupsDS = new DataSet(groups);

      const timeline = new Timeline(timelineRef.current, itemsDS, groupsDS, {
        groupOrder: 'content'
      });

      // 拖曳修改
      timeline.on('move', async (event) => {
        const { item, start, group } = event;
        try {
          await updateDoc(doc(db, 'timelineItems', item), { start: start.toISOString(), group });
          console.log('Item updated successfully');
        } catch (error) {
          console.error('Error updating item:', error);
        }
      });

      // 刪除
      timeline.on('remove', async (event) => {
        const { item } = event;
        try {
          await deleteDoc(doc(db, 'timelineItems', item));
          console.log('Item removed successfully');
        } catch (error) {
          console.error('Error removing item:', error);
        }
      });

      return () => {
        timeline.destroy();
      };
    }
  }, [items, groups]);

  // 新增群組
  const handleAddGroup = async () => {
    if (!groupName.trim()) return;
    try {
      await addDoc(collection(db, 'groups'), { name: groupName.trim() });
      setGroupName('');
    } catch (error) {
      console.error('Error adding group:', error);
    }
  };

  // 新增項目
  const handleAddItem = async () => {
    if (!itemName.trim() || !itemStart.trim() || !itemGroup) return;
    try {
      await addDoc(collection(db, 'timelineItems'), {
        content: itemName.trim(),
        start: itemStart,
        group: itemGroup,
      });
      setItemName('');
      setItemStart('');
      setItemGroup('');
    } catch (error) {
      console.error('Error adding item:', error);
    }
  };

  return (
    <div>
      <h2>群組管理</h2>
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="群組名稱"
        />
        <button onClick={handleAddGroup}>新增群組</button>
      </div>
      <h2>項目管理</h2>
      <div style={{ marginBottom: 16 }}>
        <input
          type="text"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="項目名稱"
        />
        <input
          type="text"
          value={itemStart}
          onChange={(e) => setItemStart(e.target.value)}
          placeholder="開始日期 (YYYY-MM-DD)"
        />
        <select
          value={itemGroup}
          onChange={(e) => setItemGroup(e.target.value)}
        >
          <option value="">選擇群組</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.content}</option>
          ))}
        </select>
        <button onClick={handleAddItem}>新增項目</button>
      </div>
      <div ref={timelineRef} />
    </div>
  );
};

export default TimelineComponent;