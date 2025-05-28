"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs, addDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import Timeline from "react-calendar-timeline";
import "@/styles/react-calendar-timeline.scss";
import { subDays, addDays, startOfDay, endOfDay } from "date-fns";
import { auth } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { useAuthState } from "react-firebase-hooks/auth";

type Group = { id: string; title: string; };
type Project = { id: string; name: string; };
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
      } catch (err: unknown) {
        setError((err as Error).message || "載入失敗");
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
      const start = Timestamp.now();
      const end = Timestamp.fromMillis(start.toMillis() + 86400000);
      const scheduleRef = await addDoc(collection(db, "schedules"), {
        projectId: projectRef.id,
        userId: user.uid,
        start,
        end,
      });
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
      setCreateError((err as Error).message || "建立專案失敗");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAssignSchedule = async (projectId: string, userId: string) => {
    try {
      const start = Timestamp.now();
      const end = Timestamp.fromMillis(start.toMillis() + 86400000);
      const scheduleRef = await addDoc(collection(db, "schedules"), { projectId, userId, start, end });
      const project = projects.find(p => p.id === projectId);
      setItems(prev => [
        ...prev,
        {
          id: scheduleRef.id,
          group: userId,
          title: project ? project.name : "未知專案",
          start_time: start.toMillis(),
          end_time: end.toMillis(),
          projectId,
          userId,
        }
      ]);
    } catch {
      alert("指派失敗");
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

  const now = new Date();
  const defaultTimeStart = subDays(startOfDay(now), 2);
  const defaultTimeEnd = addDays(endOfDay(now), 5);

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
        <>
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
          <h2>快速指派專案給用戶（建立新日程）</h2>
          <ul>
            {projects.map(project => (
              <li key={project.id}>
                {project.name}{" "}
                {groups.map(g => (
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
        </>
      )}
    </main>
  );
}