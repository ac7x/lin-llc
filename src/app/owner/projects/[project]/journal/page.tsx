"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { doc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { useDocument } from "react-firebase-hooks/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { Project } from "@/types/project";
import { DailyReport } from "@/types/workpackage";

export default function ProjectJournalPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params?.project as string;
    const [projectDoc, loading, error] = useDocument(
        doc(db, "projects", projectId)
    );

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

    const [saving, setSaving] = useState(false);

    // 從 Firestore 獲取日誌數據
    const reports = useMemo(() => {
        if (!projectDoc?.exists()) return [];
        const project = projectDoc.data() as Project;
        return project.reports || [];
    }, [projectDoc]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving) return;

        setSaving(true);
        try {
            const now = new Date();
            const reportId = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
                now.getDate()
            ).padStart(2, "0")}`;

            const dailyReport: DailyReport = {
                id: reportId,
                date: now.toISOString(),
                weather: newReport.weather,
                temperature: newReport.temperature,
                rainfall: newReport.rainfall,
                workforceCount: newReport.workforceCount,
                activities: [
                    {
                        id: Date.now().toString(),
                        workpackageId: "general",
                        description: newReport.description,
                        startTime: new Date().toISOString(),
                        endTime: new Date().toISOString(),
                        workforce: newReport.workforceCount,
                        progress: 0,
                        notes: "",
                    },
                ],
                materials: [],
                issues: newReport.issues
                    ? [
                        {
                            id: Date.now().toString(),
                            type: "progress",
                            description: newReport.issues,
                            severity: "medium",
                            status: "open",
                            assignedTo: "",
                            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        },
                    ]
                    : [],
                photos: [],
                createdBy: "current-user", // 理想情況下應該從用戶認證中獲取
                createdAt: new Date().toISOString(),
            };

            await updateDoc(doc(db, "projects", projectId), {
                reports: arrayUnion(dailyReport),
            });

            setNewReport({
                weather: "晴",
                temperature: 25,
                rainfall: 0,
                workforceCount: 0,
                description: "",
                issues: "",
            });

            alert("工作日誌已成功提交！");
        } catch (error) {
            console.error("無法保存工作日誌：", error);
            alert("保存工作日誌時出錯：" + error);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-4">載入中...</div>;
    if (error) return <div className="p-4 text-red-500">錯誤: {error.message}</div>;
    if (!projectDoc?.exists()) return <div className="p-4">找不到專案</div>;

    const project = projectDoc.data() as Project;

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">專案工作日誌</h1>
                <button
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                    onClick={() => router.push(`/owner/projects/${projectId}`)}
                >
                    返回專案
                </button>
            </div>

            {/* 新增日誌表單 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">新增工作日誌</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">天氣</label>
                            <select
                                className="border rounded w-full px-3 py-2"
                                value={newReport.weather}
                                onChange={(e) => setNewReport({ ...newReport, weather: e.target.value })}
                            >
                                <option value="晴">晴</option>
                                <option value="多雲">多雲</option>
                                <option value="陰">陰</option>
                                <option value="雨">雨</option>
                                <option value="大雨">大雨</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">溫度 (°C)</label>
                            <input
                                type="number"
                                className="border rounded w-full px-3 py-2"
                                value={newReport.temperature}
                                onChange={(e) =>
                                    setNewReport({ ...newReport, temperature: parseInt(e.target.value) || 0 })
                                }
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">降雨量 (mm)</label>
                            <input
                                type="number"
                                className="border rounded w-full px-3 py-2"
                                value={newReport.rainfall}
                                onChange={(e) =>
                                    setNewReport({ ...newReport, rainfall: parseInt(e.target.value) || 0 })
                                }
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">出工人數</label>
                        <input
                            type="number"
                            className="border rounded w-full px-3 py-2"
                            value={newReport.workforceCount}
                            onChange={(e) =>
                                setNewReport({ ...newReport, workforceCount: parseInt(e.target.value) || 0 })
                            }
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">工作描述</label>
                        <textarea
                            className="border rounded w-full px-3 py-2 h-24"
                            value={newReport.description}
                            onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">問題與障礙</label>
                        <textarea
                            className="border rounded w-full px-3 py-2 h-24"
                            value={newReport.issues}
                            onChange={(e) => setNewReport({ ...newReport, issues: e.target.value })}
                            placeholder="遇到的問題與障礙，如有"
                        />
                    </div>

                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                        disabled={saving}
                    >
                        {saving ? "保存中..." : "提交工作日誌"}
                    </button>
                </form>
            </div>

            {/* 過去的日誌列表 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <h2 className="text-xl font-bold p-6 border-b">工作日誌列表</h2>
                {reports && reports.length > 0 ? (
                    <div className="divide-y">
                        {reports
                            .sort(
                                (a, b) =>
                                    new Date(b.date).getTime() - new Date(a.date).getTime()
                            )
                            .map((report) => (
                                <div key={report.id} className="p-6">
                                    <div className="flex justify-between mb-2">
                                        <h3 className="font-bold">
                                            {new Date(report.date).toLocaleDateString()}
                                        </h3>
                                        <span className="text-sm text-gray-500">
                                            {report.weather} {report.temperature}°C
                                        </span>
                                    </div>
                                    <div className="mb-2">
                                        <span className="font-medium">出工人數:</span> {report.workforceCount}
                                    </div>
                                    <div className="mb-2">
                                        <span className="font-medium">工作內容:</span>
                                        <p className="text-gray-700 dark:text-gray-300">
                                            {report.activities?.map(a => a.description).join("; ")}
                                        </p>
                                    </div>
                                    {report.issues && report.issues.length > 0 && (
                                        <div>
                                            <span className="font-medium">問題:</span>
                                            <p className="text-gray-700 dark:text-gray-300">
                                                {report.issues.map(i => i.description).join("; ")}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ))}
                    </div>
                ) : (
                    <div className="p-6 text-gray-500 text-center">暫無工作日誌</div>
                )}
            </div>
        </div>
    );
}
