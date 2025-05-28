"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
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
  const datasetRef = useRef<DataSet<any, 'id'>>(null);

  const handleItemMove = useCallback(async (itemId: string, dragTime: number, newGroupId: string) => {
    const item = items.find(i => i.id === itemId);
    if (!item) {
      throw new Error("找不到項目");
    }
    
    const duration = item.end.getTime() - item.start.getTime();
    const scheduleRef = doc(db, "schedules", itemId);
    
    try {
      console.log("正在更新數據庫...", {itemId, dragTime, newGroupId});
      await updateDoc(scheduleRef, {
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
      
      console.log("數據庫更新成功");
      return true;
    } catch (error: unknown) {
      console.error("更新數據庫失敗:", error);
      alert("更新日程失敗: " + (error instanceof Error ? error.message : "未知錯誤"));
      return false;
    }
  }, [items]);

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
    const groupsDataSet = new DataSet<any, 'id'>(groups);
    datasetRef.current = new DataSet<any, 'id'>(items);

    const options = {
      editable: {
        add: false,
        updateTime: true,
        updateGroup: true,
        remove: false
      },
      onMoving: function(item: any, callback: Function) {
        callback(item);
      },
      onMove: async function(item: any, callback: Function) {
        const success = await handleItemMove(item.id, item.start.getTime(), item.group);
        if (success) {
          callback(item);
        } else {
          callback(null);
        }
      },
      snap: (date: Date) => {
        const hour = date.getHours();
        date.setHours(hour - (hour % 12), 0, 0, 0);
        return date;
      },
      orientation: {
        axis: "both",
        item: "top",
      }
    };

    try {
      timelineInstance.current = new Timeline(container, datasetRef.current, groupsDataSet, options);
      console.log('Timeline 已初始化');
    } catch (err) {
      console.error("Timeline 初始化失敗:", err);
    }

    return () => {
      if (timelineInstance.current) {
        timelineInstance.current.destroy();
      }
    };
  }, [loading, error, items, groups, handleItemMove]);

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