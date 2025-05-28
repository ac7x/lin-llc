"use client";

import React, { useEffect, useState, useRef } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs, addDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import { Timeline, DataSet } from "vis-timeline/standalone";
import "vis-timeline/styles/vis-timeline-graph2d.css";
import { subDays, addDays, startOfDay, endOfDay } from "date-fns";
import { auth } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { useAuthState } from "react-firebase-hooks/auth";

type Group = { id: string; content: string; };
type ScheduleItem = {
  id: string;
  group: string;
  content: string;
  start: Date;
  end: Date;
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
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineInstance = useRef<Timeline | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const g = usersSnap.docs.map(doc => ({
          id: doc.id,
          content: doc.data().displayName || doc.data().name || doc.id,
        }));
        setGroups(g);

        const projectsSnap = await getDocs(collection(db, "projects"));
        const p = projectsSnap.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || "未命名專案",
        }));

        const schedulesSnap = await getDocs(collection(db, "schedules"));
        const scheduleItems = schedulesSnap.docs.map(doc => {
          const d = doc.data();
          const pj = p.find(pj => pj.id === d.projectId);
          return {
            id: doc.id,
            group: d.userId,
            content: pj ? pj.name : "未知專案",
            start: d.start ? d.start.toDate() : new Date(),
            end: d.end ? d.end.toDate() : new Date(Date.now() + 86400000),
            projectId: d.projectId,
            userId: d.userId,
          };
        });
        setItems(scheduleItems);
      } catch (err: unknown) {
        setError((err as Error).message || "載入失敗");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!timelineRef.current || loading || error) return;

    const container = timelineRef.current;
    const groupsDataSet = new DataSet(groups);
    const itemsDataSet = new DataSet(items);

    const options = {
      editable: {
        updateTime: true,
        updateGroup: true,
      },
      snap: (date: Date) => {
        const hour = date.getHours();
        date.setHours(hour - (hour % 12), 0, 0, 0);
        return date;
      },
      orientation: {
        axis: "both",
        item: "top",
      },
    };

    timelineInstance.current = new Timeline(container, itemsDataSet, groupsDataSet, options);

    timelineInstance.current.on("move", function(item: any) {
      handleItemMove(item.id, item.start.getTime(), item.group);
    });

    return () => {
      if (timelineInstance.current) {
        timelineInstance.current.destroy();
      }
    };
  }, [loading, error, items, groups]);

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
      });
      const start = Timestamp.now();
      const end = Timestamp.fromMillis(start.toMillis() + 86400000);
      const scheduleRef = await addDoc(collection(db, "schedules"), {
        projectId: projectRef.id,
        userId: user.uid,
        start,
        end,
      });
      const newItem = {
        id: scheduleRef.id,
        group: user.uid,
        content: newProjectName,
        start: start.toDate(),
        end: end.toDate(),
        projectId: projectRef.id,
        userId: user.uid,
      };
      setItems(prev => [...prev, newItem]);
      setCreateSuccess(true);
      setNewProjectName("");
    } catch (err: unknown) {
      setCreateError((err as Error).message || "建立專案失敗");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleItemMove = async (itemId: string, dragTime: number, newGroupId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) return;
    const duration = item.end.getTime() - item.start.getTime();
    try {
      await updateDoc(doc(db, "schedules", itemId), {
        userId: newGroupId,
        start: Timestamp.fromMillis(dragTime),
        end: Timestamp.fromMillis(dragTime + duration),
      });
      setItems(prev =>
        prev.map(it =>
          it.id === itemId
            ? {
                ...it,
                group: newGroupId,
                userId: newGroupId,
                start: new Date(dragTime),
                end: new Date(dragTime + duration)
              }
            : it
        )
      );
    } catch {
      alert("更新日程失敗");
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