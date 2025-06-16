/**
 * 專案問題追蹤頁面
 * 
 * 提供專案問題的管理和追蹤功能，包含：
 * - 問題回報
 * - 問題狀態管理
 * - 問題分類
 * - 問題解決追蹤
 * - 問題歷史記錄
 */

"use client";

import { useParams } from "next/navigation";
import { useState, useMemo } from "react";
import { useAuth } from '@/hooks/useAuth';
import { useDocument } from "react-firebase-hooks/firestore";
import { Project } from "@/types/project";
import { IssueRecord } from "@/types/project";
import { arrayUnion } from "firebase/firestore";

export default function ProjectIssuesPage() {
    const { db, doc, updateDoc, Timestamp } = useAuth();
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

    if (loading) return (
        <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
        </div>
    );
    if (error) return <div className="p-4 text-red-500">錯誤: {error.message}</div>;
    if (!projectDoc?.exists()) return <div className="p-4">找不到專案</div>;

    return (
        <main className="max-w-4xl mx-auto">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">專案問題追蹤</h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-2">追蹤和管理專案中的各類問題</p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                    <h2 className="text-xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">記錄新問題</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">問題類型<span className="text-red-500">*</span></label>
                                <select
                                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">嚴重程度<span className="text-red-500">*</span></label>
                                <select
                                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">預計解決日期</label>
                                <input
                                    type="date"
                                    className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                    value={newIssue.dueDate}
                                    onChange={(e) => setNewIssue({ ...newIssue, dueDate: e.target.value })}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">負責人</label>
                            <input
                                type="text"
                                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                value={newIssue.assignedTo}
                                onChange={(e) => setNewIssue({ ...newIssue, assignedTo: e.target.value })}
                                placeholder="問題負責處理人員"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">問題描述<span className="text-red-500">*</span></label>
                            <textarea
                                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 h-24"
                                value={newIssue.description}
                                onChange={(e) => setNewIssue({ ...newIssue, description: e.target.value })}
                                placeholder="請詳細描述問題的狀況、影響和可能的解決方法"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={saving || !newIssue.description}
                        >
                            {saving ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    保存中...
                                </span>
                            ) : '記錄問題'}
                        </button>
                    </form>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100">篩選問題</h3>
                        <button
                            className="text-sm text-blue-500 hover:text-blue-700 transition-colors duration-200"
                            onClick={() => setFilter({ type: "", status: "", severity: "" })}
                        >
                            清除篩選
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">問題類型</label>
                            <select
                                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">問題狀態</label>
                            <select
                                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
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
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">嚴重程度</label>
                            <select
                                className="w-full border rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
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
                    <h2 className="text-xl font-bold p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">問題列表</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 dark:bg-gray-900">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">狀態</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">問題描述</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">類型</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">嚴重程度</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">負責人</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">截止日期</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {filteredIssues && filteredIssues.length > 0 ? (
                                    filteredIssues.map((issue) => (
                                        <tr key={issue.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200">
                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                                                    ${issue.status === 'open' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                                                        issue.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                                                            'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}
                                                >
                                                    {issue.status === 'open' ? '待解決' :
                                                        issue.status === 'in-progress' ? '處理中' : '已解決'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="max-w-xs overflow-hidden">
                                                    <p className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2" title={issue.description}>
                                                        {issue.description}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                {issue.type === 'quality' ? '品質' :
                                                    issue.type === 'safety' ? '安全' :
                                                        issue.type === 'progress' ? '進度' : '其他'}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <span className={`
                                                    ${issue.severity === 'high' ? 'text-red-600 dark:text-red-400' :
                                                        issue.severity === 'medium' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'}
                                                `}>
                                                    {issue.severity === 'high' ? '高' :
                                                        issue.severity === 'medium' ? '中' : '低'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">{issue.assignedTo || "-"}</td>
                                            <td className="px-4 py-4 whitespace-nowrap text-gray-900 dark:text-gray-100">
                                                {issue.dueDate && typeof issue.dueDate.toDate === "function"
                                                    ? issue.dueDate.toDate().toLocaleDateString()
                                                    : "-"}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className="flex space-x-2">
                                                    {issue.status !== 'open' && (
                                                        <button
                                                            onClick={() => updateIssueStatus(issue.id, 'open')}
                                                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-md hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 transition-colors duration-200"
                                                        >
                                                            標為待解決
                                                        </button>
                                                    )}
                                                    {issue.status !== 'in-progress' && (
                                                        <button
                                                            onClick={() => updateIssueStatus(issue.id, 'in-progress')}
                                                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-md hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-200 dark:hover:bg-yellow-800 transition-colors duration-200"
                                                        >
                                                            標為處理中
                                                        </button>
                                                    )}
                                                    {issue.status !== 'resolved' && (
                                                        <button
                                                            onClick={() => updateIssueStatus(issue.id, 'resolved')}
                                                            className="inline-flex items-center px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-md hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800 transition-colors duration-200"
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
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                            <div className="flex flex-col items-center">
                                                <svg className="w-12 h-12 mb-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                {issues && issues.length > 0 ? "沒有符合篩選條件的問題" : "暫無問題記錄"}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
}
