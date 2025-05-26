import React, { useEffect, useRef } from 'react';
import { DataSet, Timeline, TimelineOptions } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
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

  // items 只在初始化時用於建立 DataSet，onItemsChange 只在 Firestore 監聽時呼叫
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

    // 拖曳/修改事件
    timelineInstanceRef.current.on('move', async (props: MoveEventProps) => {
      const { item, start, end } = props;
      const itemData = dataSetRef.current?.get(item);
      if (itemData) {
        const itemRef = doc(db, 'schedules', item);
        await updateDoc(itemRef, { start, end });
      }
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

    // 監聽 Firestore 實時更新
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
      dataSetRef.current?.clear();
      // 修正：add(...newItems) 會導致只顯示一個，應展開陣列
      if (newItems.length > 0) {
        dataSetRef.current?.add([...newItems]);
      }
      onItemsChange(newItems);
    });

    return () => {
      timelineInstanceRef.current?.destroy();
      unsubscribe();
    };
  }, []);

  return <div ref={timelineRef} style={{ height: '500px' }} />;
};

export default TimelineComponent;
