/**
 * 專案支出管理頁面
 * 
 * 提供專案支出的管理功能，包含：
 * - 支出記錄
 * - 支出分類
 * - 支出審核
 * - 支出報表
 * - 預算追蹤
 */

"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useDocument } from "react-firebase-hooks/firestore";
import { Timestamp } from "firebase/firestore";
import { formatLocalDate } from "@/utils/dateUtils";
import { nanoid } from "nanoid";
import { ExpenseData, ExpenseItem, Workpackage } from "@/types/project";
import { BaseWithDates } from "@/types/common";

export default function ProjectExpensesPage() {
    const params = useParams();
    const projectId = params?.project as string;
    const { db, doc, updateDoc, user } = useAuth();
    const [projectDoc, loading] = useDocument(projectId ? doc(db, "projects", projectId) : null);
    const [showModal, setShowModal] = useState(false);
    const [editingExpense, setEditingExpense] = useState<ExpenseData | null>(null);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [expenses, setExpenses] = useState<ExpenseData[]>([]);

    const [newExpense, setNewExpense] = useState<Partial<ExpenseData>>({
        expenseNumber: `EXP-${formatLocalDate(new Date())}-${nanoid(4)}`,
        expenseDate: Timestamp.now(),
        type: "支出",
        items: [],
        totalAmount: 0,
        status: "draft",
        notes: "",
    });

    const [newExpenseItem, setNewExpenseItem] = useState<Partial<ExpenseItem>>({
        description: "",
        quantity: 1,
        unitPrice: 0,
        amount: 0,
        workpackageId: "",
    });

    // 初始化或更新 expenses 陣列
    useEffect(() => {
        if (projectDoc?.data()) {
            const projectData = projectDoc.data();
            const projectExpenses = projectData?.expenses || [];
            setExpenses(Array.isArray(projectExpenses) ? projectExpenses : []);
        }
    }, [projectDoc]);

    const totalAmount = useMemo(() => {
        return expenses.reduce((sum, expense) => sum + expense.totalAmount, 0);
    }, [expenses]);

    const handleAddExpenseItem = () => {
        if (!newExpenseItem.description || newExpenseItem.quantity === 0 || newExpenseItem.unitPrice === 0) {
            setMessage("請填寫完整的項目資訊");
            return;
        }

        if (newExpense.type === "支出" && !newExpenseItem.workpackageId) {
            setMessage("請選擇關聯工作包");
            return;
        }

        const amount = (newExpenseItem.quantity || 0) * (newExpenseItem.unitPrice || 0);
        const now = Timestamp.now();
        const item: ExpenseItem & BaseWithDates = {
            expenseItemId: nanoid(8),
            description: newExpenseItem.description || "",
            quantity: newExpenseItem.quantity || 0,
            unitPrice: newExpenseItem.unitPrice || 0,
            amount: amount,
            workpackageId: newExpenseItem.workpackageId || "",
            createdAt: now,
            updatedAt: now
        };

        setNewExpense(prev => ({
            ...prev,
            items: [...(prev.items || []), item],
            totalAmount: (prev.totalAmount || 0) + amount,
        }));

        setNewExpenseItem({
            description: "",
            quantity: 1,
            unitPrice: 0,
            amount: 0,
            workpackageId: "",
        });
    };

    const handleRemoveExpenseItem = (itemId: string) => {
        setNewExpense(prev => {
            const items = prev.items || [];
            const itemToRemove = items.find(item => item.expenseItemId === itemId);
            return {
                ...prev,
                items: items.filter(item => item.expenseItemId !== itemId),
                totalAmount: (prev.totalAmount || 0) - (itemToRemove?.amount || 0),
            };
        });
    };

    const handleSaveExpense = async () => {
        if (!user || !projectDoc?.data() || !projectId) {
            setMessage("請先登入或專案不存在");
            return;
        }

        if (!newExpense.items || newExpense.items.length === 0) {
            setMessage("請至少新增一個支出項目");
            return;
        }

        setSaving(true);
        try {
            const now = Timestamp.now();
            const projectData = projectDoc.data();
            
            // 確保所有項目都有正確的 workpackageId 和時間戳
            const validatedItems = newExpense.items.map(item => ({
                ...item,
                createdAt: item.createdAt || now,
                updatedAt: now
            }));

            const expenseData: ExpenseData = {
                expenseId: editingExpense?.expenseId || nanoid(8),
                expenseNumber: newExpense.expenseNumber || `EXP-${formatLocalDate(now)}-${nanoid(4)}`,
                expenseDate: newExpense.expenseDate || now,
                clientName: projectData?.clientName || "",
                clientContact: projectData?.clientContact || "",
                clientPhone: projectData?.clientPhone || "",
                clientEmail: projectData?.clientEmail || "",
                projectId: projectId,
                type: newExpense.type || "支出",
                items: validatedItems,
                totalAmount: newExpense.totalAmount || 0,
                relatedOrderId: newExpense.relatedOrderId || "",
                relatedContractId: newExpense.relatedContractId || "",
                createdAt: editingExpense?.createdAt || now,
                updatedAt: now,
                status: newExpense.status || "draft",
                notes: newExpense.notes || "",
                expenseName: projectData?.projectName || ""
            };

            let updatedExpenses: ExpenseData[];

            if (editingExpense) {
                updatedExpenses = expenses.map((exp: ExpenseData) => 
                    exp.expenseId === editingExpense.expenseId ? expenseData : exp
                );
                setMessage("已更新費用");
            } else {
                updatedExpenses = [...expenses, expenseData];
                setMessage("已新增費用");
            }

            // 先更新本地狀態
            setExpenses(updatedExpenses);
            
            // 更新 Firestore
            await updateDoc(doc(db, "projects", projectId), {
                expenses: updatedExpenses
            });

            // 先關閉模態視窗
            setShowModal(false);
            // 然後重置表單
            resetForm();
        } catch (error) {
            console.error("儲存失敗:", error);
            setMessage("儲存失敗: " + (error instanceof Error ? error.message : String(error)));
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteExpense = async (expenseId: string) => {
        if (!confirm("確定要刪除此費用？") || !projectDoc?.data() || !projectId) return;
        try {
            const updatedExpenses = expenses.filter((exp: ExpenseData) => exp.expenseId !== expenseId);
            setExpenses(updatedExpenses);
            await updateDoc(doc(db, "projects", projectId), {
                expenses: updatedExpenses
            });
            setMessage("已刪除費用");
        } catch (error) {
            setMessage("刪除失敗: " + (error instanceof Error ? error.message : String(error)));
        }
    };

    const handleEditExpense = (expense: ExpenseData) => {
        setEditingExpense(expense);
        setNewExpense({
            expenseNumber: expense.expenseNumber,
            expenseDate: expense.expenseDate,
            type: expense.type,
            items: expense.items,
            totalAmount: expense.totalAmount,
            relatedOrderId: expense.relatedOrderId,
            relatedContractId: expense.relatedContractId,
            status: expense.status,
            notes: expense.notes,
        });
        setShowModal(true);
    };

    const resetForm = () => {
        setNewExpense({
            expenseNumber: `EXP-${formatLocalDate(new Date())}-${nanoid(4)}`,
            expenseDate: Timestamp.now(),
            type: "支出",
            items: [],
            totalAmount: 0,
            status: "draft",
            notes: "",
        });
        setNewExpenseItem({
            description: "",
            quantity: 1,
            unitPrice: 0,
            amount: 0,
            workpackageId: "",
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
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">費用編號</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">日期</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">類型</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">狀態</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">金額</th>
                            <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
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
                                <tr key={expense.expenseId} className="hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200">
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{expense.expenseNumber}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                        {expense.expenseDate ? formatLocalDate(expense.expenseDate) : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{expense.type}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{expense.status}</td>
                                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                                        NT$ {expense.totalAmount.toLocaleString()}
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
                                                onClick={() => handleDeleteExpense(expense.expenseId)}
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
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-2xl">
                        <h2 className="text-xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">
                            {editingExpense ? "編輯費用" : "新增費用"}
                        </h2>
                        <form onSubmit={(e) => { e.preventDefault(); handleSaveExpense(); }} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">費用編號</label>
                                    <div className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                                        {newExpense.expenseNumber}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">日期</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                        value={newExpense.expenseDate ? formatLocalDate(newExpense.expenseDate) : formatLocalDate(new Date())}
                                        onChange={e => setNewExpense({ ...newExpense, expenseDate: Timestamp.fromDate(new Date(e.target.value)) })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">類型</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                        value={newExpense.type || "支出"}
                                        onChange={e => setNewExpense({ ...newExpense, type: e.target.value as "請款" | "支出" })}
                                        required
                                    >
                                        <option value="支出">支出</option>
                                        <option value="請款">請款</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">狀態</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                        value={newExpense.status || "draft"}
                                        onChange={e => setNewExpense({ ...newExpense, status: e.target.value as "draft" | "issued" | "cancelled" })}
                                        required
                                    >
                                        <option value="draft">草稿</option>
                                        <option value="issued">已發行</option>
                                        <option value="cancelled">已取消</option>
                                    </select>
                                </div>
                            </div>

                            {newExpense.type === "支出" && (
                                <div className="mt-4">
                                    <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">關聯工作包</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                        value={newExpenseItem.workpackageId}
                                        onChange={e => {
                                            const workpackageId = e.target.value;
                                            setNewExpenseItem(prev => ({
                                                ...prev,
                                                workpackageId
                                            }));
                                        }}
                                    >
                                        <option value="">請選擇工作包</option>
                                        {projectDoc.data()?.workpackages?.map((wp: Workpackage) => (
                                            <option key={wp.id} value={wp.id}>{wp.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-gray-100">支出項目</h3>
                                <div className="space-y-4">
                                    {newExpense.items?.map((item) => (
                                        <div key={item.expenseItemId} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                            <div className="flex-1">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.description}</div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    數量: {item.quantity} × NT$ {item.unitPrice.toLocaleString()} = NT$ {item.amount.toLocaleString()}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                                onClick={() => handleRemoveExpenseItem(item.expenseItemId)}
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">描述</label>
                                            <input
                                                type="text"
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                                value={newExpenseItem.description || ""}
                                                onChange={e => setNewExpenseItem({ ...newExpenseItem, description: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">數量</label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                                value={newExpenseItem.quantity || 0}
                                                onChange={e => {
                                                    const quantity = Number(e.target.value);
                                                    setNewExpenseItem({
                                                        ...newExpenseItem,
                                                        quantity,
                                                        amount: quantity * (newExpenseItem.unitPrice || 0)
                                                    });
                                                }}
                                                min="0"
                                                step="1"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">單價</label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                                value={newExpenseItem.unitPrice || 0}
                                                onChange={e => {
                                                    const unitPrice = Number(e.target.value);
                                                    setNewExpenseItem({
                                                        ...newExpenseItem,
                                                        unitPrice,
                                                        amount: (newExpenseItem.quantity || 0) * unitPrice
                                                    });
                                                }}
                                                min="0"
                                                step="0.01"
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                                        onClick={handleAddExpenseItem}
                                    >
                                        新增項目
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">備註</label>
                                <textarea
                                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200"
                                    value={newExpense.notes || ""}
                                    onChange={e => setNewExpense({ ...newExpense, notes: e.target.value })}
                                    rows={3}
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