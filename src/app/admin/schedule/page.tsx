"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs, addDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import Timeline from "react-calendar-timeline";
import "@/styles/react-calendar-timeline.scss";
import { subDays, addDays, startOfDay, endOfDay } from "date-fns";
import { auth } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { useAuthState } from "react-firebase-hooks/auth";
import { DndProvider, useDrag, useDrop, DragSourceMonitor, DropTargetMonitor } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import dynamic from 'next/dynamic';

type Group = {
  id: string;
  title: string;
};

type Project = {
  id: string;
  name: string;
};

type ScheduleItem = {
  id: string;
  group: string; // userId
  title: string; // project name
  start_time: number;
  end_time: number;
  projectId: string;
  userId: string;
};

type DraggableProjectProps = { project: Project };
function DraggableProject({ project }: DraggableProjectProps) {
  const [{ isDragging }, drag] = useDrag<{ project: Project }, void, { isDragging: boolean }>({
    type: "PROJECT",
    item: { project },
    collect: (monitor: DragSourceMonitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  });
  return (
    <div
      ref={node => { if (node) drag(node); }}
      style={{
        opacity: isDragging ? 0.5 : 1,
        cursor: "grab",
        border: "1px solid #2196f3",
        borderRadius: 4,
        padding: "4px 8px",
        marginBottom: 4,
        background: "#fff",
        display: "inline-block",
        marginRight: 8,
      }}
    >
      {project.name}
    </div>
  );
}

// 將原本的 ProjectsPage 重新命名為 SchedulePageClient
function SchedulePageClient() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user] = useAuthState(auth);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        // 取得 users 作為 groups
        const usersSnap = await getDocs(collection(db, "users"));
        const groupsData: Group[] = usersSnap.docs.map((doc) => ({
          id: doc.id,
          title: doc.data().displayName || doc.data().name || doc.id,
        }));
        setGroups(groupsData);

        // 取得 projects
        const projectsSnap = await getDocs(collection(db, "projects"));
        const projectsData: Project[] = projectsSnap.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || "未命名專案",
        }));
        setProjects(projectsData);

        // 取得 schedules
        const schedulesSnap = await getDocs(collection(db, "schedules"));
        const itemsData: ScheduleItem[] = schedulesSnap.docs.map((doc) => {
          const data = doc.data();
          const project = projectsData.find(p => p.id === data.projectId);
          return {
            id: doc.id,
            group: data.userId,
            title: project ? project.name : "未知專案",
            start_time: data.start ? data.start.toMillis() : Date.now(),
            end_time: data.end ? data.end.toMillis() : Date.now() + 24*60*60*1000,
            projectId: data.projectId,
            userId: data.userId,
          };
        });
        setItems(itemsData);
      } catch (err: unknown) {
        if (err instanceof Error) setError(err.message);
        else setError("載入失敗");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
      // 建立專案
      const projectData = {
        name: newProjectName,
        createdAt: Timestamp.now(),
      };
      const projectRef = await addDoc(collection(db, "projects"), projectData);

      // 建立 schedule (自己，now~now+1天)
      const start = Timestamp.now();
      const end = Timestamp.fromMillis(start.toMillis() + 24*60*60*1000);
      const scheduleRef = await addDoc(collection(db, "schedules"), {
        projectId: projectRef.id,
        userId: user.uid,
        start,
        end,
      });

      // 更新本地 state
      setProjects(prev => [...prev, { id: projectRef.id, name: newProjectName }]);
      setItems(prev => [
        ...prev,
        {
          id: scheduleRef.id,
          group: user.uid,
          title: newProjectName,
          start_time: start.toMillis(),
          end_time: end.toMillis(),
          projectId: projectRef.id,
          userId: user.uid,
        }
      ]);
      setCreateSuccess(true);
      setNewProjectName("");
    } catch (err: unknown) {
      if (err instanceof Error) setCreateError(err.message);
      else setCreateError("建立專案失敗");
    } finally {
      setCreateLoading(false);
    }
  };

  // Timeline drop 支援
  // 這裡用 ref 包住 Timeline，讓整個 timeline canvas 支援 drop
  const [{ isOver }, drop] = useDrop<
    { project: Project },
    void,
    { isOver: boolean }
  >({
    accept: "PROJECT",
    drop: (item, monitor: DropTargetMonitor) => {
      void (async () => {
        // 取得滑鼠座標
        const clientOffset = monitor.getClientOffset();
        if (!clientOffset) return;
        // 取得 timeline canvas 的 DOM
        const timelineCanvas = document.querySelector(".react-calendar-timeline .rct-scroll");
        if (!timelineCanvas) return;
        const rect = timelineCanvas.getBoundingClientRect();
        // 計算 drop 的時間
        const x = clientOffset.x - rect.left;
        const timelineWidth = rect.width;
        const timeStart = defaultTimeStart.getTime();
        const timeEnd = defaultTimeEnd.getTime();
        const timePerPixel = (timeEnd - timeStart) / timelineWidth;
        const dropTime = Math.round(timeStart + x * timePerPixel);
        // 計算 drop 的 user（group）
        const y = clientOffset.y - rect.top;
        const rowHeight = 50; // 與 lineHeight 相同
        const groupIndex = Math.floor(y / rowHeight);
        const group = groups[groupIndex];
        if (!group) return;
        // 建 schedule
        await handleAssignSchedule(item.project.id, group.id, dropTime);
      })();
    },
    collect: (monitor: DropTargetMonitor) => ({
      isOver: !!monitor.isOver(),
    }),
  });

  // 修改 handleAssignSchedule 支援指定 startTime
  const handleAssignSchedule = async (
    projectId: string,
    userId: string,
    startTime?: number
  ) => {
    try {
      const start = startTime ? Timestamp.fromMillis(startTime) : Timestamp.now();
      const end = Timestamp.fromMillis(start.toMillis() + 24 * 60 * 60 * 1000);
      const scheduleRef = await addDoc(collection(db, "schedules"), {
        projectId,
        userId,
        start,
        end,
      });
      const project = projects.find((p) => p.id === projectId);
      setItems((prev) => [
        ...prev,
        {
          id: scheduleRef.id,
          group: userId,
          title: project ? project.name : "未知專案",
          start_time: start.toMillis(),
          end_time: end.toMillis(),
          projectId,
          userId,
        },
      ]);
    } catch {
      alert("指派失敗");
    }
  };

  // 移動/調整日程
  const handleItemMove = async (
    itemId: string,
    dragTime: number,
    newGroupOrder: number
  ) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    // 隔夜檢查
    const todayStart = startOfDay(new Date()).getTime();
    if (item.start_time < todayStart) {
      alert("隔夜數據不可修改");
      return;
    }
    const newUserId = groups[newGroupOrder]?.id;
    if (!newUserId) return;
    const duration = item.end_time - item.start_time;
    const newStart = dragTime;
    const newEnd = dragTime + duration;
    try {
      await updateDoc(doc(db, "schedules", itemId), {
        userId: newUserId,
        start: Timestamp.fromMillis(newStart),
        end: Timestamp.fromMillis(newEnd),
      });
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? { ...it, group: newUserId, userId: newUserId, start_time: newStart, end_time: newEnd }
            : it
        )
      );
    } catch {
      alert("更新日程失敗");
    }
  };

  const handleItemResize = async (
    itemId: string,
    time: number,
    edge: "left" | "right"
  ) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
    // 隔夜檢查
    const todayStart = startOfDay(new Date()).getTime();
    if (item.start_time < todayStart) {
      alert("隔夜數據不可修改");
      return;
    }
    let newStart = item.start_time;
    let newEnd = item.end_time;
    if (edge === "left") newStart = time;
    else newEnd = time;
    try {
      await updateDoc(doc(db, "schedules", itemId), {
        start: Timestamp.fromMillis(newStart),
        end: Timestamp.fromMillis(newEnd),
      });
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? { ...it, start_time: newStart, end_time: newEnd }
            : it
        )
      );
    } catch {
      alert("更新時間失敗");
    }
  };

  // 計算顯示區間
  const now = new Date();
  const defaultTimeStart = subDays(startOfDay(now), 2);
  const defaultTimeEnd = addDays(endOfDay(now), 5);

  return (
    <DndProvider backend={HTML5Backend}>
      <main>
        <h1>專案時程表</h1>
        <p>以時間軸方式檢視所有專案日程。</p>
        <div style={{ marginBottom: 8 }}>
          <input
            type="text"
            placeholder="請輸入專案名稱"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            disabled={createLoading}
            style={{ marginRight: 8 }}
          />
          <button onClick={handleCreateProject} disabled={createLoading || !user || !newProjectName.trim()}>
            {createLoading ? "建立中..." : "建立專案"}
          </button>
        </div>
        <div style={{ marginBottom: 16 }}>
          <h2>拖曳專案到下方時間軸以指派</h2>
          {projects.map((project) => (
            <DraggableProject key={project.id} project={project} />
          ))}
        </div>
        {createError && <div style={{ color: "red" }}>{createError}</div>}
        {createSuccess && <div style={{ color: "green" }}>專案已建立！</div>}
        {loading && <div>載入中...</div>}
        {error && <div style={{ color: "red" }}>{error}</div>}
        {!loading && !error && (
          <div
            ref={(node) => {
              if (node) drop(node);
            }}
            style={{ border: isOver ? "2px dashed #2196f3" : undefined }}
          >
            <Timeline
              groups={groups}
              items={items}
              defaultTimeStart={defaultTimeStart.getTime()}
              defaultTimeEnd={defaultTimeEnd.getTime()}
              canMove
              canResize="both"
              onItemMove={handleItemMove}
              onItemResize={handleItemResize}
              lineHeight={50}
              timeSteps={{
                second: 0,
                minute: 0,
                hour: 12,
                day: 1,
                month: 1,
                year: 1,
              }}
              dragSnap={12 * 60 * 60 * 1000}
            />
          </div>
        )}
        <h2>快速指派專案給用戶（建立新日程）</h2>
        <ul>
          {projects.map((project) => (
            <li key={project.id}>
              {project.name}{" "}
              {groups.map((g) => (
                <button
                  key={g.id}
                  style={{ marginRight: 8 }}
                  onClick={() => handleAssignSchedule(project.id, g.id)}
                >
                  指派給 {g.title}
                </button>
              ))}
            </li>
          ))}
        </ul>
      </main>
    </DndProvider>
  );
}

// 使用 dynamic import 並設定 ssr: false
const DynamicSchedulePage = dynamic(() => Promise.resolve(SchedulePageClient), {
  ssr: false,
  loading: () => <p>載入中...</p> // 可以加入一個載入指示器
});

export default DynamicSchedulePage;
