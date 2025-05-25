"use client";

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

const TimelineComponent: React.FC = () => {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [groups, setGroups] = useState<TimelineGroup[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'timelineItems'), (snapshot) => {
      const newItems = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          content: data.content,
          start: data.start,
          end: data.end,
          group: data.group,
        };
      });
      setItems(newItems);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'groups'), (snapshot) => {
      const newGroups = snapshot.docs.map((doc) => ({
        id: doc.id,
        content: doc.data().name,
      }));
      setGroups(newGroups);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (timelineRef.current && items.length >= 0 && groups.length >= 0) {
      const itemDataSet = new DataSet(items);
      const groupDataSet = new DataSet(groups);

      const timeline = new Timeline(timelineRef.current, itemDataSet, groupDataSet, {
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
          await updateDoc(doc(db, 'timelineItems', item), {
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
          const docRef = await addDoc(collection(db, 'timelineItems'), {
            content,
            start: start.toISOString(),
            end: end?.toISOString() || null,
            group,
          });
          itemDataSet.add({
            id: docRef.id,
            content,
            start: start.toISOString(),
            end: end?.toISOString(),
            group,
          });
        } catch (error) {
          console.error('Error adding item:', error);
        }
      });

      timeline.on('remove', async (event) => {
        const { item } = event;
        try {
          await deleteDoc(doc(db, 'timelineItems', item));
          itemDataSet.remove(item);
        } catch (error) {
          console.error('Error removing item:', error);
        }
      });
    }
  }, [items, groups]);

  return <div ref={timelineRef} style={{ height: '500px' }} />;
};

export default TimelineComponent;