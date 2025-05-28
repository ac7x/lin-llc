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
} from "vis-timeline/standalone";
import { useAuthState } from "react-firebase-hooks/auth";
import { User } from "firebase/auth";
import "vis-timeline/styles/vis-timeline-graph2d.css";

// 型別
type Group = { id: string; content: string };
type FlowItem = {
  id: string;
  group: string;
  content: string;
  start: Date;
  end: Date;
  projectId: string;
  userId?: string;
};
type TimelineStringItem = {
  id: string;
  group: string;
  content: string;
  start: Date;
  end: Date;
};

function useProjectGroups() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const projectsSnap = await getDocs(collection(db, "projects"));
        const projectGroups: Group[] = projectsSnap.docs.map((d) => ({
          id: d.id,
          content: d.data().name || `專案 ${d.id}`,
        }));
        setGroups(projectGroups);
      } catch (error: unknown) {
        setError((error as Error)?.message || "載入專案失敗");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { groups, setGroups, error, loading };
}

function useFlowItems(groups: Group[]) {
  const [items, setItems] = useState<FlowItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (groups.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const allFlowItems: FlowItem[] = [];
        for (const group of groups) {
          const projectFlowsSnap = await getDocs(
            collection(db, "projects", group.id, "flows")
          );
          const projectFlowItems: FlowItem[] = projectFlowsSnap.docs.map((d) => {
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
        setItems(allFlowItems);
      } catch (error: unknown) {
        setError((error as Error)?.message || "載入流程失敗");
      } finally {
        setLoading(false);
      }
    })();
  }, [groups]);

  return { items, setItems, error, loading };
}

function useFlowCrud({
  items,
  setItems,
  user,
}: {
  items: FlowItem[];
  setItems: Dispatch<SetStateAction<FlowItem[]>>;
  user: User | null;
}) {
  // 移動流程
  const handleItemMove = useCallback(
    async (
      itemId: string,
      newStart: Date,
      newEnd: Date,
      newGroupId: string
    ): Promise<{ ok: boolean; error?: string }> => {
      const currentItem = items.find((it) => it.id === itemId);
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
          // 建立新流程（複製內容，ID 不同）
          const newFlowDoc = await addDoc(newFlowsCol, {
            name: currentItem.content,
            start: Timestamp.fromDate(newStart),
            end: Timestamp.fromDate(newEnd),
            projectId: newGroupId,
            userId: currentItem.userId,
          });
          // 刪除舊的
          await deleteDoc(oldFlowRef);
          // 更新本地 state（用新 ID 替換）
          setItems((prev) =>
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
        setItems((prev) =>
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
    [items, setItems]
  );

  // 新增流程
  const handleItemAdd = useCallback(
    async (
      item: TimelineStringItem
    ): Promise<{ ok: boolean; newItem?: FlowItem; error?: string }> => {
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
        const newItem: FlowItem = {
          id: flowRef.id,
          group: groupId,
          content: flowName,
          start: startDate,
          end: endDate,
          projectId: groupId,
          userId: user.uid,
        };
        setItems((prev) => [...prev, newItem]);
        return { ok: true, newItem };
      } catch (error: unknown) {
        return { ok: false, error: (error as Error)?.message || "未知錯誤" };
      }
    },
    [user, setItems]
  );
  // 刪除流程
  const handleItemRemove = useCallback(
    async (
      item: TimelineStringItem
    ): Promise<{ ok: boolean; error?: string }> => {
      const itemId = item.id as string;
      if (!itemId) return { ok: false, error: "缺少 ID" };
      const currentItem = items.find((it) => it.id === itemId);
      if (!currentItem) {
        return { ok: false, error: "找不到要刪除的流程項目。" };
      }
      try {
        await deleteDoc(
          doc(db, "projects", currentItem.projectId, "flows", itemId)
        );
        setItems((prev) => prev.filter((it) => it.id !== itemId));
        return { ok: true };
      } catch (error: unknown) {
        return { ok: false, error: (error as Error)?.message || "未知錯誤" };
      }
    },
    [items, setItems]
  );
  return { handleItemMove, handleItemAdd, handleItemRemove };
}

function useCreateProject({
  user,
  setGroups,
  setItems,
}: {
  user: User | null;
  setGroups: Dispatch<SetStateAction<Group[]>>;
  setItems: Dispatch<SetStateAction<FlowItem[]>>;
}) {
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);

  const handleCreateProject = async (
    newProjectName: string,
    resetProjectName: () => void
  ) => {
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
      setGroups((prev) => [...prev, newProjectGroup]);
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
      setItems((prev) => [
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
      resetProjectName();
    } catch (error: unknown) {
      setCreateError((error as Error)?.message || "建立專案或初始流程失敗");
    } finally {
      setCreateLoading(false);
    }
  };

  return {
    createLoading,
    createError,
    createSuccess,
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
  groups: Group[];
  items: FlowItem[];
  loading: boolean;
  error: string | null;
  onAdd: TimelineOptions["onAdd"];
  onRemove: TimelineOptions["onRemove"];
  onMove: TimelineOptions["onMove"];
  feedback?: { message?: string; type?: "error" | "success" };
}) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstance = useRef<Timeline | null>(null);

  useEffect(() => {
    if (!timelineRef.current || loading || error) return;
    if (!timelineInstance.current) {
      const container = timelineRef.current;
      const groupsArr: DataGroup[] = groups.map((g) => ({
        id: g.id,
        content: g.content,
      }));
      const itemsArr: DataItem[] = items.map((it) => ({
        id: it.id,
        group: it.group,
        content: it.content,
        start: it.start,
        end: it.end,
      }));
      const options: TimelineOptions = {
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
          itemsArr,
          groupsArr,
          options
        );
      } catch {}
    }
    return () => {
      if (timelineInstance.current) {
        timelineInstance.current.destroy();
        timelineInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineRef, loading, error, groups, items, onAdd, onRemove, onMove]);
  useEffect(() => {
    if (timelineInstance.current) {
      const groupsArr: DataGroup[] = groups.map((g) => ({
        id: g.id,
        content: g.content,
      }));
      const itemsArr: DataItem[] = items.map((it) => ({
        id: it.id,
        group: it.group,
        content: it.content,
        start: it.start,
        end: it.end,
      }));
      timelineInstance.current.setGroups(groupsArr);
      timelineInstance.current.setItems(itemsArr);
    }
  }, [groups, items]);

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
    groups,
    setGroups,
    error: groupError,
    loading: groupLoading,
  } = useProjectGroups();
  const {
    items,
    setItems,
    error: itemError,
    loading: itemsLoading,
  } = useFlowItems(groups);

  const [newProjectName, setNewProjectName] = useState<string>("");
  const {
    handleItemMove,
    handleItemAdd,
    handleItemRemove,
  } = useFlowCrud({ items, setItems, user });

  const {
    createLoading,
    createError,
    createSuccess,
    handleCreateProject,
  } = useCreateProject({
    user,
    setGroups,
    setItems,
  });

  const [feedback, setFeedback] = useState<{ message?: string; type?: "error" | "success" }>({});

  const handleProjectCreate = () =>
    handleCreateProject(newProjectName, () => setNewProjectName(""));

  // vis-timeline 的 callback 型別正確，item 是 TimelineStringItem
  const timelineOnAdd: TimelineOptions["onAdd"] = async (item, cb) => {
    const safeItem = { ...item, content: typeof item.content === "string" ? item.content : "" };
    const res = await handleItemAdd(safeItem as TimelineStringItem);
    if (res.ok && res.newItem) {
      setFeedback({ message: "新增流程成功", type: "success" });
      cb({
        id: res.newItem.id,
        group: res.newItem.group,
        content: res.newItem.content,
        start: res.newItem.start,
        end: res.newItem.end,
      });
    } else {
      setFeedback({ message: `新增流程失敗: ${res.error}`, type: "error" });
      cb(null);
    }
  };
  const timelineOnRemove: TimelineOptions["onRemove"] = async (item, cb) => {
    const safeItem = { ...item, content: typeof item.content === "string" ? item.content : "" };
    const res = await handleItemRemove(safeItem as TimelineStringItem);
    if (res.ok) {
      setFeedback({ message: "刪除流程成功", type: "success" });
      cb(item);
    } else {
      setFeedback({ message: `刪除流程失敗: ${res.error}`, type: "error" });
      cb(null);
    }
  };
  const timelineOnMove: TimelineOptions["onMove"] = async (item, cb) => {
    const safeItem = { ...item, content: typeof item.content === "string" ? item.content : "" };
    const start =
      safeItem.start instanceof Date
        ? safeItem.start
        : safeItem.start
        ? new Date(safeItem.start)
        : new Date();
    const end =
      safeItem.end instanceof Date
        ? safeItem.end
        : safeItem.end
        ? new Date(safeItem.end)
        : new Date(start.getTime() + 3600000);
    const groupId =
      typeof safeItem.group === "string" || typeof safeItem.group === "number"
        ? String(safeItem.group)
        : "";
    const res = await handleItemMove(
      safeItem.id as string,
      start,
      end,
      groupId
    );
    if (res.ok) {
      setFeedback({ message: "移動流程成功", type: "success" });
      cb({
        ...item,
        start,
        end,
        group: groupId,
      });
    } else {
      setFeedback({ message: `移動流程失敗: ${res.error}`, type: "error" });
      cb(null);
    }
  };

  return (
    <main>
      <ProjectCreateBar
        newProjectName={newProjectName}
        setNewProjectName={setNewProjectName}
        onCreate={handleProjectCreate}
        loading={createLoading}
        error={createError}
        success={createSuccess}
      />
      <TimelineView
        groups={groups}
        items={items}
        loading={groupLoading || itemsLoading}
        error={groupError || itemError}
        onAdd={timelineOnAdd}
        onRemove={timelineOnRemove}
        onMove={timelineOnMove}
        feedback={feedback}
      />
    </main>
  );
}