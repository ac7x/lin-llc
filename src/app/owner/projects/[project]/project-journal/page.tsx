"use client";

import { useParams } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { useFirebase } from "@/hooks/useFirebase";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Timestamp } from "firebase/firestore";
import { useDocument } from "react-firebase-hooks/firestore";
import { Project } from "@/types/project";
import { ActivityLog, PhotoRecord, PhotoType, IssueRecord } from "@/types/project";
import Image from 'next/image';
import { TaiwanCityList } from '@/utils/taiwan-city.enum';

const OWM_API_KEY = process.env.NEXT_PUBLIC_OPENWEATHERMAP_API_KEY;

async function fetchWeather(region: string) {
    const cityInfo = TaiwanCityList.find(c => c.label === region || c.value === region);
    if (!cityInfo) return { weather: "未知", temperature: 0 };
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityInfo.owmQuery)}&appid=${OWM_API_KEY}&units=metric&lang=zh_tw`;
    try {
        const res = await fetch(url);
        if (!res.ok) return { weather: "未知", temperature: 0 };
        const data = await res.json();
        return {
            weather: data.weather?.[0]?.description || "未知",
            temperature: Math.round(data.main?.temp ?? 0)
        };
    } catch {
        return { weather: "未知", temperature: 0 };
    }
}

export default function ProjectJournalPage() {
    const { db, doc, updateDoc, arrayUnion } = useFirebase();
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
    const [weatherDisplay, setWeatherDisplay] = useState<{ weather: string; temperature: number } | null>(null);

    const reports = useMemo(() => {
        if (!projectDoc?.exists()) return [];
        const project = projectDoc.data() as Project;
        return project.reports || [];
    }, [projectDoc]);

    const photos = useMemo(() => {
        if (!projectDoc?.exists()) return [];
        const project = projectDoc.data() as Project;
        return project.photos || [];
    }, [projectDoc]);

    const workpackages = useMemo(() => {
        if (!projectDoc?.exists()) return [];
        const project = projectDoc.data() as Project;
        return project.workpackages || [];
    }, [projectDoc]);

    useEffect(() => {
        if (projectDoc?.exists()) {
            const project = projectDoc.data();
            const region = project.region;
            if (region) {
                fetchWeather(region).then(result => setWeatherDisplay(result));
            }
        }
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
        const storage = getStorage();
        const photoRecords: PhotoRecord[] = [];
        for (let i = 0; i < photoFiles.length; i++) {
            if (!photoFiles[i]) continue;
            const file = photoFiles[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `projects/${projectId}/photos/${Date.now()}_${i}.${fileExt}`;
            const storageRef = ref(storage, fileName);
            const uploadTask = uploadBytesResumable(storageRef, file);
            await new Promise<string>((resolve, reject) => {
                uploadTask.on('state_changed',
                    (snapshot) => setUploadProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)),
                    (error) => reject(error),
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
                    createdAt: Timestamp.now(), // 修正: 應為 Timestamp
                    createdBy: "current-user",
                });
            }).catch(error => { throw error; });
        }
        return photoRecords;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        let weather = "";
        let temperature = 0;
        if (projectDoc?.exists()) {
            const project = projectDoc.data();
            const region = project.region;
            if (region) {
                const result = await fetchWeather(region);
                weather = result.weather;
                temperature = result.temperature;
            }
        }
        try {
            const now = new Date();
            const nowTimestamp = Timestamp.fromDate(now);
            const reportId = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
            let photoRecords: PhotoRecord[] = [];
            if (photoFiles.some(file => file !== null)) {
                photoRecords = await uploadPhotos(reportId);
            }
            let updatedWorkpackages = workpackages;
            const activities: ActivityLog[] = [];
            for (const input of progressInputs) {
                if (input.workpackageId && input.subWorkpackageId && input.actualQuantity > 0) {
                    updatedWorkpackages = updatedWorkpackages.map(wp => {
                        if (wp.id !== input.workpackageId) return wp;
                        return {
                            ...wp,
                            subWorkpackages: wp.subWorkpackages.map(sw => {
                                if (sw.id !== input.subWorkpackageId) return sw;
                                const total = sw.estimatedQuantity || 0;
                                const percent = total > 0 ? Math.round((input.actualQuantity / total) * 100) : 0;
                                const history = Array.isArray(sw.progressHistory) ? sw.progressHistory : [];
                                return {
                                    ...sw,
                                    actualQuantity: input.actualQuantity,
                                    progress: percent,
                                    progressHistory: [
                                        ...history,
                                        {
                                            date: nowTimestamp, // 修正: 應為 Timestamp
                                            doneCount: input.actualQuantity,
                                            percent
                                        }
                                    ]
                                };
                            })
                        };
                    });
                    const wp = workpackages.find(wp => wp.id === input.workpackageId);
                    const sw = wp?.subWorkpackages.find(sw => sw.id === input.subWorkpackageId);
                    const percent = sw && sw.estimatedQuantity ? Math.round((input.actualQuantity / sw.estimatedQuantity) * 100) : 0;
                    activities.push({
                        id: `${input.workpackageId}_${input.subWorkpackageId}_${now.getTime()}`,
                        workpackageId: input.workpackageId,
                        description: `${wp?.name || ''} / ${sw?.name || ''}`,
                        startTime: nowTimestamp, // 修正: 應為 Timestamp
                        endTime: nowTimestamp,   // 修正: 應為 Timestamp
                        workforce: newReport.workforceCount || 0,
                        progress: percent,
                        notes: '',
                    });
                }
            }
            await updateDoc(doc(db, "projects", projectId), { workpackages: updatedWorkpackages });
            await updateDoc(doc(db, "projects", projectId), {
                reports: arrayUnion({
                    ...newReport,
                    weather,
                    temperature,
                    activities,
                    date: nowTimestamp, // 修正: 建議日誌日期也用 Timestamp
                }),
                photos: arrayUnion(...photoRecords),
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

    const getReportPhotos = (reportId: string) => photos.filter(photo => photo.reportId === reportId);

    if (loading) return <div className="p-4">載入中...</div>;
    if (error) return <div className="p-4 text-red-500">錯誤: {error.message}</div>;
    if (!projectDoc?.exists()) return <div className="p-4">找不到專案</div>;

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">專案工作日誌</h1>
            </div>
            <div className="mb-4">
                {weatherDisplay ? (
                    <div className="text-blue-700 dark:text-blue-300">
                        今日天氣：{weatherDisplay.weather}，溫度：{weatherDisplay.temperature}°C
                    </div>
                ) : (
                    <div className="text-gray-500 dark:text-gray-400">無法取得天氣資料</div>
                )}
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">新增工作日誌</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
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
                        />
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-medium">照片記錄</h3>
                            <button
                                type="button"
                                onClick={handleAddPhotoField}
                                className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                            >
                                新增照片
                            </button>
                        </div>
                        {photoFiles.map((file, index) => (
                            <div key={index} className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-700">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium">照片 #{index + 1}</h4>
                                    <button
                                        type="button"
                                        onClick={() => handleRemovePhotoField(index)}
                                        className="text-red-500 hover:text-red-700"
                                    >
                                        移除
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">選擇照片</label>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => e.target.files && handlePhotoChange(index, e.target.files[0])}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            disabled={saving}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">照片類型</label>
                                        <select
                                            value={photoTypes[index] || "progress"}
                                            onChange={(e) => handleTypeChange(index, e.target.value as PhotoType)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
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
                                    <label className="block text-sm font-medium mb-1">照片描述</label>
                                    <textarea
                                        value={photoDescriptions[index] || ""}
                                        onChange={(e) => handleDescriptionChange(index, e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        rows={2}
                                        placeholder="請描述照片內容..."
                                        disabled={saving}
                                    />
                                </div>
                            </div>
                        ))}
                        {uploading && (
                            <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                    <div
                                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-center text-gray-600">{uploadProgress}% 已上傳</p>
                            </div>
                        )}
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 rounded p-4 mb-2">
                        <h3 className="font-bold mb-2 text-base">進度填報</h3>
                        {progressInputs.map((input, idx) => {
                            const selectedWp = workpackages.find(wp => wp.id === input.workpackageId);
                            const subWorkpackages = selectedWp?.subWorkpackages || [];
                            const selectedSubWp = subWorkpackages.find(sw => sw.id === input.subWorkpackageId);
                            return (
                                <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">選擇工作包</label>
                                        <select
                                            className="border rounded w-full px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
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
                                        <label className="block text-sm font-medium mb-1">選擇子工作包</label>
                                        <select
                                            className="border rounded w-full px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
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
                                        <label className="block text-sm font-medium mb-1">本日實際數量</label>
                                        <input
                                            type="number"
                                            className="border rounded w-full px-3 py-2"
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
                                            <div className="mt-1 text-xs text-gray-600">
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
                                            <button type="button" className="text-red-500 text-xs" onClick={() => setProgressInputs(arr => arr.filter((_, i) => i !== idx))}>移除</button>
                                        )}
                                        {idx === progressInputs.length - 1 && (
                                            <button type="button" className="text-blue-500 text-xs" onClick={() => setProgressInputs(arr => [...arr, { workpackageId: '', subWorkpackageId: '', actualQuantity: 0 }])}>新增一筆</button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                <h2 className="text-xl font-bold p-6 border-b">工作日誌列表</h2>
                {reports && reports.length > 0 ? (
                    <div className="divide-y">
                        {reports
                            .sort((a, b) => a.date.toDate().getTime() - b.date.toDate().getTime())
                            .map((report, idx) => (
                                <div key={report.id + '-' + idx} className="p-6">
                                    <div className="flex justify-between mb-2">
                                        <h3 className="font-bold">
                                            {report.date.toDate().toLocaleDateString()}
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
                                            <h4 className="font-medium mb-2">照片記錄</h4>
                                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                                                {getReportPhotos(report.id).map((photo) => (
                                                    <div key={photo.id} className="border rounded-lg overflow-hidden">
                                                        <Image
                                                            src={photo.url}
                                                            alt={photo.description}
                                                            width={300}
                                                            height={200}
                                                            className="w-full h-24 object-cover"
                                                        />
                                                        <div className="p-2 text-xs">
                                                            <p className="truncate">{photo.description}</p>
                                                            <p className="text-gray-500 capitalize">{photo.type}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    {report.activities && report.activities.length > 0 && (
                                        <div className="mb-2">
                                            <span className="font-medium">進度填報紀錄:</span>
                                            <ul className="text-gray-700 dark:text-gray-300 text-sm list-disc ml-6">
                                                {report.activities.map((a: ActivityLog, i: number) => (
                                                    <li key={a.id || i}>
                                                        {a.description}：{a.progress}（{a.progress}%）
                                                    </li>
                                                ))}
                                            </ul>
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