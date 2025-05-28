"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs, addDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import Timeline from "react-calendar-timeline";
import "@/styles/react-calendar-timeline.scss";
import { subDays, addDays, startOfDay, endOfDay } from "date-fns";
import { auth } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { useAuthState } from "react-firebase-hooks/auth";
import { ProjectList, Project } from "./ProjectList";
import { DndProvider, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";

type Group = { id: string; title: string };
type ScheduleItem = {
  id: string;
  group: string;
  title: string;
  start_time: number;
  end_time: number;
  projectId: string;
  userId: string;
};

export default function ProjectsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user] = useAuthState(auth);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createSuccess, setCreateSuccess] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true); setError(null);
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const g = usersSnap.docs.map(doc => ({
          id: doc.id,
          title: doc.data().displayName || doc.data().name || doc.id,
        }));
        setGroups(g);

        const projectsSnap = await getDocs(collection(db, "projects"));
        const p = projectsSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || "未命名專案",
        }));
        setProjects(p);

        const schedulesSnap = await getDocs(collection(db, "schedules"));
        setItems(schedulesSnap.docs.map(doc => {
          const d = doc.data();
          const pj = p.find(pj => pj.id === d.projectId);
          return {
            id: doc.id,
            group: d.userId,
            title: pj ? pj.name : "未知專案",
            start_time: d.start ? d.start.toMillis() : Date.now(),
            end_time: d.end ? d.end.toMillis() : Date.now() + 86400000,
            projectId: d.projectId,
            userId: d.userId,
          };
        }));
      } catch (e: unknown) {
        setError((e as Error).message || "載入失敗");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCreateProject = async () => {
    setCreateLoading(true); setCreateError(null); setCreateSuccess(false);
    if (!user || !newProjectName.trim()) {
      setCreateError("專案名稱不能為空且需要登入。");
      setCreateLoading(false);
      return;
    }
    try {
      const projectRef = await addDoc(collection(db, "projects"), {
        name: newProjectName,
        createdAt: Timestamp.now(),
      });
      setProjects(prev => [...prev, { id: projectRef.id, name: newProjectName }]);
      const start = Timestamp.now();
      const end = Timestamp.fromMillis(start.toMillis() + 86400000);
      const scheduleRef = await addDoc(collection(db, "schedules"), {
        projectId: projectRef.id,
        userId: user.uid,
        start,
        end,
      });
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
    } catch (e: unknown) {
      setCreateError((e as Error).message || "建立專案失敗");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleItemMove = async (itemId: string, dragTime: number, newGroupOrder: number) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const newUserId = groups[newGroupOrder]?.id;
    if (!newUserId) return;
    const duration = item.end_time - item.start_time;
    try {
      await updateDoc(doc(db, "schedules", itemId), {
        userId: newUserId,
        start: Timestamp.fromMillis(dragTime),
        end: Timestamp.fromMillis(dragTime + duration),
      });
      setItems(prev =>
        prev.map(it =>
          it.id === itemId
            ? { ...it, group: newUserId, userId: newUserId, start_time: dragTime, end_time: dragTime + duration }
            : it
        )
      );
    } catch {
      alert("更新日程失敗");
    }
  };

  const handleItemResize = async (itemId: string, time: number, edge: "left" | "right") => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    let newStart = item.start_time, newEnd = item.end_time;
    if (edge === "left") newStart = time; else newEnd = time;
    try {
      await updateDoc(doc(db, "schedules", itemId), {
        start: Timestamp.fromMillis(newStart),
        end: Timestamp.fromMillis(newEnd),
      });
      setItems(prev =>
        prev.map(it =>
          it.id === itemId
            ? { ...it, start_time: newStart, end_time: newEnd }
            : it
        )
      );
    } catch {
      alert("更新時間失敗");
    }
  };

  const handleCreateScheduleItemFromProject = async (project: Project, groupId: string, start: number, end: number) => {
    try {
      const scheduleRef = await addDoc(collection(db, "schedules"), {
        projectId: project.id,
        userId: groupId,
        start: Timestamp.fromMillis(start),
        end: Timestamp.fromMillis(end),
      });
      setItems(prev => [
        ...prev,
        {
          id: scheduleRef.id,
          group: groupId,
          title: project.name,
          start_time: start,
          end_time: end,
          projectId: project.id,
          userId: groupId,
        }
      ]);
    } catch {
      alert("新增排程失敗！");
    }
  };

  // 這裡不變
  const [{ isOver }, drop] = useDrop<Project, void, { isOver: boolean }>({
    accept: "PROJECT",
    drop: (item: Project, monitor) => {
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset || !timelineRef.current) return;

      const timelineRect = timelineRef.current.getBoundingClientRect();

      const x = clientOffset.x - timelineRect.left;
      const y = clientOffset.y - timelineRect.top;

      let groupIndex = 0;
      if (groups.length > 0) {
        const rowHeight = 50;
        groupIndex = Math.floor(y / rowHeight);
        if (groupIndex < 0) groupIndex = 0;
        if (groupIndex >= groups.length) groupIndex = groups.length - 1;
      }
      const groupId = groups[groupIndex]?.id || (groups[0]?.id ?? "");

      const timeline = timelineRef.current;
      const width = timeline.clientWidth;

      const now = new Date();
      const defaultTimeStart = subDays(startOfDay(now), 2).getTime();
      const defaultTimeEnd = addDays(endOfDay(now), 5).getTime();
      const timeRange = defaultTimeEnd - defaultTimeStart;

      const percent = x / width;
      let start = Math.round(defaultTimeStart + timeRange * percent);
      if (start < defaultTimeStart) start = defaultTimeStart;
      if (start > defaultTimeEnd - 86400000) start = defaultTimeEnd - 86400000;

      const end = start + 86400000;

      handleCreateScheduleItemFromProject(item, groupId, start, end);
    },
    collect: monitor => ({
      isOver: monitor.isOver()
    })
  });

  // 這是 callback ref，能安全同時給 drop 跟 timelineRef
  const dropTimelineRef = useCallback((node: HTMLDivElement | null) => {
    drop(node);
    timelineRef.current = node;
  }, [drop]);

  const now = new Date();
  const defaultTimeStart = subDays(startOfDay(now), 2);
  const defaultTimeEnd = addDays(endOfDay(now), 5);

  return (
    <DndProvider backend={HTML5Backend}>
      <main>
        <h1>專案時程表</h1>
        <p>以時間軸方式檢視所有專案日程。可將左側專案拖曳到時間軸。</p>
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
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ minWidth: 180 }}>
              <ProjectList projects={projects} />
            </div>
            <div
              // 這裡改成 callback ref
              ref={dropTimelineRef}
              style={{ flex: 1, border: isOver ? "2px solid #1e90ff" : "1px solid #eee", borderRadius: 4 }}
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
                  year: 1
                }}
                dragSnap={43200000}
              />
            </div>
          </div>
        )}
      </main>
    </DndProvider>
  );
}