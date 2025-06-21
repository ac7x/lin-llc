/**
 * 專案列表頁面
 * 
 * 顯示所有專案的列表，包括：
 * - 專案搜尋和篩選
 * - 專案統計資訊
 * - 專案狀態管理
 */

'use client';

import { useEffect, useState } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection } from 'firebase/firestore';
import { db } from '@/lib/firebase-client';
import { LoadingSpinner, DataLoader, PageContainer, PageHeader } from '@/app/test-projects/components/common';
import { ProjectsTable, ProjectStats } from '@/app/test-projects/components/dashboard';
import type { Project } from '@/app/test-projects/types/project';

interface ProjectWithId extends Project {
  id: string;
}

export default function ProjectPage() {
  const [projects, setProjects] = useState<ProjectWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [projectsSnapshot] = useCollection(collection(db, 'projects'));

  useEffect(() => {
    const fetchProject = async () => {
      if (!projectsSnapshot) return;

      setLoading(true);
      setError(null);

      try {
        const projectsData = projectsSnapshot.docs.map(doc => ({
          ...doc.data() as Project,
          id: doc.id,
        }));
        setProjects(projectsData);
      } catch (err) {
        setError('載入專案失敗');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectsSnapshot]);

  return (
    <PageContainer>
      <PageHeader 
        title="專案列表" 
        subtitle="管理所有專案"
      />

      <DataLoader
        loading={loading}
        error={error ? new Error(error) : null}
        data={projects}
      >
        {(data) => (
          <div className="space-y-6">
            <ProjectStats stats={{
              totalProjects: data.length,
              activeProjects: data.filter(p => p.status === 'in-progress').length,
              completedProjects: data.filter(p => p.status === 'completed').length,
              onHoldProjects: data.filter(p => p.status === 'on-hold').length,
              overdueProjects: 0,
              totalQualityIssues: 0,
              averageQualityScore: 8.5,
            }} />
            
            <ProjectsTable 
              projects={data} 
              showAdvancedColumns={true}
            />
          </div>
        )}
      </DataLoader>
    </PageContainer>
  );
}
