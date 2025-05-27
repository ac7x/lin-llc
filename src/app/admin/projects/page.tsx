"use client";

import React, { useState } from "react";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { addDoc, collection } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

export default function ProjectsPage() {
  const [user] = useAuthState(auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCreateProject = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await addDoc(collection(db, "projects"), {
        name: "新專案",
        createdAt: new Date(),
        createdBy: user?.uid || null,
      });
      setSuccess(true);
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
      <h1>專案管理</h1>
      <p>這裡是管理所有專案的頁面。</p>
      <button onClick={handleCreateProject} disabled={loading || !user}>
        {loading ? "建立中..." : "建立專案"}
      </button>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {success && <div style={{ color: "green" }}>專案已建立！</div>}
    </main>
  );
}
