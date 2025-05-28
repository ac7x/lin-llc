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
          const flowRef = doc(db, "projects", newGroupId, "flows", itemId);
          await updateDoc(flowRef, {
            start: Timestamp.fromDate(newStart),
            end: Timestamp.fromDate(newEnd),
          });
        } else {
          const oldFlowRef = doc(db, "projects", oldProjectId, "flows", itemId);
          const newFlowsCol = collection(db, "projects", newGroupId, "flows");
          const newFlowDoc = await addDoc(newFlowsCol, {
            name: currentItem.content,
            start: Timestamp.fromDate(newStart),
            end: Timestamp.fromDate(newEnd),
            projectId: newGroupId,
            userId: currentItem.userId,
          });
          await deleteDoc(oldFlowRef);
          setFlowItemList((prev) =>
            prev
              .filter((it) => it.id !== itemId)
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

// TimelineView 修正版，從本質防止重複 new 與自動縮放
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

  // 只在 mount 時 new Timeline，之後只更新內容
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
        autoResize: false, // 防止自動 fit
        height: "600px",
      };
      timelineInstance.current = new Timeline(
        container,
        itemsArr,
        groupsArr,
        options
      );
    }
    return () => {
      if (timelineInstance.current) {
        timelineInstance.current.destroy();
        timelineInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineRef, loading, error]);

  // 僅內容變動時 setItems / setGroups，不 new Timeline
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
      // 不呼叫 timelineInstance.current.fit()，避免自動縮放
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

  const timelineOnAdd: TimelineOptions["onAdd"] = async (item, cb) => {
    const safeItem = { ...item, content: typeof item.content === "string" ? item.content : "" };
    const res = await handleAddFlowItem(safeItem as TimelineItemType);
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
    const res = await handleRemoveFlowItem(safeItem as TimelineItemType);
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
    const res = await handleMoveFlowItem(
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