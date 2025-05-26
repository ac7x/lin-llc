import React, { useEffect, useRef } from 'react';
import { DataSet, Timeline, TimelineOptions } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  QueryDocumentSnapshot, 
  DocumentData 
} from 'firebase/firestore';
import { db } from '../modules/shared/infrastructure/persistence/firebase/firebase-client';

export interface TimelineItem {
  id: string;
  content: string;
  start: string | Date;
  end?: string | Date;
  group?: string;
}

interface TimelineProps {
  items: TimelineItem[];
  onItemsChange: (items: TimelineItem[]) => void;
}

interface MoveEventProps {
  item: string;
  start: Date | string;
  end?: Date | string;
}

interface RemoveEventProps {
  items: string[];
}

interface AddEventProps {
  start: Date | string;
  end?: Date | string;
  content: string;
  group?: string;
}

const TimelineComponent: React.FC<TimelineProps> = ({ items, onItemsChange }) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const dataSetRef = useRef<DataSet<TimelineItem> | null>(null);
  const timelineInstanceRef = useRef<Timeline | null>(null);

  // 用來快取目前 DataSet 狀態，避免 onSnapshot 重複更新
  const latestItemsRef = useRef<TimelineItem[]>([]);

  useEffect(() => {
    if (!timelineRef.current) return;

    dataSetRef.current = new DataSet<TimelineItem>(items);

    const options: TimelineOptions = {
      editable: {
        add: true,
        updateTime: true,
        remove: true,
      },
      stack: false,
      margin: { item: 10, axis: 5 },
    };

    timelineInstanceRef.current = new Timeline(timelineRef.current, dataSetRef.current, options);

    // 拖曳/修改事件：先本地更新，後同步 Firestore
    timelineInstanceRef.current.on('move', async (props: MoveEventProps) => {
      const { item, start, end } = props;
      dataSetRef.current?.update({ id: item, start, end });
      const itemRef = doc(db, 'schedules', item);
      await updateDoc(itemRef, { start, end });
    });

    // 刪除事件
    timelineInstanceRef.current.on('remove', async (props: RemoveEventProps) => {
      for (const itemId of props.items) {
        const itemRef = doc(db, 'schedules', itemId);
        await deleteDoc(itemRef);
      }
    });

    // 新增事件
    timelineInstanceRef.current.on('add', async (props: AddEventProps) => {
      const { start, end, content, group } = props;
      const docRef = await addDoc(collection(db, 'schedules'), { start, end, content, group });
      dataSetRef.current?.update({ ...props, id: docRef.id });
    });

    // 監聽 Firestore schedule 集合
    const unsubscribe = onSnapshot(collection(db, 'schedules'), (snapshot) => {
      const newItems: TimelineItem[] = [];
      snapshot.forEach((docSnap: QueryDocumentSnapshot<DocumentData>) => {
        const data = docSnap.data();
        newItems.push({
          id: docSnap.id,
          content: data.content,
          start: data.start,
          end: data.end,
          group: data.group,
        });
      });

      // 比對新舊資料，僅在變動時才更新
      const prev = latestItemsRef.current;
      const isDiff = 
        newItems.length !== prev.length ||
        newItems.some((item, idx) => {
          const prevItem = prev[idx];
          return (
            !prevItem ||
            item.id !== prevItem.id ||
            item.content !== prevItem.content ||
            item.start !== prevItem.start ||
            item.end !== prevItem.end ||
            item.group !== prevItem.group
          );
        });

      if (isDiff) {
        dataSetRef.current?.clear();
        if (newItems.length > 0) {
          dataSetRef.current?.add([...newItems]);
        }
        latestItemsRef.current = newItems;
        onItemsChange(newItems);
      }
    });

    return () => {
      timelineInstanceRef.current?.destroy();
      unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div ref={timelineRef} style={{ height: '500px' }} />;
};

export default TimelineComponent;
