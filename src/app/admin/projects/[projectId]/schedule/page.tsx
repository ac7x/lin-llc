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

  // CRUD Handlers
  const handleItemMove = useCallback(async (itemIdString: string, newStart: DateType, newEnd: DateType, newGroupIdString: string) => {
    const item = items.find(i => i.id === itemIdString);
    if (!item) return false;

    const startDate = toDate(newStart);
    const endDate = toDate(newEnd);

    if (item.projectId !== newGroupIdString) {
      await deleteDoc(doc(db, "projects", item.projectId, "flows", itemIdString));
      const ref = await addDoc(collection(db, "projects", newGroupIdString, "flows"), {
        name: item.content,
        start: startDate,
        end: endDate,
        userId: item.userId,
      });
      setItems(prev => prev.map(i => i.id === itemIdString ? { ...i, id: ref.id, group: newGroupIdString, projectId: newGroupIdString, start: startDate, end: endDate } : i));
    } else {
      await updateDoc(doc(db, "projects", newGroupIdString, "flows", itemIdString), { start: startDate, end: endDate });
      setItems(prev => prev.map(i => i.id === itemIdString ? { ...i, start: startDate, end: endDate } : i));
    }
    return true;
  }, [items]);

  const handleItemAdd = useCallback(async (itemData: TimelineItem, cb: (item: Item | null) => void) => {
    if (!user) return cb(null);
    const groupString = String(itemData.group);
    const contentString = String(itemData.content || "新流程"); // Ensure content is a string
    const startDate = itemData.start ? toDate(itemData.start) : new Date();
    const endDate = itemData.end ? toDate(itemData.end) : new Date(Date.now() + 3600000);

    const dataToSave = {
      name: contentString,
      start: startDate,
      end: endDate,
      userId: user.uid,
    };
    const ref = await addDoc(collection(db, "projects", groupString, "flows"), dataToSave);
    const newItem: Item = {
      id: ref.id,
      group: groupString,
      content: contentString,
      start: startDate,
      end: endDate,
      projectId: groupString,
      userId: user.uid,
    };
    setItems(prev => [...prev, newItem]);
    cb(newItem);
  }, [user]);

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
      const projects = await getDocs(collection(db, "projects"));
      // ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓ 修改這一行 ↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
      const groupList: Group[] = projects.docs.map(d => ({ id: d.id, content: d.data().projectName || d.id }));
      // ↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
      setGroups(groupList);
      const allItems: Item[] = [];
      for (const project of projects.docs) {
        const flows = await getDocs(collection(db, "projects", project.id, "flows"));
        allItems.push(...flows.docs.map(f => {
          const d = f.data();
          return {
            id: f.id,
            group: project.id,
            content: d.name,
            start: d.start?.toDate?.() || new Date(),
            end: d.end?.toDate?.() || new Date(Date.now() + 3600000),
            projectId: project.id,
            userId: d.userId,
          } as Item; // Ensure the object conforms to the Item interface
        }));
      }
      setItems(allItems);
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

  // Create Project
  const [n, setN] = useState(""); const addProject = async () => {
    if (!user || !n.trim()) return;
    const ref = await addDoc(collection(db, "projects"), { projectName: n, createdAt: Timestamp.now(), ownerId: user.uid }); // 改成 projectName
    setGroups(g => [...g, { id: ref.id, content: n }]);
    const start = Timestamp.now(), end = Timestamp.fromMillis(start.toMillis() + 3600000);
    const flow = await addDoc(collection(db, "projects", ref.id, "flows"), { name: n + " - 初始流程", start, end, userId: user.uid });
    setItems(i => [...i, { id: flow.id, group: ref.id, content: n + " - 初始流程", start: start.toDate(), end: end.toDate(), projectId: ref.id, userId: user.uid }]);
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