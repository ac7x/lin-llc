import React, { useEffect, useRef, useState } from 'react';
import { DataSet, Timeline } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../modules/shared/infrastructure/persistence/firebase/firebase-client';

interface TimelineItem {
  id: string;
  content: string;
  start: string; // 或 Date
}

interface TimelineGroup {
  id: string;
  content: string;
}

const TimelineComponent: React.FC = () => {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<DataSet<TimelineItem>>(new DataSet());
  const [groups, setGroups] = useState<DataSet<TimelineGroup>>(new DataSet());

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'timelineItems'), (snapshot) => {
      const newItems = snapshot.docs.map(doc => ({
        id: doc.id,
        content: doc.data().content,
        start: doc.data().start
      } as TimelineItem));
      setItems(new DataSet(newItems));
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribeGroups = onSnapshot(collection(db, 'groups'), (snapshot) => {
      const newGroups = snapshot.docs.map(doc => ({
        id: doc.id,
        content: doc.data().name
      } as TimelineGroup));
      setGroups(new DataSet(newGroups));
    });

    return () => unsubscribeGroups();
  }, []);

  useEffect(() => {
    if (timelineRef.current) {
      const timeline = new Timeline(timelineRef.current, items, groups, {
        groupOrder: 'content'
      });

      // 監聽拖曳事件
      timeline.on('move', async (event) => {
        const { item, start } = event;
        try {
          await updateDoc(doc(db, 'timelineItems', item), { start: start.toISOString() });
          console.log('Item updated successfully');
        } catch (error) {
          console.error('Error updating item:', error);
        }
      });

      // 監聽添加事件
      timeline.on('add', async (event) => {
        const { content, start } = event;
        try {
          await addDoc(collection(db, 'timelineItems'), { content, start: start.toISOString() });
          console.log('Item added successfully');
        } catch (error) {
          console.error('Error adding item:', error);
        }
      });

      // 監聽刪除事件
      timeline.on('remove', async (event) => {
        const { item } = event;
        try {
          await deleteDoc(doc(db, 'timelineItems', item));
          console.log('Item removed successfully');
        } catch (error) {
          console.error('Error removing item:', error);
        }
      });
    }
  }, [items, groups]);

  // Function to add a new group
  const addGroup = async (name: string) => {
    try {
      await addDoc(collection(db, 'groups'), { name, items: [] });
      console.log('Group added successfully');
    } catch (error) {
      console.error('Error adding group:', error);
    }
  };

  return (
    <div>
      <button onClick={() => addGroup('New Group')}>Add Group</button>
      <div ref={timelineRef} />
    </div>
  );
};

export default TimelineComponent;