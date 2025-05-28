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
  const lastKnownWindow = useRef<{ start: Date; end: Date } | null>(null); // 新增 ref 來保存視窗狀態

  useEffect(() => {
    if (!timelineRef.current || loading || error) {
      // 如果無法建立時間軸 (例如正在載入或發生錯誤)，
      // 並且存在舊的實例，則銷毀它。
      if (timelineInstance.current) {
        try {
          lastKnownWindow.current = timelineInstance.current.getWindow();
        } catch (e) { /* 忽略錯誤 */ }
        timelineInstance.current.destroy();
        timelineInstance.current = null;
      }
      return;
    }

    // 如果依賴項變更導致此 effect 重新執行，
    // 並且已存在一個時間軸實例，則在銷毀前保存其視窗狀態。
    if (timelineInstance.current) {
      try {
        lastKnownWindow.current = timelineInstance.current.getWindow();
      } catch (e) { /* 忽略錯誤 */ }
      timelineInstance.current.destroy();
      timelineInstance.current = null; // 確保在建立新實例前為 null
    }

    // 建立新的時間軸實例
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

    // 使用最後已知的視窗或預設值
    const initialStart = lastKnownWindow.current?.start || new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 預設：3 天前
    const initialEnd = lastKnownWindow.current?.end || new Date(Date.now() + 4 * 24 * 60 * 60 * 1000);   // 預設：4 天後

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
      zoomKey: 'ctrlKey', // 保留先前的修復
      start: initialStart, // 設定開始時間
      end: initialEnd,     // 設定結束時間
    };

    try {
      timelineInstance.current = new Timeline(
        container,
        itemsArr,
        groupsArr,
        options
      );
    } catch (err) {
      // 在實際應用中，這裡可以加入更完善的錯誤處理
      console.error("建立時間軸失敗:", err);
    }
    
    return () => {
      if (timelineInstance.current) {
        // 在銷毀前保存視窗狀態，供下次重新建立時使用
        try {
          lastKnownWindow.current = timelineInstance.current.getWindow();
        } catch (e) { /* 忽略錯誤 */ }
        timelineInstance.current.destroy();
        timelineInstance.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timelineRef, loading, error, groups, items, onAdd, onRemove, onMove]); // 依賴項保持不變

  useEffect(() => {
    if (timelineInstance.current) {
      // 當 groups 或 items 更新時，調用 setGroups 和 setItems。
      // 由於時間軸初始化時已設定 start/end，這裡的 setItems 不應觸發自動縮放。
      // 如果仍然有問題，可以在此處也加入 getWindow/setWindow 的邏輯作為保險。
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

  // vis-timeline 的 callback 型別正確，item 是 TimelineItemType
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