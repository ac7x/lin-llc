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
  setDoc,
} from "firebase/firestore";
import {
  Timeline,
  DataSet,
  TimelineItem,
  TimelineOptions,
} from "vis-timeline/standalone";
import { useAuthState } from "react-firebase-hooks/auth";
import "vis-timeline/styles/vis-timeline-graph2d.css";

/** 型別區 */
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
interface TimelineEventItem {
  id?: string | number;
  content?: string | HTMLElement;
  start?: Date;
  end?: Date;
  group?: string | number;
}
type TimelineEventCallback = (item: TimelineEventItem | FlowItem | null) => void;

/** hooks: 取得專案群組 */
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

/** hooks: 取得所有流程項目 */
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

/** hooks: 處理流程 CRUD */
function useFlowCrud({
  items,
  setItems,
  user,
}: {
  items: FlowItem[];
  setItems: Dispatch<SetStateAction<FlowItem[]>>;
  user: any;
}) {
  // 移動
  const handleItemMove = useCallback(
    async (
      itemId: string,
      newStart: Date,
      newEnd: Date,
      newGroupId: string
    ): Promise<boolean> => {
      const currentItem = items.find((it) => it.id === itemId);
      if (!currentItem) {
        alert("找不到要移動的流程項目。");
        return false;
      }
      const oldProjectId = currentItem.projectId;

      try {
        if (oldProjectId === newGroupId) {
          const flowRef = doc(db, "projects", newGroupId, "flows", itemId);
          await updateDoc(flowRef, {
            start: Timestamp.fromDate(newStart),
            end: Timestamp.fromDate(newEnd),
          });
        } else {
          await deleteDoc(doc(db, "projects", oldProjectId, "flows", itemId));
          await setDoc(doc(db, "projects", newGroupId, "flows", itemId), {
            name: currentItem.content,
            start: Timestamp.fromDate(newStart),
            end: Timestamp.fromDate(newEnd),
            projectId: newGroupId,
            userId: currentItem.userId,
          });
        }

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
        return true;
      } catch (error: unknown) {
        alert("更新流程失敗: " + ((error as Error)?.message || "未知錯誤"));
        return false;
      }
    },
    [items, setItems]
  );

  // 新增
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
        item.end instanceof Date
          ? item.end
          : new Date(startDate.getTime() + 3600000);
      const groupId =
        typeof item.group === "string" || typeof item.group === "number"
          ? String(item.group)
          : null;
      if (!groupId) return cb(null);

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
        cb(newItem);
      } catch (error: unknown) {
        alert("新增流程失敗: " + ((error as Error)?.message || "未知錯誤"));
        cb(null);
      }
    },
    [user, setItems]
  );

  // 刪除
  const handleItemRemove = useCallback(
    async (item: TimelineEventItem, cb: TimelineEventCallback) => {
      const itemId = item.id as string;
      if (!itemId) return cb(null);
      const currentItem = items.find((it) => it.id === itemId);
      if (!currentItem) {
        alert("找不到要刪除的流程項目。請嘗試刷新頁面。");
        return cb(null);
      }
      try {
        await deleteDoc(
          doc(db, "projects", currentItem.projectId, "flows", itemId)
        );
        setItems((prev) => prev.filter((it) => it.id !== itemId));
        cb(item);
      } catch (error: unknown) {
        alert("刪除流程失敗: " + ((error as Error)?.message || "未知錯誤"));
        cb(null);
      }
    },
    [items, setItems]
  );

  return { handleItemMove, handleItemAdd, handleItemRemove };
}

/** hooks: 專案建立 */
function useCreateProject({
  user,
  setGroups,
  setItems,
}: {
  user: any;
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

/** UI: Timeline */
function TimelineView({
  groups,
  items,
  loading,
  error,
  onAdd,
  onRemove,
  onMove,
}: {
  groups: Group[];
  items: FlowItem[];
  loading: boolean;
  error: string | null;
  onAdd: TimelineOptions["onAdd"];
  onRemove: TimelineOptions["onRemove"];
  onMove: TimelineOptions["onMove"];
}) {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstance = useRef<Timeline | null>(null);

  useEffect(() => {
    if (!timelineRef.current || loading || error) return;

    if (!timelineInstance.current) {
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
        onAdd,
        onRemove,
        onMoving: (item, cb) => cb(item),
        onMove,
        orientation: { axis: "both", item: "top" },
      };

      try {
        timelineInstance.current = new Timeline(
          container,
          itemsDataSet,
          groupsDataSet,
          options
        );
      } catch {
        // 忽略 timeline 建立錯誤
      }
    } else {
      timelineInstance.current.setGroups(groups);
      timelineInstance.current.setItems(items);
    }

    return () => {
      if (timelineInstance.current) {
        timelineInstance.current.destroy();
        timelineInstance.current = null;
      }
    };
  }, [timelineRef, loading, error, groups, items, onAdd, onRemove, onMove]);

  if (loading) return <div>載入中...</div>;
  if (error) return <div style={{ color: "red" }}>{error}</div>;
  return <div ref={timelineRef} style={{ height: "600px" }} />;
}

/** UI: 專案建立欄 */
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
      <button
        onClick={onCreate}
        disabled={loading || !newProjectName.trim()}
      >
        {loading ? "建立中..." : "建立專案"}
      </button>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {success && <div style={{ color: "green" }}>專案已建立！</div>}
    </div>
  );
}

/** 主頁面 */
export default function ProjectsPage() {
  const [user] = useAuthState(auth);
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

  const handleProjectCreate = () =>
    handleCreateProject(newProjectName, () => setNewProjectName(""));

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
        onAdd={handleItemAdd as TimelineOptions["onAdd"]}
        onRemove={handleItemRemove as TimelineOptions["onRemove"]}
        onMove={async (
          item: TimelineItem,
          cb: (item: TimelineItem | null) => void
        ) => {
          const ok = await handleItemMove(
            item.id as string,
            item.start as Date,
            item.end as Date,
            item.group as string
          );
          cb(ok ? item : null);
        }}
      />
    </main>
  );
}