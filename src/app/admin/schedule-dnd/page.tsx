"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs, addDoc, doc, updateDoc, Timestamp, deleteDoc } from "firebase/firestore";
import { Timeline, DataSet, TimelineItem, TimelineGroup, TimelineOptions } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.css";
import { auth } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { useAuthState } from "react-firebase-hooks/auth";

type Group = { id: string; content: string; };
type ScheduleItem = {
  id: string;
  group: string; // Corresponds to Group['id']
  content: string;
  start: Date;
  end: Date;
  projectId: string;
  userId: string; // This is your application's user ID, often same as group if groups are users
};

// Interface for items passed by vis-timeline events like onAdd, onRemove
interface TimelineEventItem {
  id?: string | number; // id might be a number or string, and not present for new items
  content?: string | HTMLElement; // Adjusted to include HTMLElement
  start?: Date;
  end?: Date;
  group?: string | number;
  // Add any other properties that vis-timeline might pass and you might use
}

// Type for the callback function in vis-timeline events
type TimelineEventCallback = (item: TimelineEventItem | ScheduleItem | null) => void;


export default function ProjectsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user] = useAuthState(auth);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstance = useRef<Timeline | null>(null);
  const datasetRef = useRef<DataSet<ScheduleItem, 'id'>>(null); // Changed any to ScheduleItem

  const handleItemMove = useCallback(async (itemId: string, newStart: Date, newEnd: Date, newGroupId: string) => {
    const itemInState = items.find(i => i.id === itemId);
    if (!itemInState) {
      console.error("在 items 狀態中找不到項目:", itemId);
      alert("更新日程失敗: 找不到項目。");
      return false;
    }
    
    const scheduleRef = doc(db, "schedules", itemId);
    
    try {
      console.log("正在更新數據庫...", { itemId, newStart, newEnd, newGroupId });
      await updateDoc(scheduleRef, {
        userId: newGroupId, // group ID 对应 userId
        start: Timestamp.fromDate(newStart),
        end: Timestamp.fromDate(newEnd),
      });
      
      setItems(prevItems =>
        prevItems.map(it =>
          it.id === itemId
            ? {
                ...it,
                group: newGroupId,
                userId: newGroupId,
                start: newStart,
                end: newEnd
              }
            : it
        )
      );
      
      console.log("數據庫更新成功");
      return true;
    } catch (error: unknown) {
      console.error("更新數據庫失敗:", error);
      alert("更新日程失敗: " + (error instanceof Error ? error.message : "未知錯誤"));
      return false;
    }
  }, [items]);

  const handleItemAdd = useCallback(async (itemDataFromTimeline: TimelineEventItem, callback: TimelineEventCallback) => {
    if (!user) {
      alert("你需要登入才能新增項目。");
      callback(null);
      return;
    }

    // Provide default values or checks for potentially undefined properties
    const contentString = typeof itemDataFromTimeline.content === 'string' ? itemDataFromTimeline.content : 
                          itemDataFromTimeline.content instanceof HTMLElement ? itemDataFromTimeline.content.innerText : "新排程 (自動建立)";
    const newProjectName = contentString || "新排程 (自動建立)";
    
    const startDate = itemDataFromTimeline.start instanceof Date ? itemDataFromTimeline.start : new Date();
    const endDate = itemDataFromTimeline.end instanceof Date ? itemDataFromTimeline.end : new Date(startDate.getTime() + 86400000); // Default to 1 day duration
    const groupId = typeof itemDataFromTimeline.group === 'string' || typeof itemDataFromTimeline.group === 'number' ? String(itemDataFromTimeline.group) : user.uid; // Default to current user if group is undefined


    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(false);

    try {
      // 1. Create a new project
      const projectRef = await addDoc(collection(db, "projects"), {
        name: newProjectName,
        createdAt: Timestamp.now(),
        // Consider adding ownerId: user.uid if your projects have owners
      });

      // 2. Create the schedule item linked to this new project
      const newScheduleData = {
        projectId: projectRef.id,
        userId: groupId, // Use checked groupId
        start: Timestamp.fromDate(startDate), // Use checked startDate
        end: Timestamp.fromDate(endDate), // Use checked endDate
      };
      const scheduleRef = await addDoc(collection(db, "schedules"), newScheduleData);

      const newItemForState: ScheduleItem = {
        id: scheduleRef.id,
        group: groupId, // Use checked groupId
        content: newProjectName, 
        start: startDate, // Use checked startDate
        end: endDate, // Use checked endDate
        projectId: projectRef.id,
        userId: groupId, // Use checked groupId
      };

      setItems(prev => [...prev, newItemForState]);
      // The timeline will update due to items dependency in its useEffect
      callback(newItemForState);
      setCreateSuccess(true);
    } catch (err: unknown) {
      console.error("新增專案與排程失敗:", err);
      alert("新增失敗: " + (err instanceof Error ? err.message : "未知錯誤"));
      callback(null);
      setCreateError((err as Error).message || "新增失敗");
    } finally {
      setCreateLoading(false);
    }
  }, [user, setItems]);

  const handleItemRemove = useCallback(async (itemDataFromTimeline: TimelineEventItem, callback: TimelineEventCallback) => {
    const itemId = itemDataFromTimeline.id as string; // Assuming id will be a string for existing items
    if (!itemId) {
      callback(null);
      return;
    }

    // Optional: Add a confirmation dialog
    // if (!confirm("確定要刪除此項目嗎？")) {
    //   callback(null);
    //   return;
    // }

    try {
      await deleteDoc(doc(db, "schedules", itemId));
      setItems(prev => prev.filter(it => it.id !== itemId));
      // The timeline will update due to items dependency in its useEffect
      callback(itemDataFromTimeline); // Confirm deletion to timeline
    } catch (error: unknown) {
      console.error("刪除排程失敗:", error);
      alert("刪除排程失敗: " + (error instanceof Error ? error.message : "未知錯誤"));
      callback(null);
    }
  }, [setItems]);

  const handleItemDoubleClick = useCallback(async (properties: any) => { // properties can be any for vis-timeline events
    if (!properties.item) return;

    const itemId = properties.item as string; // Assuming item ID is a string
    const currentItem = items.find(i => i.id === itemId);

    if (!currentItem) {
      console.error("在 items 狀態中找不到項目:", itemId);
      alert("找不到要修改的項目。");
      return;
    }

    const newName = prompt("請輸入新的專案名稱：", currentItem.content);

    if (newName && newName.trim() !== "" && newName !== currentItem.content) {
      setCreateLoading(true); // Indicate loading state
      try {
        // 1. Update the project name in Firestore
        const projectRef = doc(db, "projects", currentItem.projectId);
        await updateDoc(projectRef, { name: newName });

        // 2. Update the item in the local state
        setItems(prevItems =>
          prevItems.map(it =>
            it.id === itemId ? { ...it, content: newName } : it
          )
        );
        
        // 3. Update the item in the timeline's dataset directly
        // This ensures the timeline UI updates immediately if setItems doesn't trigger a re-render that vis-timeline picks up fast enough.
        if (datasetRef.current) {
            const itemInDataSet = datasetRef.current.get(itemId);
            if (itemInDataSet) {
                datasetRef.current.update({ ...itemInDataSet, content: newName });
            }
        }

        alert("專案名稱已更新！");
      } catch (error: unknown) {
        console.error("更新專案名稱失敗:", error);
        alert("更新專案名稱失敗: " + (error instanceof Error ? error.message : "未知錯誤"));
      } finally {
        setCreateLoading(false);
      }
    }
  }, [items, setItems]); // Removed datasetRef from dependencies as it's a ref and doesn't change

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const g = usersSnap.docs.map(doc => ({
          id: doc.id,
          content: doc.data().displayName || doc.data().name || doc.id,
        }));
        setGroups(g);

        const projectsSnap = await getDocs(collection(db, "projects"));
        const p = projectsSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || "未命名專案",
        }));

        const schedulesSnap = await getDocs(collection(db, "schedules"));
        const scheduleItems = schedulesSnap.docs.map(doc => {
          const d = doc.data();
          const pj = p.find(pj => pj.id === d.projectId);
          return {
            id: doc.id,
            group: d.userId,
            content: pj ? pj.name : "未知專案",
            start: d.start ? d.start.toDate() : new Date(),
            end: d.end ? d.end.toDate() : new Date(Date.now() + 86400000),
            projectId: d.projectId,
            userId: d.userId,
          };
        });
        setItems(scheduleItems);
      } catch (err: unknown) {
        setError((err as Error).message || "載入失敗");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!timelineRef.current || loading || error) return;

    const container = timelineRef.current;
    const groupsDataSet = new DataSet<TimelineGroup, 'id'>(groups);
    datasetRef.current = new DataSet<ScheduleItem, 'id'>(items);

    const options: TimelineOptions = {
      editable: {
        add: true,
        remove: true,
        updateTime: true,
        updateGroup: true,
        overrideItems: true,
      },
      onAdd: handleItemAdd as (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void, 
      onRemove: handleItemRemove as (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void,
      onMoving: function(item: TimelineItem, callback: (item: TimelineItem | null) => void) { // Typed item and callback
        callback(item);
      },
      onMove: async function(item: TimelineItem, callback: (item: TimelineItem | null) => void) { // Changed VisTimelineMoveCallback to (item: TimelineItem | null) => void
        // item.start and item.end are Date objects from vis-timeline
        // item.group is the new group id (string)
        console.log("onMove - item 接收到:", { id: item.id, start: item.start, end: item.end, group: item.group });
        const success = await handleItemMove(item.id as string, item.start as Date, item.end as Date, item.group as string);
        if (success) {
          callback(item); // Confirm changes in the timeline
        } else {
          callback(null); // Revert changes in the timeline
        }
      },
      // onDoubleClick is NOT a standard option, will attach listener manually
      snap: (date: Date) => {
        const hour = date.getHours();
        date.setHours(hour - (hour % 12), 0, 0, 0);
        return date;
      },
      orientation: {
        axis: "both",
        item: "top",
      }
    };

    try {
      timelineInstance.current = new Timeline(container, datasetRef.current, groupsDataSet, options);
      console.log('Timeline 已初始化');

      // Manually attach the doubleClick event listener
      if (timelineInstance.current) {
        timelineInstance.current.on('doubleClick', handleItemDoubleClick);
      }

    } catch (err) {
      console.error("Timeline 初始化失敗:", err);
    }

    return () => {
      if (timelineInstance.current) {
        // Manually remove the doubleClick event listener
        timelineInstance.current.off('doubleClick', handleItemDoubleClick);
        timelineInstance.current.destroy();
      }
    };
  }, [loading, error, items, groups, handleItemMove, handleItemAdd, handleItemRemove, handleItemDoubleClick]); // Added handleItemDoubleClick to dependencies

  const handleCreateProject = async () => {
    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(false);
    if (!user || !newProjectName.trim()) {
      setCreateError("專案名稱不能為空且需要登入。");
      setCreateLoading(false);
      return;
    }
    try {
      const projectRef = await addDoc(collection(db, "projects"), {
        name: newProjectName,
        createdAt: Timestamp.now(),
      });
      const start = Timestamp.now();
      const end = Timestamp.fromMillis(start.toMillis() + 86400000);
      const scheduleRef = await addDoc(collection(db, "schedules"), {
        projectId: projectRef.id,
        userId: user.uid,
        start,
        end,
      });
      const newItem = {
        id: scheduleRef.id,
        group: user.uid,
        content: newProjectName,
        start: start.toDate(),
        end: end.toDate(),
        projectId: projectRef.id,
        userId: user.uid,
      };
      setItems(prev => [...prev, newItem]);
      setCreateSuccess(true);
      setNewProjectName("");
    } catch (err: unknown) {
      setCreateError((err as Error).message || "建立專案失敗");
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <main>
      <h1>專案時程表</h1>
      <p>以時間軸方式檢視所有專案日程。</p>
      <div style={{ marginBottom: 8 }}>
        <input
          type="text"
          placeholder="請輸入專案名稱"
          value={newProjectName}
          onChange={e => setNewProjectName(e.target.value)}
          disabled={createLoading}
          style={{ marginRight: 8 }}
        />
        <button onClick={handleCreateProject} disabled={createLoading || !user || !newProjectName.trim()}>
          {createLoading ? "建立中..." : "建立專案"}
        </button>
      </div>
      {createError && <div style={{ color: "red" }}>{createError}</div>}
      {createSuccess && <div style={{ color: "green" }}>專案已建立！</div>}
      {loading && <div>載入中...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {!loading && !error && (
        <div ref={timelineRef} style={{ height: "600px" }} />
      )}
    </main>
  );
}