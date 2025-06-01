"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import { doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useDocument } from "react-firebase-hooks/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";
import { Project } from "@/types/project";
import Image from 'next/image';

// 界定照片類型
type PhotoType = "progress" | "issue" | "material" | "safety" | "other";

// 照片記錄接口
interface PhotoRecord {
    id: string;
    url: string;
    type: PhotoType;
    description: string;
    workpackageId?: string;
    zoneId?: string;
    createdAt: string;
    createdBy: string;
}

export default function ProjectPhotosPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params?.project as string;
    const [projectDoc, loading, error] = useDocument(
        doc(db, "projects", projectId)
    );

    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [isUploading, setIsUploading] = useState<boolean>(false);

    const [newPhoto, setNewPhoto] = useState<{
        file: File | null;
        type: PhotoType;
        description: string;
        workpackageId?: string;
        zoneId?: string;
    }>({
        file: null,
        type: "progress",
        description: "",
    });

    // 從 Firestore 獲取照片數據
    const photos = useMemo(() => {
        if (!projectDoc?.exists()) return [];
        const project = projectDoc.data() as Project;
        return project.photos || [];
    }, [projectDoc]);

    // 從 Firestore 獲取工作包和區域數據
    const { workpackages, zones } = useMemo(() => {
        if (!projectDoc?.exists()) return { workpackages: [], zones: [] };
        const project = projectDoc.data() as Project;
        return {
            workpackages: project.workpackages || [],
            zones: project.zones || []
        };
    }, [projectDoc]);

    // 處理文件選擇
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setNewPhoto({
                ...newPhoto,
                file: e.target.files[0]
            });
        }
    };

    // 處理上傳
    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPhoto.file || isUploading || !newPhoto.description) return;

        setIsUploading(true);
        setUploadProgress(0);

        try {
            // 獲取專案資訊
            const projectSnap = await getDoc(doc(db, "projects", projectId));
            if (!projectSnap.exists()) throw new Error("專案不存在");

            // 上傳到 Firebase Storage
            const storage = getStorage();
            const timestamp = Date.now();
            const fileName = `projects/${projectId}/photos/${timestamp}-${newPhoto.file.name}`;
            const storageRef = ref(storage, fileName);

            // 開始上傳
            const uploadTask = uploadBytesResumable(storageRef, newPhoto.file);

            // 監聽上傳進度
            uploadTask.on('state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    setUploadProgress(progress);
                },
                (error) => {
                    console.error("上傳失敗:", error);
                    alert("上傳失敗: " + error.message);
                    setIsUploading(false);
                },
                async () => {
                    // 上傳完成，獲取下載 URL
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                    // 建立照片記錄
                    const photoRecord: PhotoRecord = {
                        id: Date.now().toString(),
                        url: downloadURL,
                        type: newPhoto.type,
                        description: newPhoto.description,
                        workpackageId: newPhoto.workpackageId,
                        zoneId: newPhoto.zoneId,
                        createdAt: new Date().toISOString(),
                        createdBy: "current-user", // 理想情況下應該從用戶認證中獲取
                    };

                    // 更新專案文檔，添加新照片
                    await updateDoc(doc(db, "projects", projectId), {
                        photos: arrayUnion(photoRecord)
                    });

                    // 重置表單
                    setNewPhoto({
                        file: null,
                        type: "progress",
                        description: "",
                    });

                    setIsUploading(false);
                    alert("照片上傳成功!");

                    // 重置文件輸入
                    const fileInput = document.getElementById("photo-upload") as HTMLInputElement;
                    if (fileInput) fileInput.value = "";
                }
            );
        } catch (error) {
            console.error("上傳過程發生錯誤:", error);
            alert("上傳過程發生錯誤: " + error);
            setIsUploading(false);
        }
    };

    if (loading) return <div className="p-4">載入中...</div>;
    if (error) return <div className="p-4 text-red-500">錯誤: {error.message}</div>;
    if (!projectDoc?.exists()) return <div className="p-4">找不到專案</div>;

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">專案照片記錄</h1>
                <button
                    className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                    onClick={() => router.push(`/owner/projects/${projectId}`)}
                >
                    返回專案
                </button>
            </div>

            {/* 上傳照片表單 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">上傳新照片</h2>
                <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">選擇照片</label>
                        <input
                            id="photo-upload"
                            type="file"
                            accept="image/*"
                            className="border rounded w-full px-3 py-2"
                            onChange={handleFileChange}
                            disabled={isUploading}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">照片類型</label>
                        <select
                            className="border rounded w-full px-3 py-2"
                            value={newPhoto.type}
                            onChange={(e) => setNewPhoto({ ...newPhoto, type: e.target.value as PhotoType })}
                            disabled={isUploading}
                        >
                            <option value="progress">進度照片</option>
                            <option value="issue">問題照片</option>
                            <option value="material">材料照片</option>
                            <option value="safety">安全照片</option>
                            <option value="other">其他</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">描述</label>
                        <textarea
                            className="border rounded w-full px-3 py-2 h-24"
                            value={newPhoto.description}
                            onChange={(e) => setNewPhoto({ ...newPhoto, description: e.target.value })}
                            disabled={isUploading}
                            placeholder="請描述這張照片的內容或目的"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">相關工作包 (可選)</label>
                        <select
                            className="border rounded w-full px-3 py-2"
                            value={newPhoto.workpackageId || ""}
                            onChange={(e) => setNewPhoto({ ...newPhoto, workpackageId: e.target.value || undefined })}
                            disabled={isUploading}
                        >
                            <option value="">-- 選擇工作包 --</option>
                            {workpackages.map(wp => (
                                <option key={wp.id} value={wp.id}>{wp.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">相關區域 (可選)</label>
                        <select
                            className="border rounded w-full px-3 py-2"
                            value={newPhoto.zoneId || ""}
                            onChange={(e) => setNewPhoto({ ...newPhoto, zoneId: e.target.value || undefined })}
                            disabled={isUploading}
                        >
                            <option value="">-- 選擇區域 --</option>
                            {zones.map(zone => (
                                <option key={zone.zoneId} value={zone.zoneId}>{zone.zoneName}</option>
                            ))}
                        </select>
                    </div>

                    {isUploading && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
                            <p className="text-sm text-center mt-1">{Math.round(uploadProgress)}%</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                        disabled={isUploading || !newPhoto.file || !newPhoto.description}
                    >
                        {isUploading ? "上傳中..." : "上傳照片"}
                    </button>
                </form>
            </div>

            {/* 照片列表 */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4">照片記錄</h2>

                {photos && photos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {photos
                            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                            .map((photo) => (
                                <div key={photo.id} className="border rounded overflow-hidden">
                                    <Image
                                        src={photo.url}
                                        alt={photo.description}
                                        className="w-full h-48 object-cover"
                                        width={300}
                                        height={192}
                                    />
                                    <div className="p-3">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium">
                                                {(() => {
                                                    switch (photo.type) {
                                                        case "progress": return "進度";
                                                        case "issue": return "問題";
                                                        case "material": return "材料";
                                                        case "safety": return "安全";
                                                        default: return "其他";
                                                    }
                                                })()}
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                {new Date(photo.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                                            {photo.description}
                                        </p>
                                    </div>
                                </div>
                            ))}
                    </div>
                ) : (
                    <div className="text-center text-gray-500 py-8">暫無照片記錄</div>
                )}
            </div>
        </div>
    );
}
