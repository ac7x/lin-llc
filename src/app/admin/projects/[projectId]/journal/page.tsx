"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, Timestamp, addDoc, collection, getDocs, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

// 型別定義
 type ProjectLog = {
  id: string;
  content: string;
  createdAt: Timestamp;
  createdBy: string;
  photoUrl?: string;
};

export default function ProjectJournalPage() {
  const { projectId } = useParams() as { projectId: string };
  const [logs, setLogs] = useState<ProjectLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLog, setNewLog] = useState("");
  const [users, setUsers] = useState<{[key: string]: string}>({});
  const [uploadingLogId, setUploadingLogId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [user] = useAuthState(auth);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!projectId) return;
      const logsSnap = await getDocs(collection(db, "projects", projectId, "logs"));
      const logs = logsSnap.docs.map(doc => ({
        id: doc.id,
        content: doc.data().content,
        createdAt: doc.data().createdAt,
        createdBy: doc.data().createdBy,
        photoUrl: doc.data().photoUrl,
      })) as ProjectLog[];
      setLogs(logs);
      setLoading(false);
    };
    fetchLogs();
  }, [projectId]);

  useEffect(() => {
    const fetchUsers = async () => {
      const snapshot = await getDocs(collection(db, "users"));
      const usersData = snapshot.docs.reduce((acc, doc) => ({
        ...acc,
        [doc.id]: doc.data().displayName || doc.data().name || undefined
      }), {} as {[key: string]: string | undefined});
      setUsers(usersData);
    };
    fetchUsers();
  }, []);

  const handleAddLog = async () => {
    if (!newLog.trim() || !user) return;
    try {
      await addDoc(collection(db, "projects", projectId, "logs"), {
        content: newLog.trim(),
        createdAt: new Date(),
        createdBy: user.uid
      });
      setNewLog("");
      // 重新獲取日誌
      const logsSnap = await getDocs(collection(db, "projects", projectId, "logs"));
      const logs = logsSnap.docs.map(doc => ({
        id: doc.id,
        content: doc.data().content,
        createdAt: doc.data().createdAt,
        createdBy: doc.data().createdBy,
        photoUrl: doc.data().photoUrl,
      })) as ProjectLog[];
      setLogs(logs);
    } catch {
      // 可加上錯誤提示
    }
  };

  const handleUploadLogPhoto = async (logId: string, file: File) => {
    setUploadingLogId(logId);
    setUploadError(null);
    try {
      const storageRef = ref(storage, `logs/${logId}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const photoUrl = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "projects", projectId, "logs", logId), { photoUrl });
      // 重新取得 logs
      const logsSnap = await getDocs(collection(db, "projects", projectId, "logs"));
      const logs = logsSnap.docs.map(doc => ({
        id: doc.id,
        content: doc.data().content,
        createdAt: doc.data().createdAt,
        createdBy: doc.data().createdBy,
        photoUrl: doc.data().photoUrl,
      })) as ProjectLog[];
      setLogs(logs);
    } catch {
      setUploadError("照片上傳失敗");
    } finally {
      setUploadingLogId(null);
    }
  };

  if (loading) return <main className="p-8">載入中...</main>;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="add-log mb-6">
        <textarea
          value={newLog}
          onChange={(e) => setNewLog(e.target.value)}
          placeholder="輸入新的進度記錄..."
          rows={3}
          className="w-full p-2 mb-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
        />
        <button
          onClick={handleAddLog}
          disabled={!newLog.trim() || !user}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded px-5 py-2 font-semibold text-base transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          添加記錄
        </button>
      </div>
      <div className="logs-list flex flex-col gap-3">
        {logs.sort((a, b) => b.createdAt.seconds - a.createdAt.seconds)
          .map((log) => (
          <div key={log.id} className="log-item p-4 bg-gray-50 dark:bg-neutral-800 rounded-lg shadow">
            <div className="log-content whitespace-pre-wrap">{log.content}</div>
            <div className="log-meta mt-2 text-sm text-gray-500">
              {log.createdAt.toDate().toLocaleString()} 由 {users[log.createdBy] || log.createdBy}
            </div>
            <div className="mt-2">
              <span className="font-medium">上傳/更換照片：</span>
              <input
                type="file"
                accept="image/*"
                style={{ display: "inline-block" }}
                disabled={uploadingLogId === log.id || !user}
                onChange={event => {
                  const file = event.target.files?.[0];
                  if (file) handleUploadLogPhoto(log.id, file);
                  event.target.value = "";
                }}
              />
              {uploadingLogId === log.id && (
                <span className="ml-2 text-blue-600">上傳中...</span>
              )}
              {uploadError && uploadingLogId === log.id && (
                <span className="ml-2 text-red-600">{uploadError}</span>
              )}
            </div>
            {log.photoUrl && (
              <div className="mb-1 mt-2">
                <span className="font-medium">照片：</span>
                <a href={log.photoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  查看照片
                </a>
                <div className="mt-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={log.photoUrl} alt="日誌照片" className="max-h-40 rounded border" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
