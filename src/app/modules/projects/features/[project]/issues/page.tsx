/**
 * 專案問題管理頁面
 * 
 * 管理專案中的問題和風險，包括：
 * - 問題列表
 * - 新增問題
 * - 問題狀態管理
 * - 問題追蹤
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { LoadingSpinner, DataLoader, PageContainer, PageHeader } from '@/app/modules/projects/components/common';
import { IssueList, IssueForm } from '@/app/modules/projects/components/issues';
import { IssueService } from '@/app/modules/projects/services';
import type { Project, IssueRecord } from '@/app/modules/projects/types';
import { logError, safeAsync, retry } from '@/utils/errorUtils';
import { projectStyles } from '@/app/modules/projects/styles';

interface ProjectWithId extends Project {
  id: string;
}

export default function ProjectIssuesPage() {
  const params = useParams();
  const projectId = params.project as string;
  const [project, setProject] = useState<ProjectWithId | null>(null);
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [editingIssue, setEditingIssue] = useState<IssueRecord | null>(null);

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

  // 載入問題資料
  const loadIssues = async () => {
    if (!projectId) return;

    try {
      const issuesData = await IssueService.getIssuesByProject(projectId);
      setIssues(issuesData);
    } catch (err) {
      logError(err as Error, { operation: 'fetch_issues', projectId });
    }
  };

  useEffect(() => {
    loadProject();
  }, [projectId]);

  useEffect(() => {
    if (project) {
      loadIssues();
    }
  }, [project]);

  // 處理新增問題
  const handleCreateIssue = async (issueData: Omit<IssueRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!projectId) return;
    
    try {
      await IssueService.createIssue(issueData);
      await loadIssues();
      setShowIssueForm(false);
      setEditingIssue(null);
    } catch (err) {
      logError(err as Error, { operation: 'create_issue', projectId });
    }
  };

  // 處理編輯問題
  const handleEditIssue = async (issueData: Partial<IssueRecord>) => {
    if (!editingIssue) return;
    
    try {
      await IssueService.updateIssue(editingIssue.id, issueData);
      await loadIssues();
      setShowIssueForm(false);
      setEditingIssue(null);
    } catch (err) {
      logError(err as Error, { operation: 'update_issue', projectId });
    }
  };

  // 處理刪除問題
  const handleDeleteIssue = async (issueId: string) => {
    if (!projectId) return;
    
    try {
      await IssueService.deleteIssue(issueId);
      await loadIssues();
    } catch (err) {
      logError(err as Error, { operation: 'delete_issue', projectId });
    }
  };

  // 處理問題狀態變更
  const handleIssueStatusChange = async (issueId: string, status: 'open' | 'in-progress' | 'resolved') => {
    if (!projectId) return;
    
    try {
      await IssueService.updateIssue(issueId, { status });
      await loadIssues();
    } catch (err) {
      logError(err as Error, { operation: 'update_issue_status', projectId });
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
        title={`${project.projectName} - 問題管理`}
        subtitle="管理專案中的問題和風險"
      >
        <button
          onClick={() => setShowIssueForm(true)}
          className={projectStyles.button.primary}
        >
          新增問題
        </button>
      </PageHeader>

      <DataLoader
        loading={loading}
        error={error ? new Error(error) : null}
        data={issues}
      >
        {(data) => (
          <IssueList
            issues={data}
            projectId={projectId}
            onEdit={(issue) => {
              setEditingIssue(issue);
              setShowIssueForm(true);
            }}
            onDelete={handleDeleteIssue}
            onAdd={() => setShowIssueForm(true)}
            onStatusChange={handleIssueStatusChange}
            isLoading={loading}
          />
        )}
      </DataLoader>

      {/* 問題表單模態框 */}
      {showIssueForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <IssueForm
              issue={editingIssue || undefined}
              projectId={projectId}
              onSubmit={editingIssue ? handleEditIssue : handleCreateIssue}
              onCancel={() => {
                setShowIssueForm(false);
                setEditingIssue(null);
              }}
              isLoading={loading}
            />
          </div>
        </div>
      )}
    </PageContainer>
  );
}
