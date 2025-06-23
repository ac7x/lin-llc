/**
 * 儀表板頁面
 *
 * 使用模組化元件和自訂 Hook 組裝而成，實現了 UI 與業務邏輯的完全分離。
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Unauthorized } from '@/components/common/Unauthorized';
import { ROLE_NAMES } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';

import { PersonnelPieChart } from './components/charts/PersonnelPieChart';
import { ProgressRadarChart } from './components/charts/ProgressRadarChart';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { ProjectAnalysisCard } from './components/layout/ProjectAnalysisCard';
import { ActivityLog } from './components/logs/ActivityLog';
import { StatGrid } from './components/stats/StatGrid';
import { useProjectData } from './hooks/useProjectData';

// 載入狀態組件
const LoadingSpinner = () => (
  <div className='flex items-center justify-center min-h-screen'>
    <div className='animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500'></div>
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading, hasPermission } = useAuth();
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  // 使用核心 Hook 獲取所有儀表板數據
  const {
    statsList,
    roleData,
    workpackageProgressData,
    projectProgressData,
    efficiencyTrendData,
    projects,
    totalUsers,
    loading: dataLoading,
    error: dataError,
  } = useProjectData(selectedProject);

  // 在取得專案列表後，預設選擇第一個專案
  useEffect(() => {
    if (!selectedProject && projects.length > 0) {
      setSelectedProject(projects[0].projectName);
    }
  }, [projects, selectedProject]);

  // 身份驗證與頁面權限檢查
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [authLoading, user, router]);

  if (authLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  if (!hasPermission('dashboard')) {
    const roleName = user.currentRole ? ROLE_NAMES[user.currentRole] : '未知角色';
    return <Unauthorized message={`您目前的角色 (${roleName}) 沒有權限訪問儀表板`} />;
  }

  return (
    <DashboardLayout>
      <div className='space-y-6'>
        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          <div className='lg:col-span-1'>
            <PersonnelPieChart
              data={roleData}
              totalUsers={totalUsers}
              loading={dataLoading.users}
              error={dataError.users}
            />
          </div>
          <div className='lg:col-span-2'>
            <StatGrid stats={statsList.map(s => ({ ...s, value: s.value?.toString() }))} />
          </div>
        </div>

        <ProgressRadarChart data={workpackageProgressData} />

        <ProjectAnalysisCard
          projects={projects}
          selectedProject={selectedProject}
          onProjectChange={setSelectedProject}
          progressData={projectProgressData}
          efficiencyTrendData={efficiencyTrendData}
        />

        <ActivityLog />
      </div>
    </DashboardLayout>
  );
}

