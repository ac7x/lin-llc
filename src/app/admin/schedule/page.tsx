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

type Item = {
  id: string;
  group: string; // For react-calendar-timeline display (primary user)
  title: string;
  start_time: number;
  end_time: number;
  assignedUsers: string[]; // All assigned user IDs
};

export default function ProjectsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [items, setItems] = useState<Item[]>([]);
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
        setGroups(groupsData); // Set groups early for default fallbacks

        // 取得 projects 作為 items
        const projectsSnap = await getDocs(collection(db, "projects"));
        const itemsData: Item[] = projectsSnap.docs.map((doc) => {
          const data = doc.data();
          const start = data.createdAt?.toDate?.() || new Date();
          const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
          
          let assignedUsers: string[] = [];
          if (Array.isArray(data.assignedUsers)) {
            assignedUsers = data.assignedUsers;
          } else if (data.createdBy) {
            assignedUsers = [data.createdBy];
          }

          const displayGroupId = assignedUsers.length > 0 
            ? assignedUsers[0] 
            : (groupsData.length > 0 ? groupsData[0].id : "unknown");

          return {
            id: doc.id,
            group: displayGroupId,
            assignedUsers: assignedUsers,
            title: data.name || "未命名專案",
            start_time: start.getTime(),
            end_time: end.getTime(),
          };
        });

        setItems(itemsData);
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("載入失敗");
        }
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
      const projectData = {
        name: newProjectName,
        createdAt: Timestamp.now(),
        assignedUsers: [user.uid],
      };
      const docRef = await addDoc(collection(db, "projects"), projectData);
      
      const newItem: Item = {
        id: docRef.id,
        group: user.uid, // Display under the creator's group initially
        title: newProjectName,
        start_time: projectData.createdAt.toDate().getTime(),
        end_time: new Date(projectData.createdAt.toDate().getTime() + 24 * 60 * 60 * 1000).getTime(),
        assignedUsers: [user.uid],
      };
      setItems(prevItems => [...prevItems, newItem]);

      setCreateSuccess(true);
      setNewProjectName(""); 
    } catch (err: unknown) {
      if (err instanceof Error) {
        setCreateError(err.message);
      } else {
        setCreateError("建立專案失敗");
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAssignProject = async (projectId: string, newUserIds: string[]) => {
    try {
      await updateDoc(doc(db, "projects", projectId), {
        assignedUsers: newUserIds,
      });
      
      const newDisplayGroup = newUserIds.length > 0 
        ? newUserIds[0] 
        : (groups.length > 0 ? groups[0].id : "unknown");

      setItems((prev) =>
        prev.map((it) =>
          it.id === projectId
            ? { ...it, assignedUsers: newUserIds, group: newDisplayGroup }
            : it
        )
      );
    } catch {
      alert("指派失敗");
    }
  };

  const handleItemMove = async (
    itemId: string,
    dragTime: number,
    newGroupOrder: number
  ) => {
    const item = items.find((i) => i.id === itemId);
    if (!item) return;

    const newDisplayGroupId = groups[newGroupOrder]?.id;
    if (!newDisplayGroupId) return; 

    const duration = item.end_time - item.start_time;
    const newStart = dragTime;
    const newEnd = dragTime + duration;

    // Ensure the new display group is part of assignedUsers
    const updatedAssignedUsers = Array.from(new Set([newDisplayGroupId, ...item.assignedUsers]));

    try {
      await updateDoc(doc(db, "projects", itemId), {
        createdAt: Timestamp.fromMillis(newStart),
        assignedUsers: updatedAssignedUsers,
      });
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? {
                ...it,
                group: newDisplayGroupId,
                start_time: newStart,
                end_time: newEnd,
                assignedUsers: updatedAssignedUsers,
              }
            : it
        )
      );
    } catch {
      alert("更新時間或指派失敗");
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
      await updateDoc(doc(db, "projects", itemId), {
        createdAt: Timestamp.fromMillis(newStart),
        // 若有 endAt 欄位可同步更新
      });
      setItems((prev) =>
        prev.map((it) =>
          it.id === itemId
            ? {
                ...it,
                start_time: newStart,
                end_time: newEnd,
              }
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
      <p>以時間軸方式檢視所有專案。</p>
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
          <h2>快速指派地點給用戶</h2>
          <ul>
            {items.map((item) => (
              <li key={item.id}>
                {item.title}{" "}
                {groups.map((g) => (
                  <label key={g.id} style={{ marginRight: 8, display: 'inline-block' }}>
                    <input
                      type="checkbox"
                      checked={item.assignedUsers?.includes(g.id)}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        let newAssignedUsers: string[];
                        if (checked) {
                          newAssignedUsers = Array.from(new Set([...(item.assignedUsers || []), g.id]));
                        } else {
                          newAssignedUsers = (item.assignedUsers || []).filter((uid) => uid !== g.id);
                        }
                        handleAssignProject(item.id, newAssignedUsers);
                      }}
                    />
                    {g.title}
                  </label>
                ))}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
