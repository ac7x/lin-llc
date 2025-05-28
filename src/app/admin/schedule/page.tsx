"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  Dispatch,
  SetStateAction,
} from "react";
import { db, auth } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import {
  Timeline,
  TimelineOptions,
  DataGroup,
  DataItem,
  TimelineItem as VisTimelineItem, // Import TimelineItem and alias it
} from "vis-timeline/standalone";
import { useAuthState } from "react-firebase-hooks/auth";
import { User } from "firebase/auth";
import "vis-timeline/styles/vis-timeline-graph2d.css";

// 型別
type GroupType = { id: string; content: string };
type FlowItemType = {
  id: string;
  group: string;
  content: string;
  start: Date;
  end: Date;
  projectId: string;
  userId?: string;
};
type TimelineItemType = {
  id: string;
  group: string;
  content: string;
  start: Date;
  end: Date;
};

// 取得所有專案 group
function useProjectGroupList() {
  const [groupList, setGroupList] = useState<GroupType[]>([]);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [groupLoading, setGroupLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      setGroupLoading(true);
      setGroupError(null);
      try {
        const projectsSnap = await getDocs(collection(db, "projects"));
        const projectGroups: GroupType[] = projectsSnap.docs.map((d) => ({
          id: d.id,
          content: d.data().name || `專案 ${d.id}`,
        }));
        setGroupList(projectGroups);
      } catch (error: unknown) {
        setGroupError((error as Error)?.message || "載入專案失敗");
      } finally {
        setGroupLoading(false);
      }
    })();
  }, []);

  return { groupList, setGroupList, groupError, groupLoading };
}

// 取得所有流程 items
function useFlowItemList(groups: GroupType[]) {
  const [flowItemList, setFlowItemList] = useState<FlowItemType[]>([]);
  const [flowError, setFlowError] = useState<string | null>(null);
  const [flowLoading, setFlowLoading] = useState<boolean>(true);

  useEffect(() => {
    if (groups.length === 0) {
      setFlowItemList([]);
      setFlowLoading(false);
      return;
    }
    (async () => {
      setFlowLoading(true);
      setFlowError(null);
      try {
        const allFlowItems: FlowItemType[] = [];
        for (const group of groups) {
          const projectFlowsSnap = await getDocs(
            collection(db, "projects", group.id, "flows")
          );
          const projectFlowItems: FlowItemType[] = projectFlowsSnap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              group: group.id,
              content: data.name || `流程 (${group.content})`,
              start: data.start ? data.start.toDate() : new Date(),
              end: data.end ? data.end.toDate() : new Date(Date.now() + 86400000),
              projectId: group.id,
              userId: data.userId,
            };
          });
          allFlowItems.push(...projectFlowItems);
        }
        setFlowItemList(allFlowItems);
      } catch (error: unknown) {
        setFlowError((error as Error)?.message || "載入流程失敗");
      } finally {
        setFlowLoading(false);
      }
    })();
  }, [groups]);

  return { flowItemList, setFlowItemList, flowError, flowLoading };
}

// 封裝流程 CRUD
function useFlowItemCrud({
  flowItemList,
  setFlowItemList,
  user,
}: {
  flowItemList: FlowItemType[];
  setFlowItemList: Dispatch<SetStateAction<FlowItemType[]>>;
  user: User | null;
}) {
  // 移動流程
  const handleMoveFlowItem = useCallback(
    async (
      itemId: string,
      newStart: Date,
      newEnd: Date,
      newGroupId: string
    ): Promise<{ ok: boolean; error?: string }> => {
      const currentItem = flowItemList.find((it) => it.id === itemId);
      if (!currentItem) {
        return { ok: false, error: "找不到要移動的流程項目。" };
      }
      const oldProjectId = currentItem.projectId;
      try {
        if (oldProjectId === newGroupId) {
          // 同 group 直接 update
          const flowRef = doc(db, "projects", newGroupId, "flows", itemId);
          await updateDoc(flowRef, {
            start: Timestamp.fromDate(newStart),
            end: Timestamp.fromDate(newEnd),
          });
        } else {
          // 跨 group：先建立新流程（新 group 下），成功再刪除舊的
          const oldFlowRef = doc(db, "projects", oldProjectId, "flows", itemId);
          const newFlowsCol = collection(db, "projects", newGroupId, "flows");
          
          // 準備新流程的資料，確保 userId 不是 undefined
          const newFlowData: {
            name: string;
            start: Timestamp;
            end: Timestamp;
            projectId: string;
            userId?: string; // userId 是可選的
          } = {
            name: currentItem.content,
            start: Timestamp.fromDate(newStart),
            end: Timestamp.fromDate(newEnd),
            projectId: newGroupId,
          };

          if (currentItem.userId !== undefined) {
            newFlowData.userId = currentItem.userId;
          }

          // 建立新流程（複製內容，ID 不同）
          const newFlowDoc = await addDoc(newFlowsCol, newFlowData);
          // 刪除舊的
          await deleteDoc(oldFlowRef);
          // 更新本地 state（用新 ID 替換）
          setFlowItemList((prev) =>
            prev
              .filter((it) => it.id !== itemId) // 移除舊的
              .concat({
                ...currentItem,
                id: newFlowDoc.id,
                group: newGroupId,
                projectId: newGroupId,
                start: newStart,
                end: newEnd,
              })
          );
          return { ok: true };
        }
        // 同 group 移動
        setFlowItemList((prev) =>
          prev.map((it) =>
            it.id === itemId
              ? {
                  ...it,
                  group: newGroupId,
                  projectId: newGroupId,
                  start: newStart,
                  end: newEnd,
                }
              : it
          )
        );
        return { ok: true };
      } catch (error: unknown) {
        return { ok: false, error: (error as Error)?.message || "未知錯誤" };
      }
    },
    [flowItemList, setFlowItemList]
  );

  // 新增流程
  const handleAddFlowItem = useCallback(
    async (
      item: TimelineItemType
    ): Promise<{ ok: boolean; newItem?: FlowItemType; error?: string }> => {
      if (!user) return { ok: false, error: "未登入" };
      const flowName =
        typeof item.content === "string"
          ? item.content
          : "新流程";
      const startDate =
        item.start instanceof Date
          ? item.start
          : item.start
          ? new Date(item.start)
          : new Date();
      const endDate =
        item.end instanceof Date
          ? item.end
          : item.end
          ? new Date(item.end)
          : new Date(startDate.getTime() + 3600000);
      const groupId =
        typeof item.group === "string" || typeof item.group === "number"
          ? String(item.group)
          : null;
      if (!groupId) return { ok: false, error: "缺少群組" };
      try {
        const newFlowData = {
          projectId: groupId,
          name: flowName,
          start: Timestamp.fromDate(startDate),
          end: Timestamp.fromDate(endDate),
          userId: user.uid,
        };
        const flowRef = await addDoc(
          collection(db, "projects", groupId, "flows"),
          newFlowData
        );
        const newItem: FlowItemType = {
          id: flowRef.id,
          group: groupId,
          content: flowName,
          start: startDate,
          end: endDate,
          projectId: groupId,
          userId: user.uid,
        };
        setFlowItemList((prev) => [...prev, newItem]);
        return { ok: true, newItem };
      } catch (error: unknown) {
        return { ok: false, error: (error as Error)?.message || "未知錯誤" };
      }
    },
    [user, setFlowItemList]
  );
  // 刪除流程
  const handleRemoveFlowItem = useCallback(
    async (
      item: TimelineItemType
    ): Promise<{ ok: boolean; error?: string }> => {
      const itemId = item.id as string;
      if (!itemId) return { ok: false, error: "缺少 ID" };
      const currentItem = flowItemList.find((it) => it.id === itemId);
      if (!currentItem) {
        return { ok: false, error: "找不到要刪除的流程項目。" };
      }
      try {
        await deleteDoc(
          doc(db, "projects", currentItem.projectId, "flows", itemId)
        );
        setFlowItemList((prev) => prev.filter((it) => it.id !== itemId));
        return { ok: true };
      } catch (error: unknown) {
        return { ok: false, error: (error as Error)?.message || "未知錯誤" };
      }
    },
    [flowItemList, setFlowItemList]
  );
  return { handleMoveFlowItem, handleAddFlowItem, handleRemoveFlowItem };
}

// 建立專案與初始流程
function useProjectCreator({
  user,
  setGroupList,
  setFlowItemList,
}: {
  user: User | null;
  setGroupList: Dispatch<SetStateAction<GroupType[]>>;
  setFlowItemList: Dispatch<SetStateAction<FlowItemType[]>>;
}) {
  const [projectCreating, setProjectCreating] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [projectSuccess, setProjectSuccess] = useState(false);

  const handleCreateProject = async (
    newProjectName: string,
    resetProjectName: () => void
  ) => {
    setProjectCreating(true);
    setProjectError(null);
    setProjectSuccess(false);
    if (!user || !newProjectName.trim()) {
      setProjectError("專案名稱不能為空且需要登入。");
      setProjectCreating(false);
      return;
    }
    try {
      const projectRef = await addDoc(collection(db, "projects"), {
        name: newProjectName,
        createdAt: Timestamp.now(),
        ownerId: user.uid,
      });
      const newProjectGroup = { id: projectRef.id, content: newProjectName };
      setGroupList((prev) => [...prev, newProjectGroup]);
      const start = Timestamp.now();
      const end = Timestamp.fromMillis(start.toMillis() + 3600000);
      const initialFlowName = `${newProjectName} - 初始流程`;
      const flowRef = await addDoc(
        collection(db, "projects", projectRef.id, "flows"),
        {
          projectId: projectRef.id,
          name: initialFlowName,
          start,
          end,
          userId: user.uid,
        }
      );
      setFlowItemList((prev) => [
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
      setProjectSuccess(true);
      resetProjectName();
    } catch (error: unknown) {
      setProjectError((error as Error)?.message || "建立專案或初始流程失敗");
    } finally {
      setProjectCreating(false);
    }
  };

  return {
    projectCreating,
    projectError,
    projectSuccess,
    handleCreateProject,
  };
}

// UI Components

function TimelineView({
  groups,
  items,
  loading,
  error,
  onAdd,
  onRemove,
  onMove,
  feedback,
}: {
  groups: GroupType[];
  items: FlowItemType[];
  loading: boolean;
  error: string | null;
  onAdd: TimelineOptions["onAdd"];
  onRemove: TimelineOptions["onRemove"];
  onMove: TimelineOptions["onMove"];
  feedback?: { message?: string; type?: "error" | "success" };
}) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstance = useRef<Timeline | null>(null);

  // Effect for INITIALIZATION and DESTRUCTION
  useEffect(() => {
    if (timelineRef.current && !loading && !error && !timelineInstance.current) {
      const container = timelineRef.current;
      const initialGroups = groups.map((g) => ({
        id: g.id,
        content: g.content,
      }));
      const initialItems = items.map((it) => ({
        id: it.id,
        group: it.group,
        content: it.content,
        start: it.start,
        end: it.end,
      }));

      const currentOptions: TimelineOptions = {
        editable: {
          add: true,
          remove: true,
          updateTime: true,
          updateGroup: true,
          overrideItems: true,
        },
        onAdd,
        onRemove,
        onMoving: (item, cb) => cb(item),
        onMove,
        orientation: { axis: "both", item: "top" },
      };

      try {
        timelineInstance.current = new Timeline(
          container,
          initialItems,
          initialGroups,
          currentOptions
        );
      } catch (e) {
        console.error("Timeline initialization error:", e);
      }
    }

    return () => {
      if (timelineInstance.current) {
        timelineInstance.current.destroy();
        timelineInstance.current = null;
      }
    };
  }, [loading, error]); // Minimal dependencies for init/destroy logic

  // Effect to update GROUPS
  useEffect(() => {
    if (timelineInstance.current && !loading && !error) {
      const groupsArr: DataGroup[] = groups.map((g) => ({
        id: g.id,
        content: g.content,
      }));
      timelineInstance.current.setGroups(groupsArr);
    }
  }, [groups, loading, error]);

  // Effect to update ITEMS
  useEffect(() => {
    if (timelineInstance.current && !loading && !error) {
      const itemsArr: DataItem[] = items.map((it) => ({
        id: it.id,
        group: it.group,
        content: it.content,
        start: it.start,
        end: it.end,
      }));
      timelineInstance.current.setItems(itemsArr);
    }
  }, [items, loading, error]);

  // Effect to update OPTIONS (event handlers)
  useEffect(() => {
    if (timelineInstance.current && !loading && !error) {
      const newOptions: Partial<TimelineOptions> = {
        onAdd,
        onRemove,
        onMove,
      };
      timelineInstance.current.setOptions(newOptions);
    }
  }, [onAdd, onRemove, onMove, loading, error]);


  if (loading) return <div>載入中...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  return (
    <div>
      {feedback?.message && (
        <div
          style={{
            color: feedback.type === "error" ? "red" : "green",
            marginBottom: 8,
          }}
        >
          {feedback.message}
        </div>
      )}
      <div ref={timelineRef} style={{ height: "600px" }} />
    </div>
  );
}

function ProjectCreateBar({
  newProjectName,
  setNewProjectName,
  onCreate,
  loading,
  error,
  success,
}: {
  newProjectName: string;
  setNewProjectName: Dispatch<SetStateAction<string>>;
  onCreate: () => void;
  loading: boolean;
  error: string | null;
  success: boolean;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <input
        type="text"
        placeholder="請輸入專案名稱"
        value={newProjectName}
        onChange={(e) => setNewProjectName(e.target.value)}
        disabled={loading}
        style={{ marginRight: 8 }}
      />
      <button onClick={onCreate} disabled={loading || !newProjectName.trim()}>
        {loading ? "建立中..." : "建立專案"}
      </button>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {success && <div style={{ color: "green" }}>專案已建立！</div>}
    </div>
  );
}

// 主頁面
export default function ProjectsPage() {
  const [userRaw] = useAuthState(auth);
  const user: User | null = userRaw ?? null;

  const {
    groupList,
    setGroupList,
    groupError,
    groupLoading,
  } = useProjectGroupList();
  const {
    flowItemList,
    setFlowItemList,
    flowError,
    flowLoading,
  } = useFlowItemList(groupList);

  const [newProjectName, setNewProjectName] = useState<string>("");
  const {
    handleMoveFlowItem,
    handleAddFlowItem,
    handleRemoveFlowItem,
  } = useFlowItemCrud({ flowItemList, setFlowItemList, user });

  const {
    projectCreating,
    projectError,
    projectSuccess,
    handleCreateProject,
  } = useProjectCreator({
    user,
    setGroupList,
    setFlowItemList,
  });

  const [feedback, setFeedback] = useState<{ message?: string; type?: "error" | "success" }>({});

  const handleProjectCreate = () =>
    handleCreateProject(newProjectName, () => setNewProjectName(""));

  const timelineOnAdd: TimelineOptions["onAdd"] = useCallback(async (visItem: VisTimelineItem, cb: (item: VisTimelineItem | null) => void) => {
    // Prepare item for handleAddFlowItem (expects local TimelineItemType)
    const itemToAdd: TimelineItemType = {
      id: String(visItem.id), // vis-timeline might provide a temp id
      group: String(visItem.group), // group where item is being added
      content: typeof visItem.content === 'string' ? visItem.content : (visItem.content instanceof HTMLElement && visItem.content.textContent ? visItem.content.textContent.trim() : "新流程"),
      start: visItem.start instanceof Date ? visItem.start : new Date(visItem.start),
      end: visItem.end ? (visItem.end instanceof Date ? visItem.end : new Date(visItem.end)) : new Date((visItem.start instanceof Date ? visItem.start : new Date(visItem.start)).getTime() + 3600000), // Default end
    };

    const res = await handleAddFlowItem(itemToAdd);
    if (res.ok && res.newItem) {
      setFeedback({ message: "新增流程成功", type: "success" });
      // res.newItem is FlowItemType, which is compatible with VisTimelineItem's structure for content, start, end.
      cb({
        id: res.newItem.id,
        group: res.newItem.group,
        content: res.newItem.content,
        start: res.newItem.start,
        end: res.newItem.end,
      } as VisTimelineItem); // Cast the resulting object to VisTimelineItem for the callback
    } else {
      setFeedback({ message: `新增流程失敗: ${res.error}`, type: "error" });
      cb(null);
    }
  }, [handleAddFlowItem, setFeedback]);

  const timelineOnRemove: TimelineOptions["onRemove"] = useCallback(async (visItem: VisTimelineItem, cb: (item: VisTimelineItem | null) => void) => {
    // Prepare item for handleRemoveFlowItem (expects local TimelineItemType)
    const itemToRemove: TimelineItemType = {
      id: String(visItem.id),
      group: String(visItem.group), // Ensure group is a string
      content: typeof visItem.content === 'string' ? visItem.content : (visItem.content instanceof HTMLElement && visItem.content.textContent ? visItem.content.textContent : ''),
      start: visItem.start instanceof Date ? visItem.start : new Date(visItem.start),
      end: visItem.end ? (visItem.end instanceof Date ? visItem.end : new Date(visItem.end)) : new Date(new Date(visItem.start).getTime() + 3600000),
    };
    const res = await handleRemoveFlowItem(itemToRemove);
    if (res.ok) {
      setFeedback({ message: "刪除流程成功", type: "success" });
      cb(visItem); // Pass the original visItem to the callback
    } else {
      setFeedback({ message: `刪除流程失敗: ${res.error}`, type: "error" });
      cb(null);
    }
  }, [handleRemoveFlowItem, setFeedback]);

  const timelineOnMove: TimelineOptions["onMove"] = useCallback(async (movedVisItem: VisTimelineItem, cb: (item: VisTimelineItem | null) => void) => {
    const itemId = String(movedVisItem.id);
    // movedVisItem.group is the new group's ID (string | number)
    const newGroupId = String(movedVisItem.group);
    // movedVisItem.start is the new start time (Date | number | string)
    const newStart = movedVisItem.start instanceof Date ? movedVisItem.start : new Date(movedVisItem.start);
    // movedVisItem.end is the new end time (Date | number | string), can be undefined
    const newEnd = movedVisItem.end ? (movedVisItem.end instanceof Date ? movedVisItem.end : new Date(movedVisItem.end)) : new Date(newStart.getTime() + 3600000); // Default if undefined
    
    if (!itemId) {
        setFeedback({ message: "移動失敗: 項目 ID 遺失", type: "error" });
        cb(null);
        return;
    }
    // newGroupId could be 'undefined' if item is dragged out of all groups. Handle as needed by your logic.
    // For now, assuming a valid group ID string is expected by handleMoveFlowItem.
    if (!newGroupId || newGroupId === "undefined") { 
        setFeedback({ message: "移動失敗: 群組 ID 遺失或無效", type: "error" });
        cb(null);
        return;
    }

    const res = await handleMoveFlowItem(
      itemId,
      newStart,
      newEnd,
      newGroupId
    );
    if (res.ok) {
      setFeedback({ message: "移動流程成功", type: "success" });
      // Pass the movedVisItem (which already has new start/end/group) to the callback
      cb(movedVisItem); 
    } else {
      setFeedback({ message: `移動流程失敗: ${res.error}`, type: "error" });
      cb(null); // Revert the move in the timeline
    }
  }, [handleMoveFlowItem, setFeedback]);

  return (
    <main>
      <ProjectCreateBar
        newProjectName={newProjectName}
        setNewProjectName={setNewProjectName}
        onCreate={handleProjectCreate}
        loading={projectCreating}
        error={projectError}
        success={projectSuccess}
      />
      <TimelineView
        groups={groupList}
        items={flowItemList}
        loading={groupLoading || flowLoading}
        error={groupError || flowError}
        onAdd={timelineOnAdd}
        onRemove={timelineOnRemove}
        onMove={timelineOnMove}
        feedback={feedback}
      />
    </main>
  );
}