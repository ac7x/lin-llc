"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useDocument } from "react-firebase-hooks/firestore";
import { Timestamp } from "firebase/firestore";
import { format } from "date-fns";
import { zhTW } from "date-fns/locale";
import { nanoid } from "nanoid";
import { Expense } from "@/types/project";

export default function ProjectExpensesPage() {
    const params = useParams();
    const projectId = params?.project as string;
    const { db, doc, updateDoc, user } = useAuth();
    const [projectDoc, loading] = useDocument(projectId ? doc(db, "projects", projectId) : null);
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [expenses, setExpenses] = useState<Expense[]>([]);

    const [newExpense, setNewExpense] = useState({
        amount: 0,
        description: "",
        category: "材料",
        date: new Date(),
    });

    const categories = [
        "材料", "設備", "人工", "運輸", "其他"
    ];

    // 初始化或更新 expenses 陣列
    useEffect(() => {
        if (projectDoc?.data()) {
            const projectData = projectDoc.data();
            const projectExpenses = projectData?.expenses || [];
            setExpenses(Array.isArray(projectExpenses) ? projectExpenses : []);
        }
    }, [projectDoc]);

    const totalAmount = useMemo(() => {
        return expenses.reduce((sum, expense) => sum + expense.amount, 0);
    }, [expenses]);

    const handleSaveExpense = async () => {
        if (!user || !projectDoc?.data() || !projectId) {
            setMessage("請先登入或專案不存在");
            return;
        }

        setSaving(true);
        try {
            const now = Timestamp.now();
            const expenseData: Expense = {
                id: editingExpense?.id || nanoid(8),
                amount: newExpense.amount,
                description: newExpense.description,
                category: newExpense.category,
                date: Timestamp.fromDate(newExpense.date),
                createdAt: now,
                createdBy: user.uid,
                updatedAt: now,
                updatedBy: user.uid,
            };

            let updatedExpenses: Expense[];

            if (editingExpense) {
                // 更新現有費用
                updatedExpenses = expenses.map((exp: Expense) => 
                    exp.id === editingExpense.id ? expenseData : exp
                );
                setMessage("已更新費用");
            } else {
                // 新增費用
                updatedExpenses = [...expenses, expenseData];
                setMessage("已新增費用");
            }

            // 更新本地狀態
            setExpenses(updatedExpenses);

            // 更新 Firestore
            await updateDoc(doc(db, "projects", projectId), {
                expenses: updatedExpenses
            });

            setShowModal(false);
            resetForm();
        } catch (error) {
            setMessage("儲存失敗: " + (error instanceof Error ? error.message : String(error)));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteExpense = async (expenseId: string) => {
        if (!confirm("確定要刪除此費用？") || !projectDoc?.data() || !projectId) return;
        try {
            const updatedExpenses = expenses.filter((exp: Expense) => exp.id !== expenseId);
            
            // 更新本地狀態
            setExpenses(updatedExpenses);
            
            // 更新 Firestore
            await updateDoc(doc(db, "projects", projectId), {
                expenses: updatedExpenses
            });
            
            setMessage("已刪除費用");
        } catch (error) {
            setMessage("刪除失敗: " + (error instanceof Error ? error.message : String(error)));
        }
    };

    const handleEditExpense = (expense: Expense) => {
        setEditingExpense(expense);
        setNewExpense({
            amount: expense.amount,
            description: expense.description,
            category: expense.category,
            date: expense.date.toDate(),
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setNewExpense({
            amount: 0,
            description: "",
            category: "材料",
            date: new Date(),
        });
        setEditingExpense(null);
    };

    const handleCloseModal = () => {
        resetForm();
        setShowModal(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!projectDoc?.exists()) {
        return (
            <div className="bg-yellow-50 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg">
                找不到專案
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">費用管理</h2>
                <button
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
                    onClick={() => setShowModal(true)}
                >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    新增費用
                </button>
            </div>

            {message && (
                <div className="mb-6 bg-blue-50 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 p-4 rounded-lg relative">
                    {message}
                    <button
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                        onClick={() => setMessage(null)}
                        aria-label="關閉"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            )}

            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-lg font-medium text-gray-900 dark:text-gray-100">
                    總支出：NT$ {totalAmount.toLocaleString()}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="bg-gray-50 dark:bg-gray-900">
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">日期</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">類別</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">描述</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">金額</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                    <div className="flex flex-col items-center justify-center">
                                        <svg className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        尚無費用記錄
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            expenses.map(expense => (
                                <tr key={expense.id} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200">
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                        {format(expense.date.toDate(), "yyyy-MM-dd", { locale: zhTW })}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{expense.category}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{expense.description}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                        NT$ {expense.amount.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="flex gap-2">
                                            <button
                                                className="p-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                                                onClick={() => handleEditExpense(expense)}
                                                title="編輯"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                className="p-2 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors duration-200"
                                                onClick={() => handleDeleteExpense(expense.id)}
                                                title="刪除"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                            {editingExpense ? "編輯費用" : "新增費用"}
                        </h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleSaveExpense(); }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">日期</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                    value={format(newExpense.date, "yyyy-MM-dd")}
                                    onChange={e => setNewExpense({ ...newExpense, date: new Date(e.target.value) })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">類別</label>
                                <select
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                    value={newExpense.category}
                                    onChange={e => setNewExpense({ ...newExpense, category: e.target.value })}
                                    required
                                >
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">描述</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">金額</label>
                                <input
                                    type="number"
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                    value={newExpense.amount}
                                    onChange={e => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
                                    required
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            儲存中
                                        </span>
                                    ) : "儲存"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
} 