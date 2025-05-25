import React, { useEffect, useRef, useState } from 'react';
import { DataSet, Timeline } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase-client';

interface TimelineItem {
  id: string;
  content: string;
  start: string; // ISO format string
  group?: string;
}

interface TimelineGroup {
  id: string;
  content: string;
}

const TimelineComponent: React.FC = () => {
  const timelineContainerRef = useRef<HTMLDivElement | null>(null);
  const timelineInstanceRef = useRef<Timeline | null>(null);

  const itemsRef = useRef<DataSet<TimelineItem>>(new DataSet());
  const groupsRef = useRef<DataSet<TimelineGroup>>(new DataSet());

  // --- Firestore Sync: Items ---
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'timelineItems'), (snapshot) => {
      const newItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as TimelineItem[];

      itemsRef.current.clear();
      itemsRef.current.add(newItems);

      if (timelineInstanceRef.current) {
        timelineInstanceRef.current.setItems(itemsRef.current);
      }
    });

    return () => unsubscribe();
  }, []);

  // --- Firestore Sync: Groups ---
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'groups'), (snapshot) => {
      const newGroups = snapshot.docs.map(doc => ({
        id: doc.id,
        content: doc.data().name,
      })) as TimelineGroup[];

      groupsRef.current.clear();
      groupsRef.current.add(newGroups);

      if (timelineInstanceRef.current) {
        timelineInstanceRef.current.setGroups(groupsRef.current);
      }
    });

    return () => unsubscribe();
  }, []);

  // --- Initialize Timeline ---
  useEffect(() => {
    if (!timelineContainerRef.current) return;

    timelineInstanceRef.current = new Timeline(
      timelineContainerRef.current,
      itemsRef.current,
      groupsRef.current,
      {
        editable: {
          add: true,
          updateTime: true,
          remove: true,
        },
        groupOrder: 'content',
      }
    );

    // --- 拖曳更新 ---
    timelineInstanceRef.current.on('move', async (event) => {
      const { item, start, end } = event;
      try {
        await updateDoc(doc(db, 'timelineItems', item), {
          start: start?.toISOString(),
          end: end?.toISOString(),
        });
      } catch (err) {
        console.error('move error', err);
      }
    });

    // --- 新增事件 ---
    timelineInstanceRef.current.on('add', async (event, callback) => {
      try {
        const newDoc = await addDoc(collection(db, 'timelineItems'), {
          content: event.content || 'New Item',
          start: event.start?.toISOString(),
          end: event.end?.toISOString() || null,
          group: event.group || null,
        });
        callback({ ...event, id: newDoc.id }); // 回傳新 id 給 timeline
      } catch (err) {
        console.error('add error', err);
        callback(null); // 取消
      }
    });

    // --- 刪除事件 ---
    timelineInstanceRef.current.on('remove', async (event, callback) => {
      try {
        await deleteDoc(doc(db, 'timelineItems', event.item));
        callback(event);
      } catch (err) {
        console.error('delete error', err);
        callback(null); // 取消
      }
    });

    return () => {
      timelineInstanceRef.current?.destroy();
    };
  }, []);

  // --- 新增 Group ---
  const addGroup = async (name: string) => {
    try {
      await addDoc(collection(db, 'groups'), {
        name,
      });
    } catch (err) {
      console.error('add group error', err);
    }
  };

  return (
    <div>
      <button onClick={() => addGroup('New Group')}>Add Group</button>
      <div ref={timelineContainerRef} style={{ height: '400px' }} />
    </div>
  );
};

export default TimelineComponent;