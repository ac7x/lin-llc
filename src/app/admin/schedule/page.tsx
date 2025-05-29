"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { db, auth } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { Timeline, DataSet } from "vis-timeline/standalone";
import { useAuthState } from "react-firebase-hooks/auth";

export default function ProjectsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [user] = useAuthState(auth);
  const timelineRef = useRef<HTMLDivElement>(null);

  // CRUD Handlers
  const handleItemMove = useCallback(async (id: string, start: Date, end: Date, group: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return false;
    if (item.projectId !== group) {
      await deleteDoc(doc(db, "projects", item.projectId, "flows", id));
      const ref = await addDoc(collection(db, "projects", group, "flows"), {
        name: item.content, start, end, userId: item.userId,
      });
      setItems(prev => prev.map(i => i.id === id ? { ...i, id: ref.id, group, projectId: group, start, end } : i));
    } else {
      await updateDoc(doc(db, "projects", group, "flows", id), { start, end });
      setItems(prev => prev.map(i => i.id === id ? { ...i, start, end } : i));
    }
    return true;
  }, [items]);

  const handleItemAdd = useCallback(async (item: any, cb: any) => {
    if (!user) return cb(null);
    const group = String(item.group);
    const data = {
      name: item.content || "新流程",
      start: item.start || new Date(),
      end: item.end || new Date(Date.now() + 3600000),
      userId: user.uid,
    };
    const ref = await addDoc(collection(db, "projects", group, "flows"), data);
    const newItem = { ...data, id: ref.id, group, projectId: group };
    setItems(prev => [...prev, newItem]);
    cb(newItem);
  }, [user]);

  const handleItemRemove = useCallback(async (item: any, cb: any) => {
    const id = item.id;
    const target = items.find(i => i.id === id);
    if (!target) return cb(null);
    await deleteDoc(doc(db, "projects", target.projectId, "flows", id));
    setItems(prev => prev.filter(i => i.id !== id));
    cb(item);
  }, [items]);

  // Fetch Data
  useEffect(() => {
    (async () => {
      const projects = await getDocs(collection(db, "projects"));
      const groupList = projects.docs.map(d => ({ id: d.id, content: d.data().name || d.id }));
      setGroups(groupList);
      let allItems: any[] = [];
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
          };
        }));
      }
      setItems(allItems);
    })();
  }, []);

  // vis-timeline
  useEffect(() => {
    if (!timelineRef.current) return;
    const groupsDataSet = new DataSet(groups);
    const itemsDataSet = new DataSet(items);
    const timeline = new Timeline(timelineRef.current, itemsDataSet, groupsDataSet, {
      editable: { add: true, remove: true, updateTime: true, updateGroup: true },
      onAdd: handleItemAdd,
      onRemove: handleItemRemove,
      onMoving: (item: any, cb: any) => cb(item),
      onMove: async (item: any, cb: any) => cb(await handleItemMove(item.id, item.start, item.end, String(item.group)) ? item : null),
    });
    return () => timeline.destroy();
  }, [groups, items, handleItemAdd, handleItemMove, handleItemRemove]);

  // Create Project
  const [n, setN] = useState(""); const addProject = async () => {
    if (!user || !n.trim()) return;
    const ref = await addDoc(collection(db, "projects"), { name: n, createdAt: Timestamp.now(), ownerId: user.uid });
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