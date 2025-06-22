/**
 * 專案 Gemini 頁面
 * 
 * 提供專案相關的 AI 分析功能
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy } from 'firebase/firestore';

import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase-client';
import { PageContainer, PageHeader, LoadingSpinner, DataLoader } from '../../../components/common';
import { ProjectGeminiChat, ProjectAnalysisDisplay } from '../../../components/gemini';
import { ProjectService, WorkPackageService, IssueService } from '../../../services';
import type { Project, WorkPackage, IssueRecord } from '../../../types';

export default function ProjectGeminiPage() {
  const params = useParams();
  const { user, loading: authLoading } = useAuth();
  const projectId = params.project as string;

  const [project, setProject] = useState<Project | null>(null);
  const [workPackages, setWorkPackages] = useState<WorkPackage[]>([]);
  const [issues, setIssues] = useState<IssueRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'chat' | 'analysis'>('chat');

  // 取得專案資料
  const [projectSnapshot] = useCollection(
    query(collection(db, 'projects'), where('__name__', '==', projectId))
  );

  // 取得工作包資料
  const [workPackagesSnapshot] = useCollection(
    query(
      collection(db, 'projects', projectId, 'workPackages'),
      orderBy('createdAt', 'desc')
    )
  );

  // 取得問題資料
  const [issuesSnapshot] = useCollection(
    query(
      collection(db, 'projects', projectId, 'issues'),
      orderBy('createdAt', 'desc')
    )
  );

  // 處理專案資料
  useEffect(() => {
    if (projectSnapshot && !projectSnapshot.empty) {
      const projectData = projectSnapshot.docs[0].data() as Project;
      setProject({ ...projectData, id: projectSnapshot.docs[0].id });
    }
  }, [projectSnapshot]);

  // 處理工作包資料
  useEffect(() => {
    if (workPackagesSnapshot) {
      const workPackagesData = workPackagesSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as WorkPackage[];
      setWorkPackages(workPackagesData);
    }
  }, [workPackagesSnapshot]);

  // 處理問題資料
  useEffect(() => {
    if (issuesSnapshot) {
      const issuesData = issuesSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as IssueRecord[];
      setIssues(issuesData);
    }
  }, [issuesSnapshot]);

  // 處理載入狀態
  useEffect(() => {
    if (projectSnapshot && workPackagesSnapshot && issuesSnapshot) {
      setLoading(false);
    }
  }, [projectSnapshot, workPackagesSnapshot, issuesSnapshot]);

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            需要登入
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            請先登入以查看專案 AI 分析
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageContainer>
      <PageHeader 
        title="專案 AI 分析" 
        subtitle="使用 AI 分析專案狀況、風險和進度"
      />

      <DataLoader
        loading={loading}
        error={error ? new Error(error) : null}
        data={project ? [project] : []}
      >
        {(projectData) => {
          const project = projectData[0] as Project;
          return (
            <div className="space-y-6">
              {/* 標籤導航 */}
              <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="flex space-x-8">
                  <button
                    onClick={() => setActiveTab('chat')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'chat'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    AI 對話
                  </button>
                  <button
                    onClick={() => setActiveTab('analysis')}
                    className={`py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'analysis'
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    AI 分析
                  </button>
                </nav>
              </div>

              {/* 內容區域 */}
              {activeTab === 'chat' && (
                <div className="h-[calc(100vh-200px)]">
                  <ProjectGeminiChat
                    project={project}
                    workPackages={workPackages}
                    issues={issues}
                    className="h-full"
                  />
                </div>
              )}

              {activeTab === 'analysis' && (
                <ProjectAnalysisDisplay
                  project={project}
                  workPackages={workPackages}
                  issues={issues}
                />
              )}
            </div>
          );
        }}
      </DataLoader>
    </PageContainer>
  );
}
