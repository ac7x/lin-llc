"use client";

import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import { db, doc } from "@/lib/firebase-client";
import { updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { useDocument } from "react-firebase-hooks/firestore";
import { Project } from "@/types/project";
import { IssueRecord } from "@/types/project";

export default function ProjectIssuesPage() {
    const params = useParams();
    const projectId = params?.project as string;
    const [projectDoc, loading, error] = useDocument(
        doc(db, "projects", projectId)
    );

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
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState<{
        type: string;
        status: string;
        severity: string;
    }>({
        type: "",
        status: "",
        severity: ""
    });

    const issues = useMemo(() => {
        if (!projectDoc?.exists()) return [];
        const project = projectDoc.data() as Project;
        return project.issues || [];
    }, [projectDoc]);

    const filteredIssues = useMemo(() => {
        let result = [...(issues || [])];
        if (filter.type) result = result.filter(issue => issue.type === filter.type);
        if (filter.status) result = result.filter(issue => issue.status === filter.status);
        if (filter.severity) result = result.filter(issue => issue.severity === filter.severity);
        return result;
    }, [issues, filter]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving || !newIssue.description) return;
        setSaving(true);
        try {
            const issueRecord: IssueRecord = {
                id: Date.now().toString(),
                type: newIssue.type,
                description: newIssue.description,
                severity: newIssue.severity,
                status: 'open',
                assignedTo: newIssue.assignedTo,
                dueDate: newIssue.dueDate
                    ? Timestamp.fromDate(new Date(newIssue.dueDate))
                    : Timestamp.now(),
                resolved: false
            };
            if (!projectDoc?.data()?.issues) {
                await updateDoc(doc(db, "projects", projectId), {
                    issues: [issueRecord]
                });
            } else {
                await updateDoc(doc(db, "projects", projectId), {
                    issues: arrayUnion(issueRecord)
                });
            }
            setNewIssue({
                ...newIssue,
                description: ""
            });
            alert("問題記錄已成功添加！");
        } catch (error) {
            console.error("無法保存問題記錄：", error);
            alert("保存問題記錄時出錯：" + error);
        } finally {
            setSaving(false);
        }
    };

    const updateIssueStatus = async (issueId: string, newStatus: 'open' | 'in-progress' | 'resolved') => {
        try {
            if (!projectDoc?.exists()) return;
            const project = projectDoc.data() as Project;
            const allIssues = [...(project.issues || [])];
            const updatedIssues = allIssues.map(issue =>
                issue.id === issueId ? { ...issue, status: newStatus } : issue
            );
            await updateDoc(doc(db, "projects", projectId), {
                issues: updatedIssues
            });
        } catch (error) {
            console.error("無法更新問題狀態：", error);
            alert("更新問題狀態時出錯：" + error);
        }
    };

    if (loading) return <div className="p-4">載入中...</div>;
    if (error) return <div className="p-4 text-red-500">錯誤: {error.message}</div>;
    if (!projectDoc?.exists()) return <div className="p-4">找不到專案</div>;

    return (
        <div className="p-4 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">專案問題追蹤</h1>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">記錄新問題</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">問題類型<span className="text-red-500">*</span></label>
                            <select
                                className="border rounded w-full px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                value={newIssue.type}
                                onChange={(e) => setNewIssue({ ...newIssue, type: e.target.value as 'quality' | 'safety' | 'progress' | 'other' })}
                                required
                            >
                                <option value="quality">品質問題</option>
                                <option value="safety">安全問題</option>
                                <option value="progress">進度問題</option>
                                <option value="other">其他問題</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">嚴重程度<span className="text-red-500">*</span></label>
                            <select
                                className="border rounded w-full px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                value={newIssue.severity}
                                onChange={(e) => setNewIssue({ ...newIssue, severity: e.target.value as 'low' | 'medium' | 'high' })}
                                required
                            >
                                <option value="low">低</option>
                                <option value="medium">中</option>
                                <option value="high">高</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">預計解決日期</label>
                            <input
                                type="date"
                                className="border rounded w-full px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                                value={newIssue.dueDate}
                                onChange={(e) => setNewIssue({ ...newIssue, dueDate: e.target.value })}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">負責人</label>
                        <input
                            type="text"
                            className="border rounded w-full px-3 py-2"
                            value={newIssue.assignedTo}
                            onChange={(e) => setNewIssue({ ...newIssue, assignedTo: e.target.value })}
                            placeholder="問題負責處理人員"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">問題描述<span className="text-red-500">*</span></label>
                        <textarea
                            className="border rounded w-full px-3 py-2 h-24"
                            value={newIssue.description}
                            onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                            placeholder="請詳細描述問題的狀況、影響和可能的解決方法"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                        disabled={saving || !newIssue.description}
                    >
                        {saving ? "保存中..." : "記錄問題"}
                    </button>
                </form>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold">篩選問題</h3>
                    <button
                        className="text-sm text-blue-500 hover:underline"
                        onClick={() => setFilter({ type: "", status: "", severity: "" })}
                    >
                        清除篩選
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">問題類型</label>
                        <select
                            className="border rounded w-full px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            value={filter.type}
                            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                        >
                            <option value="">全部類型</option>
                            <option value="quality">品質問題</option>
                            <option value="safety">安全問題</option>
                            <option value="progress">進度問題</option>
                            <option value="other">其他問題</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">問題狀態</label>
                        <select
                            className="border rounded w-full px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            value={filter.status}
                            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
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
                            className="border rounded w-full px-3 py-2 bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
                            value={filter.severity}
                            onChange={(e) => setFilter({ ...filter, severity: e.target.value })}
                        >
                            <option value="">全部嚴重度</option>
                            <option value="low">低</option>
                            <option value="medium">中</option>
                            <option value="high">高</option>
                        </select>
                    </div>
                </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
                <h2 className="text-xl font-bold p-6 border-b">問題列表</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-100 dark:bg-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">狀態</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">問題描述</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">類型</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">嚴重程度</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">負責人</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">截止日期</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                            {filteredIssues && filteredIssues.length > 0 ? (
                                filteredIssues.map((issue) => (
                                    <tr key={issue.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-4 py-4">
                                            <span
                                                className={`inline-block rounded-full px-2 py-1 text-xs font-bold 
                          ${issue.status === 'open' ? 'bg-red-100 text-red-800' :
                                                        issue.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'}`}
                                            >
                                                {issue.status === 'open' ? '待解決' :
                                                    issue.status === 'in-progress' ? '處理中' : '已解決'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="max-w-xs overflow-hidden">
                                                <p className="text-sm line-clamp-2" title={issue.description}>
                                                    {issue.description}
                                                </p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            {issue.type === 'quality' ? '品質' :
                                                issue.type === 'safety' ? '安全' :
                                                    issue.type === 'progress' ? '進度' : '其他'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className={`
                        ${issue.severity === 'high' ? 'text-red-600' :
                                                    issue.severity === 'medium' ? 'text-yellow-600' : 'text-green-600'}
                      `}>
                                                {issue.severity === 'high' ? '高' :
                                                    issue.severity === 'medium' ? '中' : '低'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">{issue.assignedTo || "-"}</td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            {issue.dueDate && typeof issue.dueDate.toDate === "function"
                                                ? issue.dueDate.toDate().toLocaleDateString()
                                                : "-"}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex space-x-2">
                                                {issue.status !== 'open' && (
                                                    <button
                                                        onClick={() => updateIssueStatus(issue.id, 'open')}
                                                        className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded"
                                                    >
                                                        標為待解決
                                                    </button>
                                                )}
                                                {issue.status !== 'in-progress' && (
                                                    <button
                                                        onClick={() => updateIssueStatus(issue.id, 'in-progress')}
                                                        className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded"
                                                    >
                                                        標為處理中
                                                    </button>
                                                )}
                                                {issue.status !== 'resolved' && (
                                                    <button
                                                        onClick={() => updateIssueStatus(issue.id, 'resolved')}
                                                        className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded"
                                                    >
                                                        標為已解決
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                                        {issues && issues.length > 0 ? "沒有符合篩選條件的問題" : "暫無問題記錄"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
