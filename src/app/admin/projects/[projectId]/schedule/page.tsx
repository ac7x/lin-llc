"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { db, auth } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs, addDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { Timeline, DataSet, TimelineItem, TimelineGroup, TimelineOptions, DateType } from "vis-timeline/standalone";
import { useAuthState } from "react-firebase-hooks/auth";

interface Group extends TimelineGroup {
  id: string;
  content: string;
}

interface Item extends TimelineItem {
  id: string;
  group: string;
  content: string;
  start: Date;
  end: Date;
  projectId: string;
  userId: string;
  itemName: string;
  desc?: string;
}

type WorkItem = {
  id: string;
  itemName: string;
  desc?: string;
  createdAt?: any;
  start?: string;
  end?: string;
  userId?: string;
};

// Helper function to convert DateType to Date
function toDate(dateInput: DateType): Date {
  if (dateInput instanceof Date) return dateInput;
  return new Date(dateInput);
}

export default function ProjectsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [user] = useAuthState(auth);
  const timelineRef = useRef<HTMLDivElement>(null);

  // CRUD Handlers
  // 移動 item 時，更新 zone 的 workItems 陣列
  const handleItemMove = useCallback(async (itemIdString: string, newStart: DateType, newEnd: DateType, newGroupIdString: string) => {
    const item = items.find(i => i.id === itemIdString);
    if (!item) return false;

    const startDate = toDate(newStart);
    const endDate = toDate(newEnd);

    // 找到原 zone
    const oldZoneId = item.group;
    const oldZoneRef = doc(db, "projects", item.projectId, "zones", oldZoneId);
    const oldZoneSnap = await getDoc(oldZoneRef);
    if (!oldZoneSnap.exists()) return false;
    const oldZoneData = oldZoneSnap.data();
    const oldWorkItems: WorkItem[] = Array.isArray(oldZoneData.workItems) ? oldZoneData.workItems : [];

    // 找到新 zone
    let newProjectId = item.projectId;
    let newZoneRef = doc(db, "projects", item.projectId, "zones", newGroupIdString);
    let newZoneSnap = await getDoc(newZoneRef);
    if (!newZoneSnap.exists()) {
      // 跨 project 的 zone（理論上 zoneId 唯一，不會跨 project）
      // 但保留原本的查找方式
      const projects = await getDocs(collection(db, "projects"));
      for (const p of projects.docs) {
        const zones = await getDocs(collection(db, "projects", p.id, "zones"));
        if (zones.docs.some(z => z.id === newGroupIdString)) {
          newProjectId = p.id;
          newZoneRef = doc(db, "projects", newProjectId, "zones", newGroupIdString);
          newZoneSnap = await getDoc(newZoneRef);
          break;
        }
      }
      if (!newZoneSnap.exists()) return false;
    }
    const newZoneData = newZoneSnap.data();
    const newWorkItems: WorkItem[] = Array.isArray(newZoneData.workItems) ? newZoneData.workItems : [];

    // 從舊 zone 移除
    const movedItem = oldWorkItems.find(wi => wi.id === itemIdString);
    if (!movedItem) return false;
    const updatedOldWorkItems = oldWorkItems.filter(wi => wi.id !== itemIdString);

    // 新 item
    const newItem: WorkItem = {
      ...movedItem,
      start: startDate.toISOString().slice(0, 10),
      end: endDate.toISOString().slice(0, 10),
    };

    // 新 zone 加入
    const updatedNewWorkItems = [...newWorkItems, newItem];

    // 更新兩個 zone
    await updateDoc(oldZoneRef, { workItems: updatedOldWorkItems });
    await updateDoc(newZoneRef, { workItems: updatedNewWorkItems });

    setItems(prev =>
      prev.map(i =>
        i.id === itemIdString
          ? {
            ...i,
            group: newGroupIdString,
            projectId: newProjectId,
            start: startDate,
            end: endDate,
            content: movedItem.itemName,
            itemName: movedItem.itemName,
          }
          : i
      )
    );
    return true;
  }, [items, groups]);

  // 新增 item 時，直接加到 zone 的 workItems
  const handleItemAdd = useCallback(async (itemData: TimelineItem, cb: (item: Item | null) => void) => {
    if (!user) return cb(null);
    const zoneId = String(itemData.group);
    const contentString = String(itemData.content || "新流程");
    const startDate = itemData.start ? toDate(itemData.start) : new Date();
    const endDate = itemData.end ? toDate(itemData.end) : new Date(Date.now() + 3600000);

    // 找到 zone 所屬的 projectId
    let projectId = "";
    for (const g of groups) {
      if (g.id === zoneId) {
        const projects = await getDocs(collection(db, "projects"));
        for (const p of projects.docs) {
          const zones = await getDocs(collection(db, "projects", p.id, "zones"));
          if (zones.docs.some(z => z.id === zoneId)) {
            projectId = p.id;
            break;
          }
        }
        break;
      }
    }
    if (!projectId) return cb(null);

    // 取得 zone 文件
    const zoneRef = doc(db, "projects", projectId, "zones", zoneId);
    const zoneSnap = await getDoc(zoneRef);
    if (!zoneSnap.exists()) return cb(null);
    const zoneData = zoneSnap.data();
    const oldWorkItems: WorkItem[] = Array.isArray(zoneData.workItems) ? zoneData.workItems : [];
    const newWorkItem: WorkItem = {
      id: crypto.randomUUID(),
      itemName: contentString,
      userId: user.uid,
      start: startDate.toISOString().slice(0, 10),
      end: endDate.toISOString().slice(0, 10),
    };
    const newWorkItems = [...oldWorkItems, newWorkItem];
    await updateDoc(zoneRef, { workItems: newWorkItems });

    const newItem: Item = {
      id: newWorkItem.id,
      group: zoneId,
      content: contentString,
      start: startDate,
      end: endDate,
      projectId,
      userId: user.uid,
      itemName: contentString,
    };
    setItems(prev => [...prev, newItem]);
    cb(newItem);
  }, [user, groups]);

  // 刪除 item 時，從 zone 的 workItems 移除
  const handleItemRemove = useCallback(async (itemData: TimelineItem, cb: (item: TimelineItem | null) => void) => {
    const id = String(itemData.id);
    const target = items.find(i => i.id === id);
    if (!target) return cb(null);

    const zoneRef = doc(db, "projects", target.projectId, "zones", target.group);
    const zoneSnap = await getDoc(zoneRef);
    if (!zoneSnap.exists()) return cb(null);
    const zoneData = zoneSnap.data();
    const oldWorkItems: WorkItem[] = Array.isArray(zoneData.workItems) ? zoneData.workItems : [];
    const newWorkItems = oldWorkItems.filter(wi => wi.id !== id);
    await updateDoc(zoneRef, { workItems: newWorkItems });

    setItems(prev => prev.filter(i => i.id !== id));
    cb(itemData);
  }, [items]);

  // Fetch Data
  useEffect(() => {
    (async () => {
      // 取得所有專案
      const projects = await getDocs(collection(db, "projects"));
      // 取得所有 zone 作為 groups
      const groupList: Group[] = [];
      const allItems: Item[] = [];
      for (const project of projects.docs) {
        const zones = await getDocs(collection(db, "projects", project.id, "zones"));
        zones.forEach(z => {
          const zd = z.data();
          groupList.push({
            id: z.id,
            content: zd.zoneName || z.id,
          });
          // 取得 workItems
          if (Array.isArray(zd.workItems)) {
            zd.workItems.forEach((wi: WorkItem) => {
              allItems.push({
                id: wi.id,
                group: z.id,
                content: wi.itemName,
                start: wi.start ? new Date(wi.start) : new Date(),
                end: wi.end ? new Date(wi.end) : new Date(Date.now() + 3600000),
                projectId: project.id,
                userId: wi.userId || "",
                itemName: wi.itemName,
                desc: wi.desc,
              });
            });
          }
        });
      }
      setGroups(groupList);
      setItems(allItems);
    })();
  }, []);

  // vis-timeline
  useEffect(() => {
    if (!timelineRef.current || groups.length === 0) return;

    const groupsDataSet = new DataSet<Group>(groups);
    const itemsDataSet = new DataSet<Item>(items);

    const timelineOptions: TimelineOptions = {
      editable: { add: true, remove: true, updateTime: true, updateGroup: true },
      onAdd: handleItemAdd,
      onRemove: handleItemRemove,
      onMoving: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => callback(item),
      onMove: async (item: TimelineItem, callback: (item: TimelineItem | null) => void) => {
        const success = await handleItemMove(String(item.id), item.start!, item.end!, String(item.group));
        callback(success ? item : null);
      },
    };
    const timeline = new Timeline(timelineRef.current, itemsDataSet, groupsDataSet, timelineOptions);
    return () => timeline.destroy();
  }, [groups, items, handleItemAdd, handleItemMove, handleItemRemove]);

  // 建立專案時不再自動建立 group，需另外建立 zone
  const [n, setN] = useState("");
  const addProject = async () => {
    if (!user || !n.trim()) return;
    await addDoc(collection(db, "projects"), { projectName: n, createdAt: new Date(), ownerId: user.uid });
    setN("");
  };

  return (
    <main>
      <input value={n} onChange={e => setN(e.target.value)} placeholder="專案名稱" />
      <button onClick={addProject} disabled={!user || !n.trim()}>建立</button>
      <div ref={timelineRef} style={{ height: 600 }} />
    </main>
  );
}