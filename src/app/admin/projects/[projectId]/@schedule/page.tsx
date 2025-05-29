"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { db, auth } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { Timeline, DataSet, TimelineItem, TimelineGroup, TimelineOptions, DateType } from "vis-timeline/standalone";
import { useAuthState } from "react-firebase-hooks/auth";

interface Group extends TimelineGroup {
  id: string;
  content: string;
}

interface Item extends TimelineItem {
  id: string;
  group: string;
  content: string; // Ensure content is string for our internal Item model
  start: Date;
  end: Date;
  projectId: string;
  userId: string;
}

// Helper function to convert DateType to Date
function toDate(dateInput: DateType): Date {
  if (dateInput instanceof Date) {
    return dateInput;
  }
  return new Date(dateInput);
}

export default function ProjectsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [user] = useAuthState(auth);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CRUD Handlers
  const handleItemMove = useCallback(async (itemIdString: string, newStart: DateType, newEnd: DateType, newGroupIdString: string) => {
    const item = items.find(i => i.id === itemIdString);
    if (!item) return false;

    const startDate = toDate(newStart);
    const endDate = toDate(newEnd);

    // 找到新 group (zone) 所屬的 projectId
    let newProjectId = "";
    for (const g of groups) {
      if (g.id === newGroupIdString) {
        const projects = await getDocs(collection(db, "projects"));
        for (const p of projects.docs) {
          const zones = await getDocs(collection(db, "projects", p.id, "zones"));
          if (zones.docs.some(z => z.id === newGroupIdString)) {
            newProjectId = p.id;
            break;
          }
        }
        break;
      }
    }
    if (!newProjectId) return false;

    if (item.projectId !== newProjectId) {
      await deleteDoc(doc(db, "projects", item.projectId, "flows", itemIdString));
      const ref = await addDoc(collection(db, "projects", newProjectId, "flows"), {
        name: item.content,
        start: startDate,
        end: endDate,
        userId: item.userId,
        zoneId: newGroupIdString,
      });
      setItems(prev => prev.map(i => i.id === itemIdString ? { ...i, id: ref.id, group: newGroupIdString, projectId: newProjectId, start: startDate, end: endDate } : i));
    } else {
      await updateDoc(doc(db, "projects", newProjectId, "flows", itemIdString), { start: startDate, end: endDate, zoneId: newGroupIdString });
      setItems(prev => prev.map(i => i.id === itemIdString ? { ...i, start: startDate, end: endDate, group: newGroupIdString } : i));
    }
    return true;
  }, [items, groups]);

  const handleItemAdd = useCallback(async (itemData: TimelineItem, cb: (item: Item | null) => void) => {
    if (!user) return cb(null);
    const zoneId = String(itemData.group);
    const contentString = String(itemData.content || "新流程");
    const startDate = itemData.start ? toDate(itemData.start) : new Date();
    const endDate = itemData.end ? toDate(itemData.end) : new Date(Date.now() + 3600000);

    // 需找到 zone 所屬的 projectId
    let projectId = "";
    for (const g of groups) {
      if (g.id === zoneId) {
        // 反查 projectId
        // 這裡假設 zone id 唯一且不跨 project
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

    const dataToSave = {
      name: contentString,
      start: startDate,
      end: endDate,
      userId: user.uid,
      zoneId,
    };
    const ref = await addDoc(collection(db, "projects", projectId, "flows"), dataToSave);
    const newItem: Item = {
      id: ref.id,
      group: zoneId,
      content: contentString,
      start: startDate,
      end: endDate,
      projectId,
      userId: user.uid,
    };
    setItems(prev => [...prev, newItem]);
    cb(newItem);
  }, [user, groups]);

  const handleItemRemove = useCallback(async (itemData: TimelineItem, cb: (item: TimelineItem | null) => void) => {
    const id = String(itemData.id);
    const target = items.find(i => i.id === id);
    if (!target) return cb(null);
    await deleteDoc(doc(db, "projects", target.projectId, "flows", id));
    setItems(prev => prev.filter(i => i.id !== id));
    cb(itemData);
  }, [items]);

  // Fetch Data
  useEffect(() => {
    (async () => {
      try {
        // 取得所有專案
        const projects = await getDocs(collection(db, "projects"));
        // 取得所有 zone 作為 groups
        const groupList: Group[] = [];
        for (const project of projects.docs) {
          const zones = await getDocs(collection(db, "projects", project.id, "zones"));
          zones.forEach(z => {
            const zd = z.data();
            groupList.push({
              id: z.id,
              content: zd.zoneName || z.id,
            });
          });
        }
        setGroups(groupList);

        // 取得所有 flows，group 設為 zone id
        const allItems: Item[] = [];
        for (const project of projects.docs) {
          const flows = await getDocs(collection(db, "projects", project.id, "flows"));
          flows.forEach(f => {
            const d = f.data();
            // 若 flow 有 zoneId 欄位，則 group 設為 zoneId
            if (d.zoneId) {
              allItems.push({
                id: f.id,
                group: d.zoneId,
                content: d.name,
                start: d.start?.toDate?.() || new Date(),
                end: d.end?.toDate?.() || new Date(Date.now() + 3600000),
                projectId: project.id,
                userId: d.userId,
              });
            }
          });
        }
        setItems(allItems);
        setLoading(false);
      } catch {
        setError("資料載入失敗");
        setLoading(false);
      }
    })();
  }, []);

  // vis-timeline
  useEffect(() => {
    if (!timelineRef.current || groups.length === 0) return; // Wait for groups to load

    const groupsDataSet = new DataSet<Group>(groups);
    const itemsDataSet = new DataSet<Item>(items);

    const timelineOptions: TimelineOptions = {
      editable: { add: true, remove: true, updateTime: true, updateGroup: true },
      onAdd: handleItemAdd,
      onRemove: handleItemRemove,
      onMoving: (item: TimelineItem, callback: (item: TimelineItem | null) => void) => callback(item),
      onMove: async (item: TimelineItem, callback: (item: TimelineItem | null) => void) => {
        // item.id, item.start, item.end, item.group are all DateType or IdType from vis-timeline
        // Assert item.start and item.end are not undefined as they should be present in onMove
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
    await addDoc(collection(db, "projects"), { projectName: n, createdAt: Timestamp.now(), ownerId: user.uid });
    setN("");
  };

  return (
    <main>
      <input value={n} onChange={e => setN(e.target.value)} placeholder="專案名稱" />
      <button onClick={addProject} disabled={!user || !n.trim()}>建立</button>
      {loading ? (
        <div className="p-8 text-gray-500">載入中...</div>
      ) : error ? (
        <div className="p-8 text-red-600">{error}</div>
      ) : groups.length === 0 ? (
        <div className="p-8 text-gray-400">尚無分區（zone），請先建立 zone。</div>
      ) : (
        <div ref={timelineRef} style={{ height: 600 }} />
      )}
    </main>
  );
}