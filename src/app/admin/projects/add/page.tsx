"use client";

import React, { useState } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { addDoc, collection } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { useRouter } from "next/navigation";

export default function ProjectAddPage() {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [projectName, setProjectName] = useState("");
  const router = useRouter();

  const handleCreateProject = async () => {
    if (!projectName.trim()) {
      setError("請輸入專案名稱");
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await addDoc(collection(db, "projects"), {
        name: projectName,
        createdAt: new Date(),
        createdBy: user?.uid || null,
      });
      setSuccess(true);
      setProjectName("");
      setTimeout(() => {
        router.push("/admin/projects");
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("建立專案失敗");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <h1>新增專案</h1>
      <input
        type="text"
        placeholder="請輸入專案名稱"
        value={projectName}
        onChange={(e) => setProjectName(e.target.value)}
        disabled={loading}
        style={{ marginRight: 8 }}
      />
      <button onClick={handleCreateProject} disabled={loading || !user}>
        {loading ? "建立中..." : "建立專案"}
      </button>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {success && <div style={{ color: "green" }}>專案已建立！即將返回列表...</div>}
      <div style={{ marginTop: 16 }}>
        <button onClick={() => router.push("/admin/projects")}>返回專案列表</button>
      </div>
    </main>
  );
}
