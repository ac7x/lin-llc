"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useDocument } from "react-firebase-hooks/firestore";
import { useAuth } from '@/hooks/useAuth';
import { Project } from "@/types/project";
import { SubWorkpackage, Workpackage } from "@/types/project";
import { Template, SubWorkpackageTemplateItem, TemplateToSubWorkpackageOptions, Task } from "@/types/project";
import { nanoid } from "nanoid";
import { collection, getDocs, Timestamp } from "firebase/firestore";

// Template helper functions
/**
 * 將範本項目轉換為子工作包
 * @param templateItem 範本項目
 * @param options 轉換選項
 * @returns 子工作包實例
 */
function templateItemToSubWorkpackage(
    templateItem: SubWorkpackageTemplateItem,
    options?: TemplateToSubWorkpackageOptions
): SubWorkpackage {
    const now = Timestamp.now();
    const { estimatedStartDate, estimatedEndDate } = options || {};

    // 創建任務
    const tasks: Task[] = (templateItem.tasks || []).map(task => ({
        id: nanoid(8),
        name: task.name,
        description: task.description || '',
        status: 'pending',
        completed: false,
        createdAt: now
    }));

    // 建立子工作包物件，日期欄位可為 undefined
    return {
        id: nanoid(8),
        name: templateItem.name,
        description: templateItem.description || '',
        estimatedQuantity: templateItem.estimatedQuantity,
        actualQuantity: 0,
        unit: templateItem.unit,
        progress: 0,
        status: 'pending',
        tasks: tasks,
        createdAt: now,
        // 日期欄位為選填，可為 undefined
        estimatedStartDate: estimatedStartDate || undefined,
        estimatedEndDate: estimatedEndDate || undefined,
        priority: 0
    };
}

/**
 * 將整個範本轉換為一系列子工作包
 * @param template 範本
 * @param options 轉換選項
 * @returns 子工作包陣列
 */
function templateToSubWorkpackages(
    template: Template,
    options?: TemplateToSubWorkpackageOptions
): SubWorkpackage[] {
    return template.subWorkpackages.map(item =>
        templateItemToSubWorkpackage(item, options)
    );
}

/**
 * 從 LocalStorage 取得使用者選擇的範本
 * @returns 範本或 null
 */
function getSelectedTemplateFromStorage(): Template | null {
    if (typeof window === 'undefined') return null;

    const stored = localStorage.getItem('selectedTemplate');
    if (!stored) return null;

    try {
        return JSON.parse(stored) as Template;
    } catch (e) {
        console.error('解析儲存的範本時發生錯誤', e);
        return null;
    }
}

/**
 * 清除 LocalStorage 中的範本選擇
 */
function clearSelectedTemplate(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('selectedTemplate');
}

export default function WorkpackageDetailPage() {
    const { db, doc, updateDoc } = useAuth();
    const params = useParams();
    const router = useRouter();
    const projectId = params?.project as string;
    const workpackageId = params?.workpackage as string;
    const [projectDoc, loading, error] = useDocument(doc(db, "projects", projectId));
    const [isEditing, setIsEditing] = useState(false);
    const [isAddingSubWP, setIsAddingSubWP] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newSubWorkpackage, setNewSubWorkpackage] = useState({
        name: "",
        description: "",
        estimatedQuantity: 0,
        unit: "項",
        budget: 0,
        estimatedStartDate: "", // string
        estimatedEndDate: ""   // string
    });
    const [subSaving, setSubSaving] = useState(false);
    const [editProgress, setEditProgress] = useState(0);
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loadingTemplates, setLoadingTemplates] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [templateQuantities, setTemplateQuantities] = useState<{ [id: string]: number }>({});
    const [tasks, setTasks] = useState<Task[]>([]);

    useEffect(() => {
        const selected = getSelectedTemplateFromStorage();
        if (selected) {
            setSelectedTemplate(selected);
            setShowTemplateModal(true);
            clearSelectedTemplate();
        }
    }, []);

    useEffect(() => {
        const loadTemplates = async () => {
            setLoadingTemplates(true);
            try {
                const templatesRef = collection(db, "templates");
                const templatesSnapshot = await getDocs(templatesRef);
                const templatesData = templatesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Template[];
                setTemplates(templatesData);
            } catch (error) {
                console.error("Error fetching templates:", error);
            } finally {
                setLoadingTemplates(false);
            }
        };
        if (showTemplateModal && templates.length === 0) loadTemplates();
    }, [showTemplateModal, templates.length, doc, db, getDocs]);

    useEffect(() => {
        const fetchTasks = async () => {
            try {
                const tasksRef = collection(db, "tasks");
                const tasksSnapshot = await getDocs(tasksRef);
                const tasksData = tasksSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Task[];
                setTasks(tasksData);
            } catch (error) {
                console.error("Error fetching tasks:", error);
            }
        };
        if (showTemplateModal && tasks.length === 0) fetchTasks();
    }, [showTemplateModal, tasks.length, doc, db, getDocs]);

    if (loading) return <div>載入中...</div>;
    if (error) return <div>錯誤: {error.message}</div>;
    if (!projectDoc?.exists()) return <div>找不到專案</div>;

    const project = projectDoc.data() as Project;
    const workpackage = project.workpackages?.find(wp => wp.id === workpackageId);
    if (!workpackage) return <div>找不到此工作包</div>;

    let calculatedProgress = workpackage.progress ?? 0;
    if ((!workpackage.progress || workpackage.progress === 0) && workpackage.subWorkpackages && workpackage.subWorkpackages.length > 0) {
        let done = 0, total = 0;
        for (const sw of workpackage.subWorkpackages) {
            if (typeof sw.estimatedQuantity === 'number' && sw.estimatedQuantity > 0) {
                total += sw.estimatedQuantity;
                if (typeof sw.actualQuantity === 'number') {
                    done += Math.min(sw.actualQuantity, sw.estimatedQuantity);
                }
            }
        }
        calculatedProgress = total > 0 ? Math.round((done / total) * 100) : 0;
    }

    const handleSave = async (updates: Partial<Workpackage>) => {
        setSaving(true);
        try {
            // 這裡不再處理 string 轉換，直接用 Timestamp
            const updatedWorkpackages = project.workpackages.map(wp =>
                wp.id === workpackageId
                    ? {
                        ...wp,
                        ...updates,
                    }
                    : wp
            );
            await updateDoc(doc(db, "projects", projectId), { workpackages: updatedWorkpackages });
            router.refresh();
        } finally {
            setSaving(false);
        }
    };

    const handleAddSubWorkpackage = async () => {
        if (!newSubWorkpackage.name.trim() || subSaving) return;
        setSubSaving(true);
        try {
            // 先建立物件，後續用展開運算子動態加入日期欄位
            const dateFields: Partial<Pick<SubWorkpackage, "estimatedStartDate" | "estimatedEndDate">> = {};
            if (newSubWorkpackage.estimatedStartDate) {
                dateFields.estimatedStartDate = Timestamp.fromDate(new Date(newSubWorkpackage.estimatedStartDate));
            }
            if (newSubWorkpackage.estimatedEndDate) {
                dateFields.estimatedEndDate = Timestamp.fromDate(new Date(newSubWorkpackage.estimatedEndDate));
            }
            const newSubWp: SubWorkpackage = {
                id: Date.now().toString(),
                name: newSubWorkpackage.name.trim(),
                description: newSubWorkpackage.description,
                estimatedQuantity: newSubWorkpackage.estimatedQuantity,
                unit: newSubWorkpackage.unit,
                budget: newSubWorkpackage.budget,
                status: "新建立",
                progress: 0,
                createdAt: Timestamp.now(),
                tasks: [],
                ...dateFields,
            };
            const updatedWorkpackages = project.workpackages.map(wp =>
                wp.id === workpackageId
                    ? { ...wp, subWorkpackages: [...(wp.subWorkpackages || []), newSubWp] }
                    : wp
            );
            await updateDoc(doc(db, "projects", projectId), { workpackages: updatedWorkpackages });
            setNewSubWorkpackage({
                name: "",
                description: "",
                estimatedQuantity: 0,
                unit: "項",
                budget: 0,
                estimatedStartDate: "",
                estimatedEndDate: ""
            });
        } finally {
            setSubSaving(false);
        }
    };

    const handleAddFromTemplate = async (template: Template) => {
        setSubSaving(true);
        try {
            // 只有在工作包已有預計日期時才傳遞預設日期
            const templateOptions: TemplateToSubWorkpackageOptions = {
                workpackageId: workpackageId,
                // 確保只有在有日期的情況下傳遞日期參數，否則為 undefined
                estimatedStartDate: workpackage.estimatedStartDate || undefined,
                estimatedEndDate: workpackage.estimatedEndDate || undefined
            };
            
            const subWorkpackages = templateToSubWorkpackages(template, templateOptions)
                .map(subWp => ({
                    ...subWp,
                    estimatedQuantity: templateQuantities[subWp.id] ?? 0
                }));
                
            const updatedWorkpackages = project.workpackages.map(wp =>
                wp.id === workpackageId
                    ? { ...wp, subWorkpackages: [...(wp.subWorkpackages || []), ...subWorkpackages] }
                    : wp
            );
            await updateDoc(doc(db, "projects", projectId), { workpackages: updatedWorkpackages });
            setShowTemplateModal(false);
            setSelectedTemplate(null);
            setTemplateQuantities({});
        } finally {
            setSubSaving(false);
        }
    };

    return (
        <main className="max-w-4xl mx-auto p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">{workpackage.name}</h1>
                        <div className="text-gray-500">工作包 ID: {workpackage.id}</div>
                    </div>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
                    >編輯</button>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div><label className="text-gray-500">描述</label><div>{workpackage.description || '-'}</div></div>
                    <div><label className="text-gray-500">類別</label><div>{workpackage.category || '-'}</div></div>
                    <div><label className="text-gray-500">優先級</label><div>
                        {workpackage.priority === 'high' && '高'}
                        {workpackage.priority === 'medium' && '中'}
                        {workpackage.priority === 'low' && '低'}
                        {!workpackage.priority && '-'}
                    </div></div>
                    <div><label className="text-gray-500">負責人</label><div>{workpackage.assignedTo || '-'}</div></div>
                    <div><label className="text-gray-500">預計開始日期</label><div>{workpackage.estimatedStartDate ? workpackage.estimatedStartDate.toDate().toLocaleDateString() : '-'}</div></div>
                    <div><label className="text-gray-500">預計結束日期</label><div>{workpackage.estimatedEndDate ? workpackage.estimatedEndDate.toDate().toLocaleDateString() : '-'}</div></div>
                    <div>
                        <label className="text-gray-500">進度</label>
                        <div className="flex items-center">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2">
                                <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${calculatedProgress}%` }}></div>
                            </div>
                            <span>{calculatedProgress}%</span>
                        </div>
                    </div>
                    <div><label className="text-gray-500">預算</label><div>{workpackage.budget ? `$${workpackage.budget.toLocaleString()}` : '-'}</div></div>
                    <div><label className="text-gray-500">子工作包數量</label><div>{workpackage.subWorkpackages?.length || 0}個</div></div>
                    <div><label className="text-gray-500">建立日期</label><div>{workpackage.createdAt ? workpackage.createdAt.toDate().toLocaleDateString() : '-'}</div></div>
                </div>
                <div className="mt-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">子工作包列表</h2>
                        <div className="flex gap-2">
                            <button onClick={() => setShowTemplateModal(true)} className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600">使用範本</button>
                            <button onClick={() => setIsAddingSubWP(true)} className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600">新增子工作包</button>
                        </div>
                    </div>
                    {workpackage.subWorkpackages && workpackage.subWorkpackages.length > 0 ? (
                        <div className="space-y-4">
                            {workpackage.subWorkpackages.map(subWp => (
                                <div key={subWp.id} className="border p-3 rounded-lg bg-gray-50 dark:bg-gray-700">
                                    <div className="font-medium">{subWp.name}</div>
                                    {subWp.description && <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{subWp.description}</div>}
                                    <div className="mt-2 text-xs text-gray-500">狀態: {subWp.status || '新建立'} | 進度: {subWp.progress ?? 0}%</div>
                                    <div className="mt-2 text-xs text-gray-500">數量: {subWp.estimatedQuantity ?? '-'} {subWp.unit ?? ''} | 預算: {subWp.budget ?? '-'}</div>
                                    <div className="mt-2 text-xs text-gray-500">
                                        預計開始日期: {subWp.estimatedStartDate ? subWp.estimatedStartDate.toDate().toLocaleDateString() : '-'}
                                        {' | '}預計結束日期: {subWp.estimatedEndDate ? subWp.estimatedEndDate.toDate().toLocaleDateString() : '-'}
                                    </div>
                                    <div className="mt-2 flex gap-2">
                                        <button
                                            className={`px-3 py-1 rounded text-white ${subWp.actualStartDate ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                                            disabled={!!subWp.actualStartDate}
                                            onClick={async () => {
                                                if (subWp.actualStartDate) return;
                                                const updatedSubWps = workpackage.subWorkpackages.map(wp =>
                                                    wp.id === subWp.id ? { ...wp, actualStartDate: Timestamp.now() } : wp
                                                );
                                                const updatedWorkpackages = project.workpackages.map(wp =>
                                                    wp.id === workpackageId ? { ...wp, subWorkpackages: updatedSubWps } : wp
                                                );
                                                await updateDoc(doc(db, "projects", projectId), { workpackages: updatedWorkpackages });
                                            }}
                                        >
                                            {subWp.actualStartDate ? `已開工 (${subWp.actualStartDate.toDate().toLocaleDateString()})` : '開工'}
                                        </button>
                                        <button
                                            className={`px-3 py-1 rounded text-white ${subWp.actualEndDate || !subWp.actualStartDate ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                                            disabled={!!subWp.actualEndDate || !subWp.actualStartDate}
                                            onClick={async () => {
                                                if (subWp.actualEndDate || !subWp.actualStartDate) return;
                                                const updatedSubWps = workpackage.subWorkpackages.map(wp =>
                                                    wp.id === subWp.id ? { ...wp, actualEndDate: Timestamp.now() } : wp
                                                );
                                                const updatedWorkpackages = project.workpackages.map(wp =>
                                                    wp.id === workpackageId ? { ...wp, subWorkpackages: updatedSubWps } : wp
                                                );
                                                await updateDoc(doc(db, "projects", projectId), { workpackages: updatedWorkpackages });
                                            }}
                                        >
                                            {subWp.actualEndDate ? `已完工 (${subWp.actualEndDate.toDate().toLocaleDateString()})` : '完工'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-gray-500 py-8">目前沒有子工作包</div>
                    )}
                </div>
                {isAddingSubWP && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                            <h2 className="text-xl font-bold mb-4">新增子工作包</h2>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                await handleAddSubWorkpackage();
                                setIsAddingSubWP(false);
                            }} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">名稱</label>
                                    <input type="text" className="border rounded w-full px-3 py-2" value={newSubWorkpackage.name} onChange={e => setNewSubWorkpackage(prev => ({ ...prev, name: e.target.value }))} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">描述</label>
                                    <textarea className="border rounded w-full px-3 py-2" value={newSubWorkpackage.description} onChange={e => setNewSubWorkpackage(prev => ({ ...prev, description: e.target.value }))} rows={3} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">預計開始日期 (選填)</label>
                                        <input type="date" className="border rounded w-full px-3 py-2" value={newSubWorkpackage.estimatedStartDate} onChange={e => setNewSubWorkpackage(prev => ({ ...prev, estimatedStartDate: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">預計結束日期 (選填)</label>
                                        <input type="date" className="border rounded w-full px-3 py-2" value={newSubWorkpackage.estimatedEndDate} onChange={e => setNewSubWorkpackage(prev => ({ ...prev, estimatedEndDate: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">預計數量</label>
                                        <input type="number" className="border rounded w-full px-3 py-2" value={newSubWorkpackage.estimatedQuantity} min={0} onChange={e => setNewSubWorkpackage(prev => ({ ...prev, estimatedQuantity: Number(e.target.value) }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">單位</label>
                                        <input type="text" className="border rounded w-full px-3 py-2" value={newSubWorkpackage.unit} onChange={e => setNewSubWorkpackage(prev => ({ ...prev, unit: e.target.value }))} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">預算</label>
                                        <input type="number" className="border rounded w-full px-3 py-2" value={newSubWorkpackage.budget} min={0} onChange={e => setNewSubWorkpackage(prev => ({ ...prev, budget: Number(e.target.value) }))} />
                                    </div>
                                </div>
                                <div className="flex justify-end space-x-2">
                                    <button type="button" onClick={() => setIsAddingSubWP(false)} className="px-4 py-2 border border-gray-300 rounded shadow hover:bg-gray-200 hover:text-gray-900">取消</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded" disabled={subSaving || !newSubWorkpackage.name.trim()}>{subSaving ? "建立中..." : "確認新增"}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                {showTemplateModal && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold">選擇範本</h2>
                                <button onClick={() => setShowTemplateModal(false)} className="text-gray-500 hover:text-gray-700">關閉</button>
                            </div>
                            {loadingTemplates ? (
                                <div className="py-20 text-center">正在載入範本...</div>
                            ) : templates.length > 0 ? (
                                <div>
                                    {selectedTemplate ? (
                                        <div className="mb-6">
                                            <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
                                                <h3 className="font-bold text-lg mb-2">{selectedTemplate.name}</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{selectedTemplate.description}</p>
                                                <div className="text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-2 mb-4">
                                                    <p className="font-medium mb-1">請輸入每個子工作包的數量：</p>
                                                    <form onSubmit={e => { e.preventDefault(); handleAddFromTemplate(selectedTemplate); }}>
                                                        <ul className="list-disc pl-6 space-y-2">
                                                            {selectedTemplate.subWorkpackages.map(item => (
                                                                <li key={item.id} className="flex items-center gap-2">
                                                                    <span className="flex-1">{item.name}（單位：{item.unit}）</span>
                                                                    <input type="number" min={0} required className="border rounded px-2 py-1 w-24" value={templateQuantities[item.id] ?? ""} onChange={e => setTemplateQuantities(q => ({ ...q, [item.id]: Number(e.target.value) }))} />
                                                                </li>
                                                            ))}
                                                        </ul>
                                                        <div className="flex justify-end gap-3 mt-4">
                                                            <button type="button" onClick={() => setSelectedTemplate(null)} className="px-4 py-2 border border-gray-300 rounded shadow hover:bg-gray-100">返回選擇</button>
                                                            <button type="submit" disabled={subSaving || selectedTemplate.subWorkpackages.some(item => !templateQuantities[item.id] && templateQuantities[item.id] !== 0)} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300">{subSaving ? '新增中...' : '確認使用此範本'}</button>
                                                        </div>
                                                    </form>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                                            {templates.map(template => (
                                                <div key={template.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer transition" onClick={() => setSelectedTemplate(template)}>
                                                    <h3 className="font-bold mb-1">{template.name}</h3>
                                                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">{template.category}</span>
                                                    <p className="text-sm mt-2 text-gray-600 dark:text-gray-400">{template.description}</p>
                                                    <div className="mt-2 text-xs text-gray-500">包含 {template.subWorkpackages.length} 個子工作包項目</div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="py-10 text-center">
                                    <p className="text-gray-500 mb-4">尚未建立任何範本</p>
                                    <button onClick={() => { setShowTemplateModal(false); router.push('/owner/templates'); }} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">前往建立範本</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {isEditing && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-2xl">
                            <h2 className="text-xl font-bold mb-4">編輯工作包資訊</h2>
                            <form onSubmit={async (e) => {
                                e.preventDefault();
                                const formData = new FormData(e.target as HTMLFormElement);
                                // 這裡將 input string 轉为 Timestamp
                                const estimatedStartDateStr = formData.get("estimatedStartDate") as string;
                                const estimatedEndDateStr = formData.get("estimatedEndDate") as string;
                                await handleSave({
                                    name: formData.get("name") as string,
                                    description: formData.get("description") as string,
                                    estimatedStartDate: estimatedStartDateStr
                                        ? Timestamp.fromDate(new Date(estimatedStartDateStr))
                                        : undefined,
                                    estimatedEndDate: estimatedEndDateStr
                                        ? Timestamp.fromDate(new Date(estimatedEndDateStr))
                                        : undefined,
                                    status: formData.get("status") as string,
                                    assignedTo: formData.get("assignedTo") as string,
                                    progress: Number(editProgress),
                                    budget: Number(formData.get("budget")),
                                    category: formData.get("category") as string,
                                    priority: formData.get("priority") as 'low' | 'medium' | 'high',
                                });
                                setIsEditing(false);
                            }} className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">工作包名稱</label>
                                        <input name="name" defaultValue={workpackage.name} className="border rounded w-full px-3 py-2" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">類別</label>
                                        <input name="category" defaultValue={workpackage.category} className="border rounded w-full px-3 py-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">狀態</label>
                                        <select name="status" defaultValue={workpackage.status} className="border rounded w-full px-3 py-2">
                                            <option value="未開始">未開始</option>
                                            <option value="待開始">待開始</option>
                                            <option value="進行中">進行中</option>
                                            <option value="已完成">已完成</option>
                                            <option value="已暫停">已暫停</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">優先級</label>
                                        <select name="priority" defaultValue={workpackage.priority || 'medium'} className="border rounded w-full px-3 py-2">
                                            <option value="low">低</option>
                                            <option value="medium">中</option>
                                            <option value="high">高</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">負責人</label>
                                        <input name="assignedTo" defaultValue={workpackage.assignedTo} className="border rounded w-full px-3 py-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">預算</label>
                                        <input type="number" name="budget" defaultValue={workpackage.budget} className="border rounded w-full px-3 py-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">進度 (%)</label>
                                        <input
                                            type="number"
                                            name="progress"
                                            value={editProgress}
                                            min="0"
                                            max="100"
                                            className="border rounded w-full px-3 py-2"
                                            onChange={e => setEditProgress(Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">預計開始日期</label>
                                        <input
                                            type="date"
                                            name="estimatedStartDate"
                                            defaultValue={workpackage.estimatedStartDate ? workpackage.estimatedStartDate.toDate().toISOString().split('T')[0] : ""}
                                            className="border rounded w-full px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">預計結束日期</label>
                                        <input
                                            type="date"
                                            name="estimatedEndDate"
                                            defaultValue={workpackage.estimatedEndDate ? workpackage.estimatedEndDate.toDate().toISOString().split('T')[0] : ""}
                                            className="border rounded w-full px-3 py-2"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">描述</label>
                                    <textarea name="description" defaultValue={workpackage.description} rows={3} className="border rounded w-full px-3 py-2" />
                                </div>
                                <div className="flex justify-end space-x-2 pt-4">
                                    <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 border border-gray-300 rounded shadow hover:bg-gray-200 hover:text-gray-900">取消</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded shadow hover:bg-blue-600" disabled={saving}>{saving ? "儲存中..." : "確認儲存"}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}