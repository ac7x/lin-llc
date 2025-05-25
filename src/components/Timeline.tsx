import React, { useEffect, useRef, useState } from 'react';
import { DataSet, Timeline } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../modules/shared/infrastructure/persistence/firebase/firebase-client';

const TimelineComponent: React.FC = () => {
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const [items, setItems] = useState<DataSet<any>>(new DataSet());

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'timelineItems'), (snapshot) => {
      const newItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(new DataSet(newItems));
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (timelineRef.current) {
      const options = {
        // Timeline options
      };

      new Timeline(timelineRef.current, items, options);
    }
  }, [items]);

  return <div ref={timelineRef} />;
};

export default TimelineComponent;
