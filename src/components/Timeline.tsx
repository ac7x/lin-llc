import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Timeline as VisTimeline, DataSet } from 'vis-timeline/standalone';
import 'vis-timeline/styles/vis-timeline-graph2d.min.css';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  deleteDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../modules/shared/infrastructure/persistence/firebase/firebase-client';

interface TimelineItem {
  id: string;
  content: string;
  start: Date;
  end?: Date;
  group?: string;
  className?: string;
  type?: 'box' | 'point' | 'range' | 'background';
  title?: string;
}

interface TimelineGroup {
  id: string;
  content: string;
  order?: number;
}

interface TimelineProps {
  collectionName?: string;
  groupsCollectionName?: string;
  options?: any;
  className?: string;
}

const Timeline: React.FC<TimelineProps> = ({
  collectionName = 'timeline-items',
  groupsCollectionName = 'timeline-groups',
  options = {},
  className = ''
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstance = useRef<VisTimeline | null>(null);
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [groups, setGroups] = useState<TimelineGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 預設配置選項
  const defaultOptions = {
    editable: {
      add: true,
      updateTime: true,
      updateGroup: true,
      remove: true,
      overrideItems: false
    },
    onAdd: async (item: any, callback: (item: any) => void) => {
      try {
        const newItem = {
          content: item.content || '新項目',
          start: item.start instanceof Date ? Timestamp.fromDate(item.start) : Timestamp.now(),
          end: item.end ? (item.end instanceof Date ? Timestamp.fromDate(item.end) : null) : null,
          group: item.group || null,
          className: item.className || '',
          type: item.type || 'box',
          title: item.title || ''
        };

        const docRef = await addDoc(collection(db, collectionName), newItem);
        callback({ ...item, id: docRef.id });
      } catch (error) {
        console.error('添加項目時出錯:', error);
        callback(null);
      }
    },
    onUpdate: async (item: any, callback: (item: any) => void) => {
      try {
        const updateData: any = {
          content: item.content,
          start: item.start instanceof Date ? Timestamp.fromDate(item.start) : Timestamp.now(),
        };

        if (item.end) {
          updateData.end = item.end instanceof Date ? Timestamp.fromDate(item.end) : null;
        }

        if (item.group !== undefined) {
          updateData.group = item.group;
        }

        if (item.className) {
          updateData.className = item.className;
        }

        if (item.type) {
          updateData.type = item.type;
        }

        if (item.title) {
          updateData.title = item.title;
        }

        await updateDoc(doc(db, collectionName, item.id), updateData);
        callback(item);
      } catch (error) {
        console.error('更新項目時出錯:', error);
        callback(null);
      }
    },
    onRemove: async (item: any, callback: (item: any) => void) => {
      try {
        await deleteDoc(doc(db, collectionName, item.id));
        callback(item);
      } catch (error) {
        console.error('刪除項目時出錯:', error);
        callback(null);
      }
    },
    onMove: async (item: any, callback: (item: any) => void) => {
      try {
        const updateData: any = {
          start: item.start instanceof Date ? Timestamp.fromDate(item.start) : Timestamp.now(),
        };

        if (item.end) {
          updateData.end = item.end instanceof Date ? Timestamp.fromDate(item.end) : null;
        }

        if (item.group !== undefined) {
          updateData.group = item.group;
        }

        await updateDoc(doc(db, collectionName, item.id), updateData);
        callback(item);
      } catch (error) {
        console.error('移動項目時出錯:', error);
        callback(null);
      }
    },
    ...options
  };

  // 從 Firestore 轉換數據格式
  const convertFirestoreToTimelineItem = useCallback((doc: any): TimelineItem => {
    const data = doc.data();
    return {
      id: doc.id,
      content: data.content || '',
      start: data.start?.toDate() || new Date(),
      end: data.end?.toDate() || undefined,
      group: data.group || undefined,
      className: data.className || undefined,
      type: data.type || 'box',
      title: data.title || undefined
    };
  }, []);

  const convertFirestoreToTimelineGroup = useCallback((doc: any): TimelineGroup => {
    const data = doc.data();
    return {
      id: doc.id,
      content: data.content || '',
      order: data.order || 0
    };
  }, []);

  // 監聽 Firestore 數據變化
  useEffect(() => {
    const unsubscribeItems = onSnapshot(
      collection(db, collectionName),
      (snapshot) => {
        const timelineItems = snapshot.docs.map(convertFirestoreToTimelineItem);
        setItems(timelineItems);
        setIsLoading(false);
      },
      (error) => {
        console.error('監聽項目時出錯:', error);
        setIsLoading(false);
      }
    );

    const unsubscribeGroups = onSnapshot(
      collection(db, groupsCollectionName),
      (snapshot) => {
        const timelineGroups = snapshot.docs.map(convertFirestoreToTimelineGroup);
        setGroups(timelineGroups);
      },
      (error) => {
        console.error('監聽群組時出錯:', error);
      }
    );

    return () => {
      unsubscribeItems();
      unsubscribeGroups();
    };
  }, [collectionName, groupsCollectionName, convertFirestoreToTimelineItem, convertFirestoreToTimelineGroup]);

  // 初始化 vis-timeline
  useEffect(() => {
    if (!timelineRef.current || isLoading) return;

    try {
      // 創建 DataSet
      const itemsDataSet = new DataSet(items);
      const groupsDataSet = groups.length > 0 ? new DataSet(groups) : undefined;

      // 創建 timeline 實例
      timelineInstance.current = new VisTimeline(
        timelineRef.current,
        itemsDataSet,
        groupsDataSet,
        defaultOptions
      );

      // 添加事件監聽器
      timelineInstance.current.on('select', (properties) => {
        console.log('選中項目:', properties);
      });

      timelineInstance.current.on('doubleClick', (properties) => {
        console.log('雙擊:', properties);
      });

    } catch (error) {
      console.error('初始化 timeline 時出錯:', error);
    }

    // 清理函數
    return () => {
      if (timelineInstance.current) {
        timelineInstance.current.destroy();
        timelineInstance.current = null;
      }
    };
  }, [items, groups, isLoading, defaultOptions]);

  // 公開方法
  const addItem = async (item: Omit<TimelineItem, 'id'>) => {
    try {
      const newItem = {
        content: item.content,
        start: Timestamp.fromDate(item.start),
        end: item.end ? Timestamp.fromDate(item.end) : null,
        group: item.group || null,
        className: item.className || '',
        type: item.type || 'box',
        title: item.title || ''
      };

      await addDoc(collection(db, collectionName), newItem);
    } catch (error) {
      console.error('添加項目時出錯:', error);
      throw error;
    }
  };

  const updateItem = async (id: string, updates: Partial<TimelineItem>) => {
    try {
      const updateData: any = {};
      
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.start !== undefined) updateData.start = Timestamp.fromDate(updates.start);
      if (updates.end !== undefined) updateData.end = updates.end ? Timestamp.fromDate(updates.end) : null;
      if (updates.group !== undefined) updateData.group = updates.group;
      if (updates.className !== undefined) updateData.className = updates.className;
      if (updates.type !== undefined) updateData.type = updates.type;
      if (updates.title !== undefined) updateData.title = updates.title;

      await updateDoc(doc(db, collectionName, id), updateData);
    } catch (error) {
      console.error('更新項目時出錯:', error);
      throw error;
    }
  };

  const removeItem = async (id: string) => {
    try {
      await deleteDoc(doc(db, collectionName, id));
    } catch (error) {
      console.error('刪除項目時出錯:', error);
      throw error;
    }
  };

  const fit = () => {
    if (timelineInstance.current) {
      timelineInstance.current.fit();
    }
  };

  const setWindow = (start: Date, end: Date) => {
    if (timelineInstance.current) {
      timelineInstance.current.setWindow(start, end);
    }
  };

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="text-lg">載入時間軸...</div>
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      <div
        ref={timelineRef}
        className="w-full h-full min-h-[400px] border border-gray-300 rounded-lg"
        style={{ minHeight: '400px' }}
      />
    </div>
  );
};

export default Timeline;