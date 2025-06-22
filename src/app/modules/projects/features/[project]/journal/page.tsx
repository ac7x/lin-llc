/**
 * 專案日誌管理頁面
 * 
 * 管理專案日誌和進度記錄，包括：
 * - 日誌列表
 * - 新增日誌
 * - 日誌分類
 * - 進度追蹤
 * - 照片上傳
 * - 天氣資訊
 */

'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { LoadingSpinner, DataLoader, PageContainer, PageHeader } from '@/app/modules/projects/components/common';
import { JournalForm, JournalHistory } from '@/app/modules/projects/components/journal';
import { JournalService } from '@/app/modules/projects/services';
import type { Project, DailyReport } from '@/app/modules/projects/types';
import { logError, safeAsync, retry } from '@/utils/errorUtils';
import { projectStyles } from '@/app/modules/projects/styles';

interface ProjectWithId extends Project {
  id: string;
}

// 天氣資料介面
interface WeatherData {
  weather: string;
  temperature: number;
  rainfall: number;
}

export default function ProjectJournalPage() {
  const params = useParams();
  const projectId = params.project as string;
  
  const [project, setProject] = useState<ProjectWithId | null>(null);
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showJournalForm, setShowJournalForm] = useState(false);
  const [editingReport, setEditingReport] = useState<DailyReport | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);

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
  const loadReports = async () => {
    if (!projectId) return;

    try {
      const reportsData = await JournalService.getDailyReportsByProject(projectId);
      setReports(reportsData);
    } catch (err) {
      logError(err as Error, { operation: 'fetch_reports', projectId });
    }
  };

  // 模擬天氣資料載入
  const loadWeatherData = async () => {
    // 這裡可以整合真實的天氣 API
    setWeatherData({
      weather: '晴天',
      temperature: 25,
      rainfall: 0,
    });
  };

  useEffect(() => {
    loadProject();
    loadWeatherData();
  }, [projectId]);

  useEffect(() => {
    if (project) {
      loadReports();
    }
  }, [project]);

  // 處理新增日誌
  const handleCreateReport = async (reportData: any) => {
    try {
      await loadReports(); // 重新載入日誌列表
      setShowJournalForm(false);
    } catch (err) {
      logError(err as Error, { operation: 'create_report', projectId });
    }
  };

  // 處理編輯日誌
  const handleEditReport = async (reportData: any) => {
    try {
      await loadReports(); // 重新載入日誌列表
      setShowJournalForm(false);
      setEditingReport(null);
    } catch (err) {
      logError(err as Error, { operation: 'edit_report', projectId });
    }
  };

  // 處理刪除日誌
  const handleDeleteReport = async (reportId: string) => {
    if (!projectId) return;
    
    try {
      await JournalService.deleteDailyReport(reportId);
      await loadReports(); // 重新載入日誌列表
    } catch (err) {
      logError(err as Error, { operation: 'delete_report', projectId });
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
        data={reports}
      >
        {(data) => (
          <JournalHistory
            reports={data}
            onViewDetails={(reportId) => {
              // 處理查看詳情
              console.log('查看日誌詳情:', reportId);
            }}
            onEdit={(report) => {
              setEditingReport(report);
              setShowJournalForm(true);
            }}
            onDelete={handleDeleteReport}
          />
        )}
      </DataLoader>

      {/* 日誌表單模態框 */}
      {showJournalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <JournalForm
              projectId={projectId}
              projectData={project}
              weatherData={weatherData}
              journalEntry={editingReport as any}
              onSubmit={editingReport ? handleEditReport : handleCreateReport}
              onCancel={() => {
                setShowJournalForm(false);
                setEditingReport(null);
              }}
              isSubmitting={loading}
            />
          </div>
        </div>
      )}
    </PageContainer>
  );
}
