"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs, addDoc, doc, updateDoc, Timestamp, deleteDoc } from "firebase/firestore";
import { Timeline, DataSet, TimelineItem, TimelineGroup, TimelineOptions, TimelineEventPropertiesResult } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.css";
import { auth } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { useAuthState } from "react-firebase-hooks/auth";

type Group = { id: string; content: string; }; // Remains the same, content will be project name
// Renamed ScheduleItem to FlowItem and updated fields
type FlowItem = {
  id: string;
  group: string; // Corresponds to Project['id'] (this is projectId)
  content: string; // Name of the flow
  start: Date;
  end: Date;
  projectId: string; // Explicitly keep projectId
  userId?: string; // Optional: if flows have a user associated with them (e.g., creator/assignee)
};

// Interface for items passed by vis-timeline events like onAdd, onRemove
interface TimelineEventItem {
  id?: string | number; // id might be a number or string, and not present for new items
  content?: string | HTMLElement; // Adjusted to include HTMLElement
  start?: Date;
  end?: Date;
  group?: string | number; // This will be projectId when adding/moving
  // Add any other properties that vis-timeline might pass and you might use
}

// Type for the callback function in vis-timeline events
// Updated to use FlowItem
type TimelineEventCallback = (item: TimelineEventItem | FlowItem | null) => void;


export default function ProjectsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  // Updated to use FlowItem
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
  // Updated to use FlowItem
  const datasetRef = useRef<DataSet<FlowItem, 'id'>>(null);
  const isProcessingDoubleClick = useRef(false);

  const handleItemMove = useCallback(async (itemId: string, newStart: Date, newEnd: Date, newGroupId: string) => {
    const itemInState = items.find(i => i.id === itemId);
    if (!itemInState) {
      console.error("在 items 狀態中找不到項目:", itemId);
      alert("更新流程失敗: 找不到項目。");
      return false;
    }
    
    // Changed "schedules" to "flows"
    const flowRef = doc(db, "flows", itemId);
    
    try {
      console.log("正在更新數據庫 (flow)...", { itemId, newStart, newEnd, newGroupId });
      // Changed field from userId to projectId to reflect new grouping
      await updateDoc(flowRef, {
        projectId: newGroupId, // newGroupId is the new projectId
        start: Timestamp.fromDate(newStart),
        end: Timestamp.fromDate(newEnd),
      });
      
      setItems(prevItems =>
        prevItems.map(it =>
          it.id === itemId
            ? {
                ...it,
                group: newGroupId, // newGroupId is projectId
                projectId: newGroupId, // Ensure projectId field is also updated
                start: newStart,
                end: newEnd
                // userId field of FlowItem is not changed here, assuming it's independent of projectId
              }
            : it
        )
      );
      
      console.log("數據庫更新成功 (flow)");
      return true;
    } catch (error: unknown) {
      console.error("更新數據庫失敗 (flow):", error);
      alert("更新流程失敗: " + (error instanceof Error ? error.message : "未知錯誤"));
      return false;
    }
  }, [items]); // Removed setItems from dependencies as it's a setter from useState

  const handleItemAdd = useCallback(async (itemDataFromTimeline: TimelineEventItem, callback: TimelineEventCallback) => {
    if (!user) {
      alert("你需要登入才能新增項目。");
      callback(null);
      return;
    }

    const flowName = typeof itemDataFromTimeline.content === 'string' ? itemDataFromTimeline.content : 
                          itemDataFromTimeline.content instanceof HTMLElement ? itemDataFromTimeline.content.innerText : "新流程";
    
    const startDate = itemDataFromTimeline.start instanceof Date ? itemDataFromTimeline.start : new Date();
    const endDate = itemDataFromTimeline.end instanceof Date ? itemDataFromTimeline.end : new Date(startDate.getTime() + 3600000); // Default to 1 hour duration for a flow
    const targetProjectId = typeof itemDataFromTimeline.group === 'string' || typeof itemDataFromTimeline.group === 'number' ? String(itemDataFromTimeline.group) : null;

    if (!targetProjectId) {
        alert("無法確定專案以新增流程。請在專案列上新增。");
        callback(null);
        return;
    }

    setCreateLoading(true);
    setCreateError(null);
    setCreateSuccess(false);

    try {
      // Adding a flow, not a project. Project (group) already exists.
      const newFlowData = {
        projectId: targetProjectId,
        name: flowName,
        start: Timestamp.fromDate(startDate),
        end: Timestamp.fromDate(endDate),
        userId: user.uid, // Assuming the current user creates/owns the flow
      };
      // Changed "schedules" to "flows"
      const flowRef = await addDoc(collection(db, "flows"), newFlowData);

      const newItemForState: FlowItem = {
        id: flowRef.id,
        group: targetProjectId, // group is projectId
        content: flowName, 
        start: startDate,
        end: endDate,
        projectId: targetProjectId,
        userId: user.uid, // Match data sent to Firestore
      };

      setItems(prev => [...prev, newItemForState]);
      callback(newItemForState);
      setCreateSuccess(true);
      console.log("流程已成功新增到專案:", targetProjectId);
    } catch (err: unknown) {
      console.error("新增流程失敗:", err);
      alert("新增流程失敗: " + (err instanceof Error ? err.message : "未知錯誤"));
      callback(null);
      setCreateError((err as Error).message || "新增流程失敗");
    } finally {
      setCreateLoading(false);
    }
  }, [user]); // Removed setItems, setCreateLoading, setCreateError, setCreateSuccess from dependencies

  const handleItemRemove = useCallback(async (itemDataFromTimeline: TimelineEventItem, callback: TimelineEventCallback) => {
    const itemId = itemDataFromTimeline.id as string;
    if (!itemId) {
      callback(null);
      return;
    }

    // Optional: Add a confirmation dialog
    // if (!confirm("確定要刪除此流程嗎？")) {
    //   callback(null);
    //   return;
    // }

    try {
      // Changed "schedules" to "flows"
      await deleteDoc(doc(db, "flows", itemId));
      setItems(prev => prev.filter(it => it.id !== itemId));
      callback(itemDataFromTimeline); 
      console.log("流程已成功刪除:", itemId);
    } catch (error: unknown) {
      console.error("刪除流程失敗:", error);
      alert("刪除流程失敗: " + (error instanceof Error ? error.message : "未知錯誤"));
      callback(null);
    }
  }, []); // Removed setItems from dependencies

  const handleItemDoubleClick = useCallback(async (properties: TimelineEventPropertiesResult | null) => {
    if (properties && properties.event && typeof properties.event.stopPropagation === 'function') {
      properties.event.stopPropagation();
    }

    if (isProcessingDoubleClick.current) {
      return;
    }
    isProcessingDoubleClick.current = true;

    try {
      if (!properties || !properties.item) {
        return;
      }

      const itemId = properties.item as string;
      const currentItem = items.find(i => i.id === itemId);

      if (!currentItem) {
        console.error("在 items 狀態中找不到流程:", itemId);
        alert("找不到要修改的流程。");
        return;
      }

      // Prompt for the new flow name
      const newName = prompt("請輸入新的流程名稱：", currentItem.content);

      if (newName && newName.trim() !== "" && newName !== currentItem.content) {
        setCreateLoading(true); 
        try {
          // Update the flow name in Firestore
          const flowRef = doc(db, "flows", itemId);
          await updateDoc(flowRef, { name: newName });

          setItems(prevItems =>
            prevItems.map(it =>
              it.id === itemId ? { ...it, content: newName } : it
            )
          );
          console.log("流程名稱已更新:", itemId);
        } catch (error: unknown) {
          console.error("更新流程名稱失敗:", error);
          alert("更新流程名稱失敗: " + (error instanceof Error ? error.message : "未知錯誤"));
        } finally {
          setCreateLoading(false);
        }
      }
    } finally {
      isProcessingDoubleClick.current = false;
    }
  }, [items]); // Removed setItems, setCreateLoading from dependencies

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // 1. Fetch Projects for Groups
        const projectsSnap = await getDocs(collection(db, "projects"));
        const projectGroups: Group[] = projectsSnap.docs.map(docSnapshot => ({ // Renamed doc to docSnapshot to avoid conflict
          id: docSnapshot.id,
          content: docSnapshot.data().name || `專案 ${docSnapshot.id}`,
        }));
        setGroups(projectGroups);

        // Store projects data for easy lookup of names for flows
        const projectsData = projectsSnap.docs.map(docSnapshot => ({
          id: docSnapshot.id,
          name: docSnapshot.data().name || "未命名專案",
        }));

        // 2. Fetch Flows for Items
        // Changed "schedules" to "flows"
        const flowsSnap = await getDocs(collection(db, "flows"));
        const flowItems: FlowItem[] = flowsSnap.docs.map(docSnapshot => { // Renamed doc to docSnapshot
          const d = docSnapshot.data();
          const projectForFlow = projectsData.find(p => p.id === d.projectId);
          return {
            id: docSnapshot.id,
            group: d.projectId, // group is the projectId
            content: d.name || (projectForFlow ? `流程 (${projectForFlow.name})` : "未命名流程"), // Flow's own name or derived
            start: d.start ? d.start.toDate() : new Date(),
            end: d.end ? d.end.toDate() : new Date(Date.now() + 86400000),
            projectId: d.projectId,
            userId: d.userId, // userId from flow data, if exists
          };
        });
        setItems(flowItems);
      } catch (err: unknown) {
        setError((err as Error).message || "載入資料失敗");
      } finally {
        setLoading(false);
      }
    })();
  }, []); // Dependencies are correct (empty for initial load)

  useEffect(() => {
    if (!timelineRef.current || loading || error) return;

    const container = timelineRef.current;
    const groupsDataSet = new DataSet<TimelineGroup, 'id'>(groups);
    datasetRef.current = new DataSet<FlowItem, 'id'>(items);

    const options: TimelineOptions = {
      editable: {
        add: true,
        remove: true,
        updateTime: true,
        updateGroup: true, // Allows dragging items between groups (projects)
        overrideItems: true,
      },
      // Cast to expected vis-timeline types, ensuring our FlowItem is compatible or handled
      onAdd: handleItemAdd as (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void, 
      onRemove: handleItemRemove as (item: TimelineItem, callback: (item: TimelineItem | null) => void) => void,
      onMoving: function(item: TimelineItem, callback: (item: TimelineItem | null) => void) { // Typed item and callback
        callback(item);
      },
      onMove: async function(item: TimelineItem, callback: (item: TimelineItem | null) => void) {
        console.log("onMove - item 接收到:", { id: item.id, start: item.start, end: item.end, group: item.group });
        // item.group is the new projectId
        const success = await handleItemMove(item.id as string, item.start as Date, item.end as Date, item.group as string);
        if (success) {
          callback(item); // Confirm changes in the timeline
        } else {
          callback(null); // Revert changes in the timeline
        }
      },
      // onDoubleClick is NOT a standard option, will attach listener manually
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
      // 1. Create the new project
      const projectRef = await addDoc(collection(db, "projects"), {
        name: newProjectName,
        createdAt: Timestamp.now(),
        ownerId: user.uid, // Optionally add owner
      });
      const newProjectGroup = { id: projectRef.id, content: newProjectName };
      setGroups(prev => [...prev, newProjectGroup]);

      // 2. Create an initial flow for this new project
      const start = Timestamp.now();
      const end = Timestamp.fromMillis(start.toMillis() + 3600000); // 1 hour default for initial flow
      const initialFlowName = `${newProjectName} - 初始流程`;
      
      // Changed "schedules" to "flows"
      const flowRef = await addDoc(collection(db, "flows"), {
        projectId: projectRef.id,
        name: initialFlowName,
        start,
        end,
        userId: user.uid, // User who created the project/initial flow
      });

      const newFlowItem: FlowItem = {
        id: flowRef.id,
        group: projectRef.id, // Group is the new project's ID
        content: initialFlowName, // Content is the flow's name
        start: start.toDate(),
        end: end.toDate(),
        projectId: projectRef.id,
        userId: user.uid,
      };
      setItems(prev => [...prev, newFlowItem]);
      
      setCreateSuccess(true);
      setNewProjectName("");
      console.log("新專案及其初始流程已建立:", projectRef.id);
    } catch (err: unknown) {
      setCreateError((err as Error).message || "建立專案或初始流程失敗");
      console.error("建立專案或初始流程失敗:", err);
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