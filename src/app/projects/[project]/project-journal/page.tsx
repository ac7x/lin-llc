/**
 * 專案日誌頁面
 * 
 * 提供專案進度記錄和日誌功能，包含：
 * - 日誌記錄
 * - 照片上傳
 * - 天氣資訊整合
 * - 進度追蹤
 * - 歷史記錄
 */

"use client";

import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import { useAuth } from '@/hooks/useAuth';
import { 
    useDocument 
} from "react-firebase-hooks/firestore";
import { 
    db, 
    storage, 
    ref, 
    uploadBytesResumable, 
    getDownloadURL, 
    updateDoc, 
    arrayUnion, 
    doc 
} from '@/lib/firebase-client';
import Image from 'next/image';
import { Project, ActivityLog, PhotoRecord, PhotoType, IssueRecord } from '@/types/project';
import { calculateProjectProgress } from '@/utils/progressUtils';
import { toTimestamp } from '@/utils/dateUtils';
import WeatherDisplay, { fetchWeather } from '@/app/projects/[project]/project-journal/components/WeatherDisplay';

export default function ProjectJournalPage() {
    // 僅呼叫 useAuth()，不解構 user, authLoading
    useAuth();
    const params = useParams();
    const projectId = params?.project as string;
    const [projectDoc, loading, error] = useDocument(doc(db, "projects", projectId));
    const [newReport, setNewReport] = useState<{ workforceCount: number; description: string; issues: string; }>({ workforceCount: 0, description: "", issues: "" });
    const [photoFiles, setPhotoFiles] = useState<File[]>([]);
    const [photoDescriptions, setPhotoDescriptions] = useState<string[]>([]);
    const [photoTypes, setPhotoTypes] = useState<PhotoType[]>([]);
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [saving, setSaving] = useState(false);
    const [progressInputs, setProgressInputs] = useState([{ workpackageId: '', subWorkpackageId: '', actualQuantity: 0 }]);

    const reports = useMemo(() => {
        if (!projectDoc?.exists()) return [];
        const project = projectDoc.data() as Project;
        return project.reports || [];
    }, [projectDoc]);

    const workpackages = useMemo(() => {
        if (!projectDoc?.exists()) return [];
        const project = projectDoc.data() as Project;
        return project.workpackages || [];
    }, [projectDoc]);

    const projectRegion = useMemo(() => {
        if (!projectDoc?.exists()) return "";
        const project = projectDoc.data();
        return project.region || "";
    }, [projectDoc]);

    const handleAddPhotoField = () => {
        setPhotoFiles([...photoFiles, null as unknown as File]);
        setPhotoDescriptions([...photoDescriptions, ""]);
        setPhotoTypes([...photoTypes, "progress"]);
    };

    const handlePhotoChange = (index: number, file: File) => {
        const newFiles = [...photoFiles];
        newFiles[index] = file;
        setPhotoFiles(newFiles);
    };

    const handleDescriptionChange = (index: number, description: string) => {
        const newDescriptions = [...photoDescriptions];
        newDescriptions[index] = description;
        setPhotoDescriptions(newDescriptions);
    };

    const handleTypeChange = (index: number, type: PhotoType) => {
        const newTypes = [...photoTypes];
        newTypes[index] = type;
        setPhotoTypes(newTypes);
    };

    const handleRemovePhotoField = (index: number) => {
        setPhotoFiles(photoFiles.filter((_, i) => i !== index));
        setPhotoDescriptions(photoDescriptions.filter((_, i) => i !== index));
        setPhotoTypes(photoTypes.filter((_, i) => i !== index));
    };

    const uploadPhotos = async (reportId: string) => {
        const photoRecords: PhotoRecord[] = [];
        const now = new Date();
        const nowTimestamp = toTimestamp(now);
        
        for (let i = 0; i < photoFiles.length; i++) {
            if (!photoFiles[i]) continue;
            const file = photoFiles[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `projects/${projectId}/photos/${Date.now()}_${i}.${fileExt}`;
            const storageRef = ref(storage, fileName);
            const uploadTask = uploadBytesResumable(storageRef, file);
            await new Promise<string>((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot: import('firebase/storage').UploadTaskSnapshot) => setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
                    (error: import('firebase/app').FirebaseError) => reject(error),
                    async () => {
                        try {
                            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                            resolve(downloadURL);
                        } catch (error) {
                            reject(error);
                        }
                    }
                );
            }).then(downloadURL => {
                photoRecords.push({
                    id: `${Date.now()}_${i}`,
                    url: downloadURL as string,
                    type: photoTypes[i],
                    description: photoDescriptions[i],
                    reportId,
                    createdAt: nowTimestamp,
                    updatedAt: nowTimestamp,
                    createdBy: "current-user",
                });
            }).catch(error => { throw error; });
        }
        return photoRecords;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        
        // 獲取天氣資料
        let weather = "";
        let temperature = 0;
        if (projectRegion) {
            const weatherResult = await fetchWeather(projectRegion);
            weather = weatherResult.weather;
            temperature = weatherResult.temperature;
        }
        
        try {
            const now = new Date();
            const nowTimestamp = toTimestamp(now);
            const reportId = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
            let photoRecords: PhotoRecord[] = [];
            if (photoFiles.some(file => file !== null)) {
                photoRecords = await uploadPhotos(reportId);
            }
            const activities: ActivityLog[] = [];

            // 計算並更新工作包進度
            for (const input of progressInputs) {
                if (input.workpackageId && input.subWorkpackageId) {
                    const wp = workpackages.find(w => w.id === input.workpackageId);
                    if (wp) {
                        const sw = wp.subWorkpackages.find(s => s.id === input.subWorkpackageId);
                        if (sw) {
                            const percent = Math.round((input.actualQuantity / (sw.estimatedQuantity || 1)) * 100);
                            sw.progress = percent;
                            sw.actualQuantity = input.actualQuantity;

                            activities.push({
                                id: `${input.workpackageId}_${input.subWorkpackageId}_${now.getTime()}`,
                                workpackageId: input.workpackageId,
                                description: `${wp?.name || ''} / ${sw?.name || ''}`,
                                startTime: nowTimestamp,
                                endTime: nowTimestamp,
                                workforce: newReport.workforceCount || 0,
                                progress: percent,
                                notes: '',
                                createdAt: nowTimestamp,
                                updatedAt: nowTimestamp,
                            });
                        }
                    }
                }
            }

            // 計算專案總進度
            const projectProgress = projectDoc?.data() ? calculateProjectProgress({ ...projectDoc.data(), workpackages } as Project) : 0;

            await updateDoc(doc(db, "projects", projectId), { workpackages });
            await updateDoc(doc(db, "projects", projectId), {
                reports: arrayUnion({
                    ...newReport,
                    id: reportId,
                    weather,
                    temperature,
                    activities,
                    date: nowTimestamp,
                    projectProgress,
                    photos: photoRecords, // 直接將照片陣列寫入 report
                }),
            });
            setNewReport({ workforceCount: 0, description: "", issues: "" });
            setPhotoFiles([]);
            setPhotoDescriptions([]);
            setPhotoTypes([]);
            setProgressInputs([{ workpackageId: '', subWorkpackageId: '', actualQuantity: 0 }]);
            alert("工作日誌已成功提交！");
        } catch (error) {
            alert("保存工作日誌時出錯：" + error);
        } finally {
            setSaving(false);
            setUploading(false);
            setUploadProgress(0);
        }
    };

    if (loading) return <div className="p-4">載入中...</div>;
    if (error) return <div className="p-4 text-red-500">錯誤: {error.message}</div>;
    if (!projectDoc?.exists()) return <div className="p-4">找不到專案</div>;

    return (
        <main className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">專案工作日誌</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">記錄每日工作進度和相關資訊</p>
                    </div>
                </div>

                <div className="mb-6">
                    <WeatherDisplay region={projectRegion} />
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">新增工作日誌</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">出工人數</label>
                                <input
                                    type="number"
                                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                    value={newReport.workforceCount}
                                    onChange={(e) =>
                                        setNewReport({ ...newReport, workforceCount: parseInt(e.target.value) || 0 })
                                    }
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">工作描述</label>
                            <textarea
                                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 h-24"
                                value={newReport.description}
                                onChange={(e) => setNewReport({ ...newReport, description: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">問題與障礙</label>
                            <textarea
                                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 h-24"
                                value={newReport.issues}
                                onChange={(e) => setNewReport({ ...newReport, issues: e.target.value })}
                            />
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">照片記錄</h3>
                                <button
                                    type="button"
                                    onClick={handleAddPhotoField}
                                    className="inline-flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                                >
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    新增照片
                                </button>
                            </div>
                            {photoFiles.map((file, index) => (
                                <div key={index} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-medium text-gray-900 dark:text-gray-100">照片 #{index + 1}</h4>
                                        <button
                                            type="button"
                                            onClick={() => handleRemovePhotoField(index)}
                                            className="text-red-500 hover:text-red-700 transition-colors duration-200"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">選擇照片</label>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => e.target.files && handlePhotoChange(index, e.target.files[0])}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                                disabled={saving}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">照片類型</label>
                                            <select
                                                value={photoTypes[index] || "progress"}
                                                onChange={(e) => handleTypeChange(index, e.target.value as PhotoType)}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                                disabled={saving}
                                            >
                                                <option value="progress">進度記錄</option>
                                                <option value="issue">問題記錄</option>
                                                <option value="material">材料記錄</option>
                                                <option value="safety">安全記錄</option>
                                                <option value="other">其他</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">照片描述</label>
                                        <textarea
                                            value={photoDescriptions[index] || ""}
                                            onChange={(e) => handleDescriptionChange(index, e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                            rows={2}
                                            placeholder="請描述照片內容..."
                                            disabled={saving}
                                        />
                                    </div>
                                </div>
                            ))}
                            {uploading && (
                                <div className="mt-2">
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
                                        <div
                                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                            style={{ width: `${uploadProgress}%` }}
                                        ></div>
                                    </div>
                                    <p className="text-sm text-center text-gray-600 dark:text-gray-400">{uploadProgress}% 已上傳</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-2">
                            <h3 className="font-bold mb-4 text-gray-900 dark:text-gray-100">進度填報</h3>
                            {progressInputs.map((input, idx) => {
                                const selectedWp = workpackages.find(wp => wp.id === input.workpackageId);
                                const subWorkpackages = selectedWp?.subWorkpackages || [];
                                const selectedSubWp = subWorkpackages.find(sw => sw.id === input.subWorkpackageId);
                                return (
                                    <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">選擇工作包</label>
                                            <select
                                                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                                value={input.workpackageId}
                                                onChange={e => {
                                                    const v = e.target.value;
                                                    setProgressInputs(arr => arr.map((item, i) => i === idx ? { workpackageId: v, subWorkpackageId: '', actualQuantity: 0 } : item));
                                                }}
                                            >
                                                <option value="">請選擇</option>
                                                {workpackages.map(wp => (
                                                    <option key={wp.id} value={wp.id}>{wp.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">選擇子工作包</label>
                                            <select
                                                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                                value={input.subWorkpackageId}
                                                onChange={e => {
                                                    const v = e.target.value;
                                                    setProgressInputs(arr => arr.map((item, i) => i === idx ? { ...item, subWorkpackageId: v, actualQuantity: 0 } : item));
                                                }}
                                                disabled={!input.workpackageId}
                                            >
                                                <option value="">請選擇</option>
                                                {subWorkpackages.map(sw => (
                                                    <option key={sw.id} value={sw.id}>{sw.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">本日實際數量</label>
                                            <input
                                                type="number"
                                                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                                value={input.actualQuantity}
                                                min={0}
                                                max={selectedSubWp?.estimatedQuantity}
                                                onChange={e => {
                                                    const v = Number(e.target.value);
                                                    setProgressInputs(arr => arr.map((item, i) => i === idx ? { ...item, actualQuantity: v } : item));
                                                }}
                                                disabled={!input.subWorkpackageId}
                                            />
                                            {input.subWorkpackageId && selectedSubWp && (
                                                <div className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                                                    應完成總數：{selectedSubWp.estimatedQuantity ?? '-'}，
                                                    本日進度：
                                                    {selectedSubWp.estimatedQuantity
                                                        ? Math.round((input.actualQuantity / selectedSubWp.estimatedQuantity) * 100)
                                                        : 0
                                                    }%
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-span-3 flex gap-2 mt-2">
                                            {progressInputs.length > 1 && (
                                                <button 
                                                    type="button" 
                                                    className="text-red-500 hover:text-red-700 text-sm transition-colors duration-200"
                                                    onClick={() => setProgressInputs(arr => arr.filter((_, i) => i !== idx))}
                                                >
                                                    移除
                                                </button>
                                            )}
                                            {idx === progressInputs.length - 1 && (
                                                <button 
                                                    type="button" 
                                                    className="text-blue-500 hover:text-blue-700 text-sm transition-colors duration-200"
                                                    onClick={() => setProgressInputs(arr => [...arr, { workpackageId: '', subWorkpackageId: '', actualQuantity: 0 }])}
                                                >
                                                    新增一筆
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <button
                            type="submit"
                            className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={saving}
                        >
                            {saving ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    保存中...
                                </span>
                            ) : '提交工作日誌'}
                        </button>
                    </form>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <h2 className="text-xl font-bold p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">工作日誌列表</h2>
                    {reports && reports.length > 0 ? (
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {reports
                                .sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime())
                                .map((report, idx) => (
                                    <div key={report.id + '-' + idx} className="p-6">
                                        <div className="flex justify-between mb-2">
                                            <h3 className="font-bold text-gray-900 dark:text-gray-100">
                                                {report.date.toDate().toLocaleDateString()}
                                            </h3>
                                            <div className="flex items-center gap-4">
                                                {typeof report.projectProgress === 'number' && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">專案進度:</span>
                                                        <span className="text-sm text-blue-600 dark:text-blue-400">{report.projectProgress}%</span>
                                                    </div>
                                                )}
                                                {report.weather && (
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {report.weather} {report.temperature}°C
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="mb-2">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">出工人數:</span> {report.workforceCount}
                                        </div>
                                        <div className="mb-2">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">工作內容:</span>
                                            <p className="text-gray-700 dark:text-gray-300 mt-1">
                                                {report.description}
                                            </p>
                                        </div>
                                        {report.issues && Array.isArray(report.issues)
                                            ? report.issues.map((i: IssueRecord) => i.description).join("; ")
                                            : typeof report.issues === "string"
                                                ? report.issues
                                                : ""}
                                        {report.photos && report.photos.length > 0 && (
                                            <div className="mt-4">
                                                <h4 className="font-medium mb-2 text-gray-900 dark:text-gray-100">照片記錄</h4>
                                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                    {report.photos.map((photo) => (
                                                        <div key={photo.id} className="border rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                                                            <Image
                                                                src={photo.url}
                                                                alt={photo.description}
                                                                width={300}
                                                                height={200}
                                                                className="w-full h-24 object-cover"
                                                            />
                                                            <div className="p-2 text-xs">
                                                                <p className="truncate text-gray-900 dark:text-gray-100">{photo.description}</p>
                                                                <p className="text-gray-500 dark:text-gray-400 capitalize">{photo.type}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {report.activities && report.activities.length > 0 && (
                                            <div className="mb-2">
                                                <span className="font-medium text-gray-700 dark:text-gray-300">進度填報紀錄:</span>
                                                <ul className="text-gray-700 dark:text-gray-300 text-sm list-disc ml-6 mt-1">
                                                    {report.activities.map((a: ActivityLog, i: number) => (
                                                        <li key={a.id || i}>
                                                            {a.description}：{a.progress}%
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-gray-500 dark:text-gray-400">
                            <div className="w-12 h-12 mx-auto mb-4 text-gray-400 dark:text-gray-500 text-4xl">
                                📄
                            </div>
                            暫無工作日誌
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}