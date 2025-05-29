"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { doc, getDoc, collection, getDocs, addDoc, updateDoc, Timestamp, QuerySnapshot, DocumentData, onSnapshot } from "firebase/firestore";
import { db, storage } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { auth } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useAuthState } from "react-firebase-hooks/auth";
import { format, parseISO } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

// Flow 型別
interface Flow {
  id: string;
  content?: string;
  description: string;
  createdAt: Timestamp | Date;
  createdBy: string;
  photoUrl?: string;
  start?: Timestamp | Date;
  end?: Timestamp | Date;
}

export default function ProjectFlowPage() {
  const { projectId } = useParams() as { projectId: string };
  const [loading, setLoading] = useState(true);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [flowName, setFlowName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user] = useAuthState(auth);
  const [users, setUsers] = useState<{[key: string]: string}>({});
  const [uploadingFlowId, setUploadingFlowId] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // 取得專案名稱
  useEffect(() => {
    const fetchProject = async () => {
      if (!projectId) return;
      const ref = doc(db, "projects", projectId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        // setProjectName(snap.data().name || "(未命名專案)");
      }
      setLoading(false);
    };
    fetchProject();
  }, [projectId]);

  // 取得 flows 列表（即時監聽，最省資源且無 eslint 問題）
  useEffect(() => {
    if (!projectId) return;
    const flowsQuery = collection(db, "projects", projectId, "flows");
    const unsubscribe = onSnapshot(flowsQuery, (snap: QuerySnapshot<DocumentData>) => {
      setFlows(
        snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Flow[]
      );
    });
    return () => unsubscribe();
  }, [projectId]);

  // 取得 user 名稱對照表
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

  // 新增：將日期字串與小時合併
  function getDateWithHour(dateStr: string, hour: number): Date {
    const timeZone = 'Asia/Taipei';
    const zonedDate = toZonedTime(parseISO(dateStr), timeZone);
    zonedDate.setHours(hour, 0, 0, 0);
    return zonedDate;
  }

  // 新增流程（移除照片相關）
  const handleAddFlow = async () => {
    if (!flowName.trim()) {
      setError("請輸入流程名稱");
      return;
    }
    if (!startDate) {
      setError("請選擇預定開始日期");
      return;
    }
    if (!description.trim()) {
      setError("請輸入流程內容");
      return;
    }
    if (!user) {
      setError("請先登入");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const start = getDateWithHour(startDate, 7.5);
      let end: Date | null = null;

      if (!endDate && startDate) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + 1);
        end = new Date(d);
      } else if (endDate) {
        end = getDateWithHour(endDate, 18);
      }

      await addDoc(collection(db, "projects", projectId, "flows"), {
        content: flowName.trim(),
        description: description.trim(),
        createdAt: new Date(),
        createdBy: user.uid,
        start: start,
        end: end || new Date(new Date(startDate).setHours(18, 0, 0, 0)),
      });
      setFlowName("");
      setStartDate("");
      setEndDate("");
      setDescription("");
      // flows 會自動即時更新，無需手動 fetch
    } catch {
      setError("建立流程失敗");
    } finally {
      setSubmitting(false);
    }
  };

  // 單一流程照片上傳
  const handleUploadPhoto = async (flowId: string, file: File) => {
    setUploadingFlowId(flowId);
    setUploadError(null);
    try {
      const storageRef = ref(storage, `flows/${flowId}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const photoUrl = await getDownloadURL(storageRef);
      await updateDoc(doc(db, "projects", projectId, "flows", flowId), { photoUrl });
      // 更新 flows 狀態
      setFlows(flows =>
        flows.map(f => f.id === flowId ? { ...f, photoUrl } : f)
      );
    } catch {
      setUploadError("照片上傳失敗");
    } finally {
      setUploadingFlowId(null);
    }
  };

  // 當 startDate 變動時，自動推算 endDate（隔天）
  useEffect(() => {
    if (startDate) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + 1);
      const nextDay = d.toISOString().slice(0, 10);
      setEndDate(nextDay);
    } else {
      setEndDate("");
    }
  }, [startDate]);

  if (loading) return <main className="p-8">載入中...</main>;

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-blue-50 dark:bg-neutral-800 rounded-xl p-6 mb-8 max-w-lg mx-auto shadow">
        <div className="mb-4">
          <label className="block font-medium mb-1">
            流程名稱：
            <input
              type="text"
              value={flowName}
              onChange={e => setFlowName(e.target.value)}
              disabled={submitting}
              className="ml-2 w-56 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="請輸入流程名稱"
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">
            預定開始日：
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              disabled={submitting}
              className="ml-2 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="block font-medium mb-1">
            簡要說明：
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              disabled={submitting}
              className="ml-2 w-72 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
              placeholder="請輸入流程說明"
            />
          </label>
        </div>
        <button
          onClick={handleAddFlow}
          disabled={submitting || !user}
          className="bg-blue-700 hover:bg-blue-800 text-white rounded px-6 py-2 font-semibold text-base transition disabled:opacity-60 disabled:cursor-not-allowed mr-3"
        >
          {submitting ? "建立中..." : "建立流程"}
        </button>
        {error && <div className="text-red-600 mt-2">{error}</div>}
      </div>
      <h2 className="text-lg font-semibold mb-3">已建立流程</h2>
      <div className="max-w-2xl mx-auto">
        {flows.length === 0 ? (
          <div className="text-gray-400">尚無流程</div>
        ) : (
          <ul className="p-0 list-none">
            {flows.sort((a, b) => {
              // 以 start 排序
              const getStart = (f: Flow) =>
                f.start && typeof f.start === 'object' && 'toDate' in f.start ? f.start.toDate().toISOString().slice(0, 10) : '';
              return getStart(a).localeCompare(getStart(b));
            }).map(flow => (
              <li key={flow.id} className="bg-white dark:bg-neutral-900 rounded-lg shadow mb-4 p-5">
                <div className="mb-1"><span className="font-medium">流程名稱：</span>{flow.content || '-'}</div>
                <div className="mb-1">
                  <span className="font-medium">預定開始日：</span>
                  {flow.start && typeof flow.start === 'object' && 'toDate' in flow.start
                    ? flow.start.toDate().toISOString().slice(0, 10)
                    : '-'}
                </div>
                <div className="mb-1">
                  <span className="font-medium">預定結束日：</span>
                  {flow.end && typeof flow.end === 'object' && 'toDate' in flow.end
                    ? flow.end.toDate().toISOString().slice(0, 10)
                    : '-'}
                </div>
                <div className="mb-1"><span className="font-medium">內容：</span>{flow.description}</div>
                <div className="mb-1">
                  <span className="font-medium">上傳/更換照片：</span>
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: "inline-block" }}
                    disabled={uploadingFlowId === flow.id || !user}
                    onChange={event => {
                      const file = event.target.files?.[0];
                      if (file) handleUploadPhoto(flow.id, file);
                      event.target.value = "";
                    }}
                  />
                  {uploadingFlowId === flow.id && (
                    <span className="ml-2 text-blue-600">上傳中...</span>
                  )}
                  {uploadError && uploadingFlowId === flow.id && (
                    <span className="ml-2 text-red-600">{uploadError}</span>
                  )}
                </div>
                {flow.photoUrl && (
                  <div className="mb-1">
                    <span className="font-medium">照片：</span>
                    <a href={flow.photoUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                      查看照片
                    </a>
                    <div className="mt-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={flow.photoUrl} alt="流程照片" className="max-h-40 rounded border" />
                    </div>
                  </div>
                )}
                <div className="text-gray-500 text-sm mt-2">
                  建立人：{users[flow.createdBy] || flow.createdBy}，建立時間：{flow.createdAt && typeof flow.createdAt === 'object' && 'toDate' in flow.createdAt ? format(toZonedTime(flow.createdAt.toDate(), 'Asia/Taipei'), 'yyyy-MM-dd HH:mm:ss') : String(flow.createdAt)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* <button
        onClick={() => router.push(`/admin/projects/${projectId}`)}
        className="bg-blue-400 hover:bg-blue-500 text-white rounded px-6 py-2 font-semibold text-base transition mt-8"
      >
        返回專案詳情
      </button> */}
    </main>
  );
}
