"use client";

import { useParams, useRouter } from "next/navigation";
import { useDocument } from "react-firebase-hooks/firestore";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { Project } from "@/types/project";
import { Workpackage, DailyReport, ActivityLog, IssueRecord, MaterialEntry, PhotoRecord } from "@/types/workpackage";
import { useState, useMemo, useCallback, useEffect } from "react";
import { updateWorkpackagesProgress } from "@/utils/progressCalculation";
import Link from "next/link";

export default function ProjectDetailPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params?.project as string;
    const [projectDoc, loading, error] = useDocument(doc(db, "projects", projectId));
    const [tab, setTab] = useState<"info" | "create" | "edit" | "journal" | "photos" | "materials" | "issues">("info");
    const [saving, setSaving] = useState(false);

    // 工作包相關狀態
    const [newWorkpackage, setNewWorkpackage] = useState({
        name: "",
        description: "",
        category: "",
        priority: "medium" as "low" | "medium" | "high",
    });

    // 日誌相關狀態
    const [newReport, setNewReport] = useState<{
        weather: string;
        temperature: number;
        rainfall: number;
        workforceCount: number;
        description: string;
        issues: string;
    }>({
        weather: "晴",
        temperature: 25,
        rainfall: 0,
        workforceCount: 0,
        description: "",
        issues: "",
    });

    // 問題追蹤相關狀態
    const [newIssue, setNewIssue] = useState<{
        type: 'quality' | 'safety' | 'progress' | 'other';
        description: string;
        severity: 'low' | 'medium' | 'high';
        assignedTo: string;
        dueDate: string;
    }>({
        type: 'progress',
        description: "",
        severity: 'medium',
        assignedTo: "",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 一週後
    });

    // 照片相關狀態
    const [newPhoto, setNewPhoto] = useState<{
        file: File | null;
        type: "progress" | "issue" | "material" | "safety" | "other";
        description: string;
        workpackageId?: string;
        zoneId?: string;
    }>({
        file: null,
        type: "progress",
        description: "",
    });
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    // 材料管理相關狀態
    const [newMaterial, setNewMaterial] = useState<{
        name: string;
        quantity: number;
        unit: string;
        supplier: string;
        notes: string;
    }>({
        name: "",
        quantity: 0,
        unit: "件",
        supplier: "",
        notes: ""
    });

    // 過濾器狀態
    const [filter, setFilter] = useState<{
        type: string;
        status: string;
        severity: string;
    }>({
        type: "",
        status: "",
        severity: ""
    });

    if (loading) return <div>載入中...</div>;
    if (error) return <div>錯誤: {error.message}</div>;
    if (!projectDoc?.exists()) return <div>找不到專案</div>;

    const project = projectDoc.data() as Project;

    // 從 Firestore 獲取各項數據
    const reports = useMemo(() => project.reports || [], [projectDoc]);
    const issues = useMemo(() => project.issues || [], [projectDoc]);
    const photos = useMemo(() => project.photos || [], [projectDoc]);
    const materials = useMemo(() => {
        // 從報告中收集所有材料條目
        const allMaterials: MaterialEntry[] = [];
        reports.forEach(report => {
            if (report.materials && report.materials.length > 0) {
                allMaterials.push(...report.materials);
            }
        });
        return allMaterials;
    }, [reports]);

    // 篩選問題
    const filteredIssues = useMemo(() => {
        return issues.filter(issue => {
            if (filter.type && filter.type !== "all" && issue.type !== filter.type) return false;
            if (filter.status && filter.status !== "all" && issue.status !== filter.status) return false;
            if (filter.severity && filter.severity !== "all" && issue.severity !== filter.severity) return false;
            return true;
        });
    }, [issues, filter]);

    // 工作包相關函數
    const handleAddWorkpackage = async () => {
        if (!newWorkpackage.name.trim()) return;
        setSaving(true);
        try {
            const newWp: Workpackage = {
                id: Date.now().toString(),
                name: newWorkpackage.name.trim(),
                description: newWorkpackage.description,
                category: newWorkpackage.category,
                priority: newWorkpackage.priority,
                status: "新建立",
                progress: 0,
                createdAt: new Date().toISOString(),
                subWorkpackages: [],
            };

            const updatedWorkpackages = [...(project.workpackages || []), newWp];
            await updateDoc(doc(db, "projects", projectId), {
                workpackages: updatedWorkpackages,
            });

            setNewWorkpackage({
                name: "",
                description: "",
                category: "",
                priority: "medium",
            });
        } catch (error) {
            console.error("建立工作包失敗:", error);
        } finally {
            setSaving(false);
        }
    };

    // 工作日誌相關函數
    const handleSubmitReport = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving) return;

        setSaving(true);
        try {
            const now = new Date();
            const reportId = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

            const newDailyReport: DailyReport = {
                id: reportId,
                date: now.toISOString(),
                weather: newReport.weather,
                temperature: newReport.temperature,
                rainfall: newReport.rainfall,
                workforceCount: newReport.workforceCount,
                materials: [],
                activities: [],
                issues: [],
                photos: [],
                createdBy: "current-user", // 這裡可以替換為實際的用戶ID
                createdAt: now.toISOString(),
            };

            await updateDoc(doc(db, "projects", projectId), {
                reports: arrayUnion(newDailyReport),
            });

            setNewReport({
                weather: "晴",
                temperature: 25,
                rainfall: 0,
                workforceCount: 0,
                description: "",
                issues: "",
            });

            alert("日誌提交成功！");
        } catch (error) {
            console.error("提交日誌失敗:", error);
            alert("提交失敗，請重試。");
        } finally {
            setSaving(false);
        }
    };

    // 問題追蹤相關函數
    const handleAddIssue = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving || !newIssue.description.trim()) return;

        setSaving(true);
        try {
            const newIssueRecord: IssueRecord = {
                id: Date.now().toString(),
                type: newIssue.type,
                description: newIssue.description.trim(),
                severity: newIssue.severity,
                status: 'open',
                assignedTo: newIssue.assignedTo,
                dueDate: newIssue.dueDate,
            };

            await updateDoc(doc(db, "projects", projectId), {
                issues: arrayUnion(newIssueRecord),
            });

            setNewIssue({
                type: 'progress',
                description: "",
                severity: 'medium',
                assignedTo: "",
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });

            alert("問題已成功添加！");
        } catch (error) {
            console.error("添加問題失敗:", error);
            alert("添加失敗，請重試。");
        } finally {
            setSaving(false);
        }
    };

    // 照片上傳相關函數
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewPhoto(prev => ({ ...prev, file: e.target.files![0] }));
        }
    };

    const handlePhotoUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPhoto.file || isUploading) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            const storage = getStorage();
            const fileExt = newPhoto.file.name.split('.').pop();
            const fileName = `projects/${projectId}/photos/${Date.now()}.${fileExt}`;
            const storageRef = ref(storage, fileName);

            // 上傳照片到 Firebase Storage
            const uploadTask = uploadBytesResumable(storageRef, newPhoto.file);

            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(Math.round(progress));
                },
                (error) => {
                    console.error("上傳照片失敗:", error);
                    alert("上傳照片失敗，請重試。");
                    setIsUploading(false);
                },
                async () => {
                    // 上傳完成後，獲取下載 URL
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    const photoRecord: PhotoRecord = {
                        id: Date.now().toString(),
                        url: downloadURL,
                        type: newPhoto.type,
                        description: newPhoto.description,
                        workpackageId: newPhoto.workpackageId,
                        zoneId: newPhoto.zoneId,
                        createdAt: new Date().toISOString(),
                        createdBy: "current-user", // 這裡可以替換為實際的用戶ID
                    };

                    // 更新項目文檔，添加照片記錄
                    await updateDoc(doc(db, "projects", projectId), {
                        photos: arrayUnion(photoRecord),
                    });

                    setNewPhoto({
                        file: null,
                        type: "progress",
                        description: "",
                    });
                    setIsUploading(false);
                    setUploadProgress(0);
                    alert("照片上傳成功！");
                }
            );
        } catch (error) {
            console.error("處理照片上傳失敗:", error);
            setIsUploading(false);
        }
    };

    // 材料管理相關函數
    const handleAddMaterial = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving || !newMaterial.name.trim()) return;

        setSaving(true);
        try {
            const newMaterialEntry: MaterialEntry = {
                materialId: Date.now().toString(),
                name: newMaterial.name.trim(),
                quantity: newMaterial.quantity,
                unit: newMaterial.unit,
                supplier: newMaterial.supplier,
                notes: newMaterial.notes,
            };

            // 假設我們添加到最新的日誌中
            if (reports.length > 0) {
                const latestReport = reports[reports.length - 1];
                const updatedMaterials = [...(latestReport.materials || []), newMaterialEntry];

                // 更新最新報告中的材料列表
                const updatedReports = reports.map(report => {
                    if (report.id === latestReport.id) {
                        return { ...report, materials: updatedMaterials };
                    }
                    return report;
                });

                await updateDoc(doc(db, "projects", projectId), {
                    reports: updatedReports,
                });
            } else {
                // 如果還沒有報告，創建一個新的
                const now = new Date();
                const reportId = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;

                const newDailyReport: DailyReport = {
                    id: reportId,
                    date: now.toISOString(),
                    weather: "晴",
                    temperature: 25,
                    rainfall: 0,
                    workforceCount: 0,
                    materials: [newMaterialEntry],
                    activities: [],
                    issues: [],
                    photos: [],
                    createdBy: "current-user", // 這裡可以替換為實際的用戶ID
                    createdAt: now.toISOString(),
                };

                await updateDoc(doc(db, "projects", projectId), {
                    reports: arrayUnion(newDailyReport),
                });
            }

            setNewMaterial({
                name: "",
                quantity: 0,
                unit: "件",
                supplier: "",
                notes: ""
            });

            alert("材料已成功添加！");
        } catch (error) {
            console.error("添加材料失敗:", error);
            alert("添加失敗，請重試。");
        } finally {
            setSaving(false);
        }
    };

    // 更新所有工作包進度的函數
    const updateAllWorkpackagesProgress = async () => {
        if (!projectDoc?.exists() || !project.workpackages) return;

        try {
            // 從報告中收集所有活動記錄
            const allActivityLogs: ActivityLog[] = [];
            reports.forEach(report => {
                if (report.activities && report.activities.length > 0) {
                    allActivityLogs.push(...report.activities);
                }
            });

            // 使用工具函數更新工作包進度
            const updatedWorkpackages = updateWorkpackagesProgress(project.workpackages, allActivityLogs);

            // 更新到 Firestore
            await updateDoc(doc(db, "projects", projectId), {
                workpackages: updatedWorkpackages,
            });

            console.log("已更新所有工作包進度");
        } catch (error) {
            console.error("更新工作包進度失敗:", error);
        }
    };

    // 當報告發生變化時重新計算進度
    useEffect(() => {
        updateAllWorkpackagesProgress();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reports.length]);

    return (
        <main className="max-w-4xl mx-auto p-4">
            {/* Tabs */}
            <div className="mb-6 border-b flex flex-wrap gap-1">
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${tab === "info" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-gray-600"}`}
                    onClick={() => setTab("info")}
                >
                    專案資訊
                </button>
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${tab === "journal" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-gray-600"}`}
                    onClick={() => setTab("journal")}
                >
                    <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        工作日誌
                    </span>
                </button>
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${tab === "photos" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-gray-600"}`}
                    onClick={() => setTab("photos")}
                >
                    <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        照片記錄
                    </span>
                </button>
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${tab === "materials" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-gray-600"}`}
                    onClick={() => setTab("materials")}
                >
                    <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0v10l-8 4m-8-4V7m8 4v10M4 7v10l8-4" />
                        </svg>
                        材料管理
                    </span>
                </button>
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${tab === "issues" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-gray-600"}`}
                    onClick={() => setTab("issues")}
                >
                    <span className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        問題追蹤
                    </span>
                </button>
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${tab === "create" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-gray-600"}`}
                    onClick={() => setTab("create")}
                >
                    建立工作包
                </button>
                <button
                    className={`px-4 py-2 -mb-px border-b-2 ${tab === "edit" ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-gray-600"}`}
                    onClick={() => setTab("edit")}
                >
                    編輯資訊
                </button>
            </div>
            {/* Tab Content */}
            {tab === "info" && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">專案資訊</h2>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-gray-500">協調者</label>
                            <div>{project.coordinator || '-'}</div>
                        </div>
                        <div>
                            <label className="text-gray-500">監工</label>
                            <div>{project.supervisor || '-'}</div>
                        </div>
                        <div>
                            <label className="text-gray-500">安全人員</label>
                            <div>{project.safetyOfficer || '-'}</div>
                        </div>
                        <div>
                            <label className="text-gray-500">地區</label>
                            <div>{project.region || '-'}</div>
                        </div>
                        <div>
                            <label className="text-gray-500">地址</label>
                            <div>{project.address || '-'}</div>
                        </div>
                        <div>
                            <label className="text-gray-500">起始日</label>
                            <div>{project.startDate ? new Date(project.startDate).toLocaleDateString() : '-'}</div>
                        </div>
                        <div>
                            <label className="text-gray-500">預估結束日</label>
                            <div>{project.estimatedEndDate ? new Date(project.estimatedEndDate).toLocaleDateString() : '-'}</div>
                        </div>
                        <div>
                            <label className="text-gray-500">業主</label>
                            <div>{project.owner || '-'}</div>
                        </div>
                    </div>
                </div>
            )}
            {tab === "create" && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">建立工作包</h2>
                    <div>專案名稱：{project.projectName}</div>
                    {/* 新增工作包表單 */}
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">工作包名稱</label>
                            <input
                                className="border px-3 py-2 rounded w-full"
                                placeholder="工作包名稱"
                                value={newWorkpackage.name}
                                onChange={e => setNewWorkpackage(prev => ({ ...prev, name: e.target.value }))}
                                disabled={saving}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">描述</label>
                            <textarea
                                className="border px-3 py-2 rounded w-full"
                                placeholder="工作包描述"
                                value={newWorkpackage.description}
                                onChange={e => setNewWorkpackage(prev => ({ ...prev, description: e.target.value }))}
                                rows={3}
                                disabled={saving}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">類別</label>
                            <input
                                className="border px-3 py-2 rounded w-full"
                                placeholder="工作包類別"
                                value={newWorkpackage.category}
                                onChange={e => setNewWorkpackage(prev => ({ ...prev, category: e.target.value }))}
                                disabled={saving}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">優先級</label>
                            <select
                                className="border px-3 py-2 rounded w-full"
                                value={newWorkpackage.priority}
                                onChange={e => setNewWorkpackage(prev => ({ ...prev, priority: e.target.value as "low" | "medium" | "high" }))}
                                disabled={saving}
                            >
                                <option value="low">低</option>
                                <option value="medium">中</option>
                                <option value="high">高</option>
                            </select>
                        </div>
                        <div className="pt-2">
                            <button
                                className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                onClick={handleAddWorkpackage}
                                disabled={saving || !newWorkpackage.name.trim()}
                            >
                                {saving ? "建立中..." : "新增工作包"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {tab === "edit" && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4">編輯專案資訊</h2>
                    <div>專案名稱：{project.projectName}</div>
                    {/* 這裡可放編輯專案資訊表單 */}
                </div>
            )}

            {tab === "journal" && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">工作日誌</h2>
                    </div>

                    {/* 添加新工作日誌表單 */}
                    <form onSubmit={handleSubmitReport} className="mb-6 border-b pb-6">
                        <h3 className="text-lg font-semibold mb-4">新增工作日誌</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">天氣</label>
                                <select
                                    className="border px-3 py-2 rounded w-full"
                                    value={newReport.weather}
                                    onChange={e => setNewReport(prev => ({ ...prev, weather: e.target.value }))}
                                    disabled={saving}
                                >
                                    <option value="晴">晴</option>
                                    <option value="多雲">多雲</option>
                                    <option value="陰">陰</option>
                                    <option value="雨">雨</option>
                                    <option value="雷雨">雷雨</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">溫度 (°C)</label>
                                <input
                                    type="number"
                                    className="border px-3 py-2 rounded w-full"
                                    value={newReport.temperature}
                                    onChange={e => setNewReport(prev => ({ ...prev, temperature: Number(e.target.value) }))}
                                    disabled={saving}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">降雨量 (mm)</label>
                                <input
                                    type="number"
                                    className="border px-3 py-2 rounded w-full"
                                    value={newReport.rainfall}
                                    onChange={e => setNewReport(prev => ({ ...prev, rainfall: Number(e.target.value) }))}
                                    disabled={saving}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">工作人數</label>
                                <input
                                    type="number"
                                    className="border px-3 py-2 rounded w-full"
                                    value={newReport.workforceCount}
                                    onChange={e => setNewReport(prev => ({ ...prev, workforceCount: Number(e.target.value) }))}
                                    disabled={saving}
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium mb-1">工作描述</label>
                            <textarea
                                className="border px-3 py-2 rounded w-full"
                                rows={4}
                                value={newReport.description}
                                onChange={e => setNewReport(prev => ({ ...prev, description: e.target.value }))}
                                disabled={saving}
                                placeholder="請描述今日主要工作內容..."
                            />
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium mb-1">特殊情況/問題</label>
                            <textarea
                                className="border px-3 py-2 rounded w-full"
                                rows={3}
                                value={newReport.issues}
                                onChange={e => setNewReport(prev => ({ ...prev, issues: e.target.value }))}
                                disabled={saving}
                                placeholder="請記錄任何特殊情況或問題..."
                            />
                        </div>

                        <div className="mt-4">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                                disabled={saving}
                            >
                                {saving ? "提交中..." : "提交日誌"}
                            </button>
                        </div>
                    </form>

                    {/* 顯示既有工作日誌列表 */}
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">歷史日誌</h3>
                        {reports.length > 0 ? (
                            <div className="space-y-4">
                                {reports.map((report, index) => (
                                    <div key={report.id} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-medium">
                                                {new Date(report.date).toLocaleDateString()} ({report.weather}, {report.temperature}°C)
                                            </h4>
                                            <span className="text-sm text-gray-500">
                                                工作人數: {report.workforceCount}人
                                            </span>
                                        </div>
                                        {report.activities && report.activities.length > 0 && (
                                            <div className="mb-2">
                                                <h5 className="text-sm font-medium mb-1">工作活動:</h5>
                                                <ul className="list-disc pl-5">
                                                    {report.activities.map((activity: ActivityLog) => (
                                                        <li key={activity.id} className="text-sm">
                                                            {activity.description} - 進度: {activity.progress}%
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">尚未有工作日誌記錄</p>
                        )}
                    </div>
                </div>
            )}

            {tab === "photos" && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">照片記錄</h2>
                    </div>

                    {/* 上傳照片表單 */}
                    <form onSubmit={handlePhotoUpload} className="mb-6 border-b pb-6">
                        <h3 className="text-lg font-semibold mb-4">上傳新照片</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">選擇照片</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="border px-3 py-2 rounded w-full"
                                    onChange={handleFileChange}
                                    disabled={isUploading}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">照片類型</label>
                                <select
                                    className="border px-3 py-2 rounded w-full"
                                    value={newPhoto.type}
                                    onChange={e => setNewPhoto(prev => ({ ...prev, type: e.target.value as any }))}
                                    disabled={isUploading}
                                >
                                    <option value="progress">進度記錄</option>
                                    <option value="issue">問題記錄</option>
                                    <option value="material">材料紀錄</option>
                                    <option value="safety">安全記錄</option>
                                    <option value="other">其他</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium mb-1">描述</label>
                            <textarea
                                className="border px-3 py-2 rounded w-full"
                                rows={3}
                                value={newPhoto.description}
                                onChange={e => setNewPhoto(prev => ({ ...prev, description: e.target.value }))}
                                disabled={isUploading}
                                placeholder="請描述照片內容..."
                            />
                        </div>

                        {isUploading && (
                            <div className="mt-4">
                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                                </div>
                                <p className="text-sm text-center mt-1">{uploadProgress}%</p>
                            </div>
                        )}

                        <div className="mt-4">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                                disabled={isUploading || !newPhoto.file}
                            >
                                {isUploading ? "上傳中..." : "上傳照片"}
                            </button>
                        </div>
                    </form>

                    {/* 照片顯示區域 */}
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">照片庫</h3>
                        {photos.length > 0 ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {photos.map(photo => (
                                    <div key={photo.id} className="border rounded-lg overflow-hidden">
                                        <img
                                            src={photo.url}
                                            alt={photo.description}
                                            className="w-full h-40 object-cover"
                                            loading="lazy"
                                        />
                                        <div className="p-2">
                                            <div className="text-sm font-medium mb-1 truncate">{photo.description}</div>
                                            <div className="flex justify-between text-xs text-gray-500">
                                                <span>{photo.type}</span>
                                                <span>{new Date(photo.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">尚未有照片記錄</p>
                        )}
                    </div>
                </div>
            )}

            {tab === "materials" && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">材料管理</h2>
                    </div>

                    {/* 添加新材料表單 */}
                    <form onSubmit={handleAddMaterial} className="mb-6 border-b pb-6">
                        <h3 className="text-lg font-semibold mb-4">添加新材料</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">材料名稱</label>
                                <input
                                    type="text"
                                    className="border px-3 py-2 rounded w-full"
                                    value={newMaterial.name}
                                    onChange={e => setNewMaterial(prev => ({ ...prev, name: e.target.value }))}
                                    disabled={saving}
                                    placeholder="例如: 水泥、鋼筋..."
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">供應商</label>
                                <input
                                    type="text"
                                    className="border px-3 py-2 rounded w-full"
                                    value={newMaterial.supplier}
                                    onChange={e => setNewMaterial(prev => ({ ...prev, supplier: e.target.value }))}
                                    disabled={saving}
                                    placeholder="供應商名稱"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">數量</label>
                                <input
                                    type="number"
                                    className="border px-3 py-2 rounded w-full"
                                    value={newMaterial.quantity}
                                    onChange={e => setNewMaterial(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                                    disabled={saving}
                                    min="0"
                                    step="0.01"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">單位</label>
                                <select
                                    className="border px-3 py-2 rounded w-full"
                                    value={newMaterial.unit}
                                    onChange={e => setNewMaterial(prev => ({ ...prev, unit: e.target.value }))}
                                    disabled={saving}
                                >
                                    <option value="件">件</option>
                                    <option value="公斤">公斤</option>
                                    <option value="噸">噸</option>
                                    <option value="立方公尺">立方公尺</option>
                                    <option value="公尺">公尺</option>
                                    <option value="平方公尺">平方公尺</option>
                                </select>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium mb-1">備註</label>
                            <textarea
                                className="border px-3 py-2 rounded w-full"
                                rows={3}
                                value={newMaterial.notes}
                                onChange={e => setNewMaterial(prev => ({ ...prev, notes: e.target.value }))}
                                disabled={saving}
                                placeholder="其他相關資訊..."
                            />
                        </div>

                        <div className="mt-4">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                                disabled={saving || !newMaterial.name || newMaterial.quantity <= 0}
                            >
                                {saving ? "添加中..." : "添加材料"}
                            </button>
                        </div>
                    </form>

                    {/* 材料列表 */}
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">材料清單</h3>
                        {materials.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs uppercase bg-gray-100 dark:bg-gray-700">
                                        <tr>
                                            <th className="px-4 py-2">材料名稱</th>
                                            <th className="px-4 py-2">數量</th>
                                            <th className="px-4 py-2">供應商</th>
                                            <th className="px-4 py-2">備註</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {materials.map((material, index) => (
                                            <tr key={material.materialId || index} className="border-b">
                                                <td className="px-4 py-3 font-medium">{material.name}</td>
                                                <td className="px-4 py-3">{material.quantity} {material.unit}</td>
                                                <td className="px-4 py-3">{material.supplier || '-'}</td>
                                                <td className="px-4 py-3">{material.notes || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">尚未有材料記錄</p>
                        )}
                    </div>
                </div>
            )}

            {tab === "issues" && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">問題追蹤</h2>
                    </div>

                    {/* 問題篩選 */}
                    <div className="mb-6 flex flex-wrap gap-3">
                        <div>
                            <label className="block text-sm font-medium mb-1">問題類型</label>
                            <select
                                className="border px-3 py-2 rounded"
                                value={filter.type}
                                onChange={e => setFilter(prev => ({ ...prev, type: e.target.value }))}
                            >
                                <option value="">全部類型</option>
                                <option value="quality">品質問題</option>
                                <option value="safety">安全問題</option>
                                <option value="progress">進度問題</option>
                                <option value="other">其他問題</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">狀態</label>
                            <select
                                className="border px-3 py-2 rounded"
                                value={filter.status}
                                onChange={e => setFilter(prev => ({ ...prev, status: e.target.value }))}
                            >
                                <option value="">全部狀態</option>
                                <option value="open">待解決</option>
                                <option value="in-progress">處理中</option>
                                <option value="resolved">已解決</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">嚴重程度</label>
                            <select
                                className="border px-3 py-2 rounded"
                                value={filter.severity}
                                onChange={e => setFilter(prev => ({ ...prev, severity: e.target.value }))}
                            >
                                <option value="">全部等級</option>
                                <option value="low">低</option>
                                <option value="medium">中</option>
                                <option value="high">高</option>
                            </select>
                        </div>
                    </div>

                    {/* 添加新問題表單 */}
                    <form onSubmit={handleAddIssue} className="mb-6 border-b pb-6">
                        <h3 className="text-lg font-semibold mb-4">報告新問題</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">問題類型</label>
                                <select
                                    className="border px-3 py-2 rounded w-full"
                                    value={newIssue.type}
                                    onChange={e => setNewIssue(prev => ({ ...prev, type: e.target.value as any }))}
                                    disabled={saving}
                                    required
                                >
                                    <option value="quality">品質問題</option>
                                    <option value="safety">安全問題</option>
                                    <option value="progress">進度問題</option>
                                    <option value="other">其他問題</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">嚴重程度</label>
                                <select
                                    className="border px-3 py-2 rounded w-full"
                                    value={newIssue.severity}
                                    onChange={e => setNewIssue(prev => ({ ...prev, severity: e.target.value as any }))}
                                    disabled={saving}
                                >
                                    <option value="low">低</option>
                                    <option value="medium">中</option>
                                    <option value="high">高</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">指派給</label>
                                <input
                                    type="text"
                                    className="border px-3 py-2 rounded w-full"
                                    value={newIssue.assignedTo}
                                    onChange={e => setNewIssue(prev => ({ ...prev, assignedTo: e.target.value }))}
                                    disabled={saving}
                                    placeholder="負責人姓名"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">預計解決日期</label>
                                <input
                                    type="date"
                                    className="border px-3 py-2 rounded w-full"
                                    value={newIssue.dueDate}
                                    onChange={e => setNewIssue(prev => ({ ...prev, dueDate: e.target.value }))}
                                    disabled={saving}
                                />
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium mb-1">問題描述</label>
                            <textarea
                                className="border px-3 py-2 rounded w-full"
                                rows={4}
                                value={newIssue.description}
                                onChange={e => setNewIssue(prev => ({ ...prev, description: e.target.value }))}
                                disabled={saving}
                                placeholder="詳細描述問題情況..."
                                required
                            />
                        </div>

                        <div className="mt-4">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300"
                                disabled={saving || !newIssue.description.trim()}
                            >
                                {saving ? "提交中..." : "提交問題"}
                            </button>
                        </div>
                    </form>

                    {/* 問題列表 */}
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-4">問題列表</h3>
                        {filteredIssues.length > 0 ? (
                            <div className="space-y-4">
                                {filteredIssues.map(issue => (
                                    <div
                                        key={issue.id}
                                        className={`border rounded-lg p-4 ${issue.severity === 'high' ? 'border-red-300 bg-red-50' :
                                                issue.severity === 'medium' ? 'border-yellow-300 bg-yellow-50' :
                                                    'border-green-300 bg-green-50'
                                            }`}
                                    >
                                        <div className="flex justify-between items-center mb-2">
                                            <h4 className="font-medium flex items-center gap-2">
                                                {issue.type === 'quality' && '🧪 品質問題'}
                                                {issue.type === 'safety' && '⚠️ 安全問題'}
                                                {issue.type === 'progress' && '⏱️ 進度問題'}
                                                {issue.type === 'other' && '📝 其他問題'}
                                            </h4>
                                            <div>
                                                <span className={`inline-block px-2 py-1 text-xs rounded ${issue.status === 'resolved' ? 'bg-green-500 text-white' :
                                                        issue.status === 'in-progress' ? 'bg-blue-500 text-white' :
                                                            'bg-gray-500 text-white'
                                                    }`}>
                                                    {issue.status === 'open' && '待解決'}
                                                    {issue.status === 'in-progress' && '處理中'}
                                                    {issue.status === 'resolved' && '已解決'}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="mb-2">{issue.description}</p>
                                        <div className="text-sm text-gray-600 flex flex-wrap gap-x-6 gap-y-1">
                                            {issue.assignedTo && <span>指派給: {issue.assignedTo}</span>}
                                            {issue.dueDate && <span>期限: {new Date(issue.dueDate).toLocaleDateString()}</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 italic">沒有符合篩選條件的問題</p>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
}