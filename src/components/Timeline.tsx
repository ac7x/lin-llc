import React, { useEffect, useRef, useState } from 'react';
import { DataSet, Timeline } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import { collection, onSnapshot, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase-client';

interface TimelineItem {
  id: string;
  content: string;
  start: string;
  end?: string;
  group?: string;
}

interface TimelineGroup {
  id: string;
  content: string;
}

const TIMELINE_ID = 'default'; // 可根據實際應用改變

const TimelineComponent: React.FC = () => {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<DataSet<TimelineItem>>(new DataSet());
  const [groups, setGroups] = useState<DataSet<TimelineGroup>>(new DataSet());

  useEffect(() => {
    const itemsRef = collection(db, 'timelines', TIMELINE_ID, 'items');
    const unsubscribe = onSnapshot(itemsRef, (snapshot) => {
      const newItems = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          content: data.content,
          start: data.start,
          end: data.end,
          group: data.group,
        } as TimelineItem;
      });
      setItems(new DataSet(newItems));
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const groupsRef = collection(db, 'timelines', TIMELINE_ID, 'groups');
    const unsubscribeGroups = onSnapshot(groupsRef, (snapshot) => {
      const newGroups = snapshot.docs.map(doc => ({
        id: doc.id,
        content: doc.data().name,
      }));
      setGroups(new DataSet(newGroups));
    });

    return () => unsubscribeGroups();
  }, []);

  useEffect(() => {
    if (timelineRef.current) {
      const timeline = new Timeline(timelineRef.current, items, groups, {
        groupOrder: 'content',
        editable: {
          add: true,
          updateTime: true,
          remove: true,
        },
      });

      timeline.on('move', async (event) => {
        const { item, start, end } = event;
        try {
          await updateDoc(doc(db, 'timelines', TIMELINE_ID, 'items', item), {
            start: start.toISOString(),
            end: end?.toISOString() || null,
          });
        } catch (error) {
          console.error('Error updating item:', error);
        }
      });

      timeline.on('add', async (event) => {
        const { content, start, end, group } = event;
        try {
          await addDoc(collection(db, 'timelines', TIMELINE_ID, 'items'), {
            content,
            start: start.toISOString(),
            end: end?.toISOString() || null,
            group,
          });
        } catch (error) {
          console.error('Error adding item:', error);
        }
      });

      timeline.on('remove', async (event) => {
        const { item } = event;
        try {
          await deleteDoc(doc(db, 'timelines', TIMELINE_ID, 'items', item));
        } catch (error) {
          console.error('Error removing item:', error);
        }
      });
    }
  }, [items, groups]);

  return <div ref={timelineRef} style={{ height: '500px' }} />;
};

export default TimelineComponent;