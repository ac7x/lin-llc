import React, { useEffect, useRef, useState } from 'react';
import { DataSet, Timeline } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import { collection, onSnapshot, addDoc } from 'firebase/firestore';
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
      const options = {
        groupOrder: 'content' // Order groups by content
      };

      new Timeline(timelineRef.current, items, groups, options);
    }
  }, [items, groups]);

  // Function to add a new group
  const addGroup = async (name: string) => {
    await addDoc(collection(db, 'groups'), { name, items: [] });
  };

  return (
    <div>
      <button onClick={() => addGroup('New Group')}>Add Group</button>
      <div ref={timelineRef} />
    </div>
  );
};

export default TimelineComponent;
