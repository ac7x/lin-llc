"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { db, auth } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { Timeline, DataSet, TimelineItem, TimelineOptions, TimelineEventPropertiesResult } from "vis-timeline/standalone";
import { useAuthState } from "react-firebase-hooks/auth";
import "vis-timeline/styles/vis-timeline-graph2d.css";

type Group = { id: string; content: string; };
type FlowItem = {
  id: string;
  group: string;
  content: string;
  start: Date;
  end: Date;
  projectId: string;
  userId?: string;
};

interface TimelineEventItem {
  id?: string | number;
  content?: string | HTMLElement;
  start?: Date;
  end?: Date;
  group?: string | number;
}
type TimelineEventCallback = (item: TimelineEventItem | FlowItem | null) => void;

export default function ProjectsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [items, setItems] = useState<FlowItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user] = useAuthState(auth);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstance = useRef<Timeline | null>(null);
  const isProcessingDoubleClick = useRef(false);

  // --- Item CRUD Handlers ---

  // 移動流程（更新 flows 子集合文件）
  const handleItemMove = useCallback(
    async (itemId: string, newStart: Date, newEnd: Date, newGroupId: string): Promise<boolean> => {
      // 先找出此 flow 屬於哪一個 project
      const oldItem = items.find(it => it.id === itemId);
      if (!oldItem) return false;
      // 若 group 變動，需從原 project flows subcollection 移除並新增到新 project
      if (oldItem.projectId !== newGroupId) {
        try {
          // 1. 刪除原本 flows 文件
          await deleteDoc(doc(db, "projects", oldItem.projectId, "flows", itemId));
          // 2. 在新 project flows 建立新文件
          const newFlowRef = await addDoc(collection(db, "projects", newGroupId, "flows"), {
            name: oldItem.content,
            start: Timestamp.fromDate(newStart),
            end: Timestamp.fromDate(newEnd),
            userId: oldItem.userId,
          });
          setItems(prev =>
            prev.map(it =>
              it.id === itemId
                ? { ...it, id: newFlowRef.id, group: newGroupId, projectId: newGroupId, start: newStart, end: newEnd }
                : it
            )
          );
          return true;
        } catch (error: unknown) {
          const e = error as Error;
          alert("跨專案移動流程失敗: " + (e?.message || "未知錯誤"));
          return false;
        }
      } else {
        // 僅在同 project flows 文件內更新
        try {
          await updateDoc(doc(db, "projects", newGroupId, "flows", itemId), {
            start: Timestamp.fromDate(newStart),
            end: Timestamp.fromDate(newEnd),
          });
          setItems(prev =>
            prev.map(it =>
              it.id === itemId
                ? { ...it, start: newStart, end: newEnd }
                : it
            )
          );
          return true;
        } catch (error: unknown) {
          const e = error as Error;
          alert("更新流程失敗: " + (e?.message || "未知錯誤"));
          return false;
        }
      }
    },
    [items]
  );

  // 新增流程到指定 project 的 flows 子集合
  const handleItemAdd = useCallback(
    async (item: TimelineEventItem, cb: TimelineEventCallback) => {
      if (!user) return cb(null);
      const flowName =
        typeof item.content === "string"
          ? item.content
          : item.content instanceof HTMLElement
            ? item.content.innerText
            : "新流程";
      const startDate = item.start instanceof Date ? item.start : new Date();
      const endDate =
        item.end instanceof Date ? item.end : new Date(startDate.getTime() + 3600000);
      const groupId =
        typeof item.group === "string" || typeof item.group === "number"
          ? String(item.group)
          : null;
      if (!groupId) return cb(null);

      setCreateLoading(true);
      setCreateError(null);
      setCreateSuccess(false);
      try {
        const newFlowData = {
          name: flowName,
          start: Timestamp.fromDate(startDate),
          end: Timestamp.fromDate(endDate),
          userId: user.uid,
        };
        const flowRef = await addDoc(collection(db, "projects", groupId, "flows"), newFlowData);
        const newItem: FlowItem = {
          id: flowRef.id,
          group: groupId,
          content: flowName,
          start: startDate,
          end: endDate,
          projectId: groupId,
          userId: user.uid,
        };
        setItems(prev => [...prev, newItem]);
        cb(newItem);
        setCreateSuccess(true);
      } catch (err: unknown) {
        const e = err as Error;
        alert("新增流程失敗: " + (e?.message || "未知錯誤"));
        cb(null);
        setCreateError(e?.message || "新增流程失敗");
      } finally {
        setCreateLoading(false);
      }
    },
    [user]
  );

  // 刪除 flows 子集合的流程
  const handleItemRemove = useCallback(
    async (item: TimelineEventItem, cb: TimelineEventCallback) => {
      const itemId = item.id as string;
      if (!itemId) return cb(null);
      const targetItem = items.find(it => it.id === itemId);
      if (!targetItem) return cb(null);
      try {
        await deleteDoc(doc(db, "projects", targetItem.projectId, "flows", itemId));
        setItems(prev => prev.filter(it => it.id !== itemId));
        cb(item);
      } catch (error: unknown) {
        const e = error as Error;
        alert("刪除流程失敗: " + (e?.message || "未知錯誤"));
        cb(null);
      }
    },
    [items]
  );

  // --- Double Click Edit Handler ---

  const handleItemDoubleClick = useCallback(
    async (props: TimelineEventPropertiesResult | null) => {
      if (props?.event && typeof props.event.stopPropagation === "function") {
        props.event.stopPropagation();
      }
      if (isProcessingDoubleClick.current) return;
      isProcessingDoubleClick.current = true;
      try {
        if (!props || !props.item) return;
        const itemId = props.item as string;
        const currentItem = items.find(i => i.id === itemId);
        if (!currentItem) return;
        const newName = prompt("請輸入新的流程名稱：", currentItem.content);
        if (newName && newName.trim() && newName !== currentItem.content) {
          setCreateLoading(true);
          try {
            await updateDoc(doc(db, "projects", currentItem.projectId, "flows", itemId), { name: newName });
            setItems(prev =>
              prev.map(it => (it.id === itemId ? { ...it, content: newName } : it))
            );
          } catch (error: unknown) {
            const e = error as Error;
            alert("更新流程名稱失敗: " + (e?.message || "未知錯誤"));
          } finally {
            setCreateLoading(false);
          }
        }
      } finally {
        isProcessingDoubleClick.current = false;
      }
    },
    [items]
  );

  // --- Data Fetch (Projects & Flows 子集合) ---

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. 取得所有專案
        const projectsSnap = await getDocs(collection(db, "projects"));
        const projectGroups: Group[] = projectsSnap.docs.map(d => ({
          id: d.id,
          content: d.data().name || `專案 ${d.id}`,
        }));
        setGroups(projectGroups);
        const projectsData = projectsSnap.docs.map(d => ({
          id: d.id,
          name: d.data().name || "未命名專案",
        }));

        // 2. 取得每個專案的 flows 子集合
        const allFlowItems: FlowItem[] = [];
        for (const project of projectsData) {
          const flowsSnap = await getDocs(collection(db, "projects", project.id, "flows"));
          const flows = flowsSnap.docs.map(d => {
            const data = d.data();
            // 統一優先用 start/end Timestamp，沒有時才 fallback
            const start = data.start
              ? data.start.toDate()
              : data.startDate
                ? new Date(data.startDate)
                : new Date();
            const end = data.end
              ? data.end.toDate()
              : data.endDate
                ? new Date(data.endDate)
                : new Date(start.getTime() + 86400000);
            return {
              id: d.id,
              group: project.id,
              content: data.name || `${project.name} - 流程`,
              start,
              end,
              projectId: project.id,
              userId: data.userId,
            };
          });
          allFlowItems.push(...flows);
        }
        setItems(allFlowItems);
      } catch (err: unknown) {
        const e = err as Error;
        setError(e?.message || "載入資料失敗");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // --- Timeline Instance (vis-timeline) ---

  useEffect(() => {
    if (!timelineRef.current || loading || error) return;
    const container = timelineRef.current;
    const groupsDataSet = new DataSet<Group, "id">(groups);
    const itemsDataSet = new DataSet<FlowItem, "id">(items);

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
      onMoving: (item: TimelineItem, cb: (item: TimelineItem | null) => void) => cb(item),
      onMove: async (item: TimelineItem, cb: (item: TimelineItem | null) => void) => {
        const ok = await handleItemMove(
          item.id as string,
          item.start as Date,
          item.end as Date,
          item.group as string
        );
        cb(ok ? item : null);
      },
      orientation: { axis: "both", item: "top" },
    };

    try {
      timelineInstance.current = new Timeline(container, itemsDataSet, groupsDataSet, options);
      timelineInstance.current.on("doubleClick", handleItemDoubleClick);
    } catch {
      // Ignore timeline create errors
    }

    return () => {
      timelineInstance.current?.off("doubleClick", handleItemDoubleClick);
      timelineInstance.current?.destroy();
    };
  }, [loading, error, items, groups, handleItemMove, handleItemAdd, handleItemRemove, handleItemDoubleClick]);

  // --- Project Creation ---

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
      // 建立新專案
      const projectRef = await addDoc(collection(db, "projects"), {
        name: newProjectName,
        createdAt: Timestamp.now(),
        ownerId: user.uid,
      });
      const newProjectGroup = { id: projectRef.id, content: newProjectName };
      setGroups(prev => [...prev, newProjectGroup]);
      // 在該 project flows 子集合建立初始流程
      const start = Timestamp.now();
      const end = Timestamp.fromMillis(start.toMillis() + 3600000);
      const initialFlowName = `${newProjectName} - 初始流程`;
      const flowRef = await addDoc(collection(db, "projects", projectRef.id, "flows"), {
        name: initialFlowName,
        start,
        end,
        userId: user.uid,
      });
      setItems(prev => [
        ...prev,
        {
          id: flowRef.id,
          group: projectRef.id,
          content: initialFlowName,
          start: start.toDate(),
          end: end.toDate(),
          projectId: projectRef.id,
          userId: user.uid,
        },
      ]);
      setCreateSuccess(true);
      setNewProjectName("");
    } catch (err: unknown) {
      const e = err as Error;
      setCreateError(e?.message || "建立專案或初始流程失敗");
    } finally {
      setCreateLoading(false);
    }
  };

  // --- UI ---

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
        <button
          onClick={handleCreateProject}
          disabled={createLoading || !user || !newProjectName.trim()}
        >
          {createLoading ? "建立中..." : "建立專案"}
        </button>
      </div>
      {createError && <div style={{ color: "red" }}>{createError}</div>}
      {createSuccess && <div style={{ color: "green" }}>專案已建立！</div>}
      {loading && <div>載入中...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {!loading && !error && <div ref={timelineRef} style={{ height: "600px" }} />}
    </main>
  );
}