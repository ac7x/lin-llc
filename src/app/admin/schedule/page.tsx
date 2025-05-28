"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { db, auth } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, Timestamp, setDoc } from "firebase/firestore"; // Added setDoc here
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

  const handleItemMove = useCallback(
    async (itemId: string, newStart: Date, newEnd: Date, newGroupId: string): Promise<boolean> => {
      const currentItem = items.find(it => it.id === itemId);
      if (!currentItem) {
        alert("找不到要移動的流程項目。");
        return false;
      }
      const oldProjectId = currentItem.projectId;

      try {
        if (oldProjectId === newGroupId) {
          // 項目在同一個專案內移動，僅更新時間
          const flowRef = doc(db, "projects", newGroupId, "flows", itemId);
          await updateDoc(flowRef, {
            start: Timestamp.fromDate(newStart),
            end: Timestamp.fromDate(newEnd),
          });
        } else {
          // 項目移動到不同的專案
          // 1. 從舊專案刪除
          const oldFlowRef = doc(db, "projects", oldProjectId, "flows", itemId);
          await deleteDoc(oldFlowRef);

          // 2. 在新專案中建立 (使用相同的 itemId)
          const newFlowRef = doc(db, "projects", newGroupId, "flows", itemId);
          // Ensure all necessary fields from FlowItem are included, especially those not changing
          await setDoc(newFlowRef, {
            name: currentItem.content, // Retain original name (content)
            start: Timestamp.fromDate(newStart),
            end: Timestamp.fromDate(newEnd),
            projectId: newGroupId, // This is the new project ID
            userId: currentItem.userId, // Retain original userId
            // Add any other fields that are part of FlowItem and should be preserved
          });
        }

        setItems(prev =>
          prev.map(it =>
            it.id === itemId
              ? { ...it, group: newGroupId, projectId: newGroupId, start: newStart, end: newEnd }
              : it
          )
        );
        return true;
      } catch (error: unknown) {
        const e = error as Error;
        console.error("更新流程失敗 (handleItemMove):", e, "Item ID:", itemId, "Old Project:", oldProjectId, "New Project:", newGroupId);
        alert("更新流程失敗: " + (e?.message || "未知錯誤"));
        return false;
      }
    },
    [items] // Added items to dependency array
  );

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
          projectId: groupId, // This projectId field in the document should match the parent project ID
          name: flowName,
          start: Timestamp.fromDate(startDate),
          end: Timestamp.fromDate(endDate),
          userId: user.uid,
        };
        // Changed path to projects/{projectId}/flows
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

  const handleItemRemove = useCallback(
    async (item: TimelineEventItem, cb: TimelineEventCallback) => {
      const itemId = item.id as string;
      if (!itemId) return cb(null);

      // Find the item to get its projectId for the path
      const currentItem = items.find(it => it.id === itemId);
      if (!currentItem) {
        alert("找不到要刪除的流程項目。");
        return cb(null);
      }

      try {
        // Changed path to projects/{projectId}/flows/{flowId}
        await deleteDoc(doc(db, "projects", currentItem.projectId, "flows", itemId));
        setItems(prev => prev.filter(it => it.id !== itemId));
        cb(item);
      } catch (error: unknown) {
        const e = error as Error;
        alert("刪除流程失敗: " + (e?.message || "未知錯誤"));
        cb(null);
      }
    },
    []
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
            // Changed path to projects/{projectId}/flows/{flowId}
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

  // --- Data Fetch (Projects & Flows) ---

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
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

        // Fetch flows for each project
        const allFlowItems: FlowItem[] = [];
        for (const project of projectsData) {
          const projectFlowsSnap = await getDocs(
            collection(db, "projects", project.id, "flows") // Changed path
          );
          const projectFlowItems: FlowItem[] = projectFlowsSnap.docs.map(d => {
            const data = d.data();
            return {
              id: d.id,
              group: project.id, // group is the projectId
              content: data.name || `流程 (${project.name})`,
              start: data.start ? data.start.toDate() : new Date(),
              end: data.end ? data.end.toDate() : new Date(Date.now() + 86400000),
              projectId: project.id, // projectId of the flow item is the project.id
              userId: data.userId,
            };
          });
          allFlowItems.push(...projectFlowItems);
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
      const projectRef = await addDoc(collection(db, "projects"), {
        name: newProjectName,
        createdAt: Timestamp.now(),
        ownerId: user.uid,
      });
      const newProjectGroup = { id: projectRef.id, content: newProjectName };
      setGroups(prev => [...prev, newProjectGroup]);
      const start = Timestamp.now();
      const end = Timestamp.fromMillis(start.toMillis() + 3600000);
      const initialFlowName = `${newProjectName} - 初始流程`;
      // Changed path to projects/{projectId}/flows for adding initial flow
      const flowRef = await addDoc(collection(db, "projects", projectRef.id, "flows"), {
        projectId: projectRef.id, // Store projectId in the flow document as well
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