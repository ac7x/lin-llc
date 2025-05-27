"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { collection, getDocs, addDoc, doc, updateDoc, Timestamp } from "firebase/firestore";
import Timeline from "react-calendar-timeline";
import "react-calendar-timeline/style.css";
import { subDays, addDays, startOfDay, endOfDay } from "date-fns";
import { auth } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { useAuthState } from "react-firebase-hooks/auth";

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
      const scheduleData = {
        projectId: projectRef.id,
        userId: user.uid,
        start,
        end,
      };
      const scheduleRef = await addDoc(collection(db, "schedules"), scheduleData);

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

  // 指派 schedule 給 user（建立新日程）
  const handleAssignSchedule = async (projectId: string, userId: string) => {
    try {
      // 預設時間 today~today+1天
      const start = Timestamp.now();
      const end = Timestamp.fromMillis(start.toMillis() + 24*60*60*1000);
      const scheduleData = { projectId, userId, start, end };
      const scheduleRef = await addDoc(collection(db, "schedules"), scheduleData);
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

  // 移動/調整日程
  const handleItemMove = async (
    itemId: string,
    dragTime: number,
    newGroupOrder: number
  ) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;
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
          />
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
        </>
      )}
    </main>
  );
}
