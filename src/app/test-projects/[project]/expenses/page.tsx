/**
 * 專案費用管理頁面
 * 
 * 管理專案相關費用和支出，包括：
 * - 費用列表
 * - 新增費用
 * - 費用分類
 * - 費用報表
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { LoadingSpinner, DataLoader, PageContainer, PageHeader } from '@/app/test-projects/components/common';
import { ExpenseForm, ExpenseList } from '@/app/test-projects/components/expenses';
import type { Project, Expense } from '@/app/test-projects/types';
import { logError, safeAsync, retry } from '@/utils/errorUtils';
import { projectStyles } from '@/app/test-projects/styles';

interface ProjectWithId extends Project {
  id: string;
}

export default function ProjectExpensesPage() {
  const params = useParams();
  const projectId = params.project as string;
  
  const [project, setProject] = useState<ProjectWithId | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // 載入專案資料
  const loadProject = async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    await safeAsync(async () => {
      const projectDoc = await retry(() => getDoc(doc(db, 'projects', projectId)), 3, 1000);
      
      if (!projectDoc.exists()) {
        throw new Error('專案不存在');
      }

      const projectData = projectDoc.data() as Project;
      setProject({
        ...projectData,
        id: projectDoc.id,
      });
    }, (error) => {
      setError(error instanceof Error ? error.message : '載入專案失敗');
      logError(error, { operation: 'fetch_project', projectId });
    });

    setLoading(false);
  };

  // 載入費用資料
  const loadExpenses = async () => {
    if (!projectId) return;

    try {
      // 這裡需要實作費用服務的載入方法
      // const expensesData = await ExpenseService.getExpensesByProject(projectId);
      // setExpenses(expensesData);
      setExpenses([]); // 暫時設為空陣列
    } catch (err) {
      logError(err as Error, { operation: 'fetch_expenses', projectId });
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (project) {
      loadExpenses();
    }
  }, [project]);

  // 處理新增費用
  const handleCreateExpense = async (expenseData: Omit<Expense, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!projectId) return;
    
    try {
      // 這裡需要實作費用服務的創建方法
      await loadExpenses();
      setShowExpenseForm(false);
      setEditingExpense(null);
    } catch (err) {
      logError(err as Error, { operation: 'create_expense', projectId });
    }
  };

  // 處理編輯費用
  const handleEditExpense = async (expenseData: Partial<Expense>) => {
    if (!editingExpense) return;
    
    try {
      // 這裡需要實作費用服務的更新方法
      await loadExpenses();
      setShowExpenseForm(false);
      setEditingExpense(null);
    } catch (err) {
      logError(err as Error, { operation: 'update_expense', projectId });
    }
  };

  // 處理刪除費用
  const handleDeleteExpense = async (expenseId: string) => {
    if (!projectId) return;
    
    try {
      // 這裡需要實作費用服務的刪除方法
      await loadExpenses();
    } catch (err) {
      logError(err as Error, { operation: 'delete_expense', projectId });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            載入失敗
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {error || '專案不存在'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title={`${project.projectName} - 費用管理`}
        subtitle='管理專案相關費用和支出'
      >
        <button
          onClick={() => setShowExpenseForm(true)}
          className={projectStyles.button.primary}
        >
          新增費用
        </button>
      </PageHeader>

      <DataLoader
        loading={loading}
        error={error ? new Error(error) : null}
        data={expenses}
      >
        {(data) => (
          <ExpenseList
            expenses={data}
            projectId={projectId}
            onEdit={(expense) => {
              setEditingExpense(expense);
              setShowExpenseForm(true);
            }}
            onDelete={handleDeleteExpense}
            onAdd={() => setShowExpenseForm(true)}
            isLoading={loading}
          />
        )}
      </DataLoader>

      {/* 費用表單模態框 */}
      {showExpenseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <ExpenseForm
              expense={editingExpense || undefined}
              projectId={projectId}
              onSubmit={editingExpense ? handleEditExpense : handleCreateExpense}
              onCancel={() => {
                setShowExpenseForm(false);
                setEditingExpense(null);
              }}
              isLoading={loading}
            />
          </div>
        </div>
      )}
    </PageContainer>
  );
}
