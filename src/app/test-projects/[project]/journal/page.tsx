/**
 * 專案日誌管理頁面
 * 
 * 管理專案日誌和進度記錄，包括：
 * - 日誌列表
 * - 新增日誌
 * - 日誌分類
 * - 進度追蹤
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { LoadingSpinner, DataLoader, PageContainer, PageHeader } from '@/app/test-projects/components/common';
import type { Project } from '@/app/test-projects/types';
import { logError, safeAsync, retry } from '@/utils/errorUtils';
import { projectStyles } from '@/app/test-projects/styles';

interface ProjectWithId extends Project {
  id: string;
}

// 簡化的日誌條目型別
interface JournalEntry {
  id: string;
  title: string;
  content?: string;
  date: Date;
  author?: string;
  category?: string;
  priority?: number;
  tags?: string[];
}

export default function ProjectJournalPage() {
  const params = useParams();
  const projectId = params.project as string;
  
  const [project, setProject] = useState<ProjectWithId | null>(null);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [editingJournal, setEditingJournal] = useState<JournalEntry | null>(null);

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

  // 載入日誌資料
  const loadJournals = async () => {
    if (!projectId) return;

    try {
      // TODO: 實作從日誌服務獲取資料
      // const journalsData = await JournalService.getDailyReportsByProject(projectId);
      // setJournals(journalsData);
      setJournals([]);
    } catch (err) {
      logError(err as Error, { operation: 'fetch_journals', projectId });
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (project) {
      loadJournals();
    }
  }, [project]);

  // 處理刪除日誌
  const handleDeleteJournal = async (journalId: string) => {
    if (!projectId) return;
    
    try {
      setJournals(prev => prev.filter(journal => journal.id !== journalId));
    } catch (err) {
      logError(err as Error, { operation: 'delete_journal', projectId });
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
        title={`${project.projectName} - 專案日誌`}
        subtitle='記錄專案進度和重要事件'
      >
        <button
          onClick={() => setShowJournalForm(true)}
          className={projectStyles.button.primary}
        >
          新增日誌
        </button>
      </PageHeader>

      <DataLoader
        loading={loading}
        error={error ? new Error(error) : null}
        data={journals}
      >
        {(data) => (
          <div className="space-y-4">
            {data.map((journal) => (
              <div key={journal.id} className={projectStyles.card.base}>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      {journal.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {journal.date.toLocaleDateString('zh-TW')} - {journal.author}
                    </p>
                    {journal.content && (
                      <p className="text-gray-700 dark:text-gray-300 mt-2">
                        {journal.content}
                      </p>
                    )}
                    {journal.tags && journal.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {journal.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/20 dark:text-blue-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => handleDeleteJournal(journal.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                    >
                      刪除
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DataLoader>

      {/* 簡單的新增日誌表單 */}
      {showJournalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
              新增日誌
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  標題
                </label>
                <input
                  type="text"
                  className={projectStyles.form.input}
                  placeholder="輸入日誌標題"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  內容
                </label>
                <textarea
                  className={projectStyles.form.input}
                  rows={4}
                  placeholder="輸入日誌內容"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={() => setShowJournalForm(false)}
                  className={projectStyles.button.outline}
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    // 這裡可以實作新增日誌的邏輯
                    setShowJournalForm(false);
                  }}
                  className={projectStyles.button.primary}
                >
                  新增
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}
