/**
 * 專案資訊頁面組件
 *
 * 整合專案資訊顯示、編輯和工作包管理功能
 */

'use client';

import { useState, useEffect } from 'react';

import { collection, query, getDocs, db } from '@/lib/firebase-client';
import type { Project } from '@/modules/projects/types/project';
import type { AppUser } from '@/types/auth';
import { cn, cardStyles, buttonStyles } from '@/utils/classNameUtils';
import { logError, safeAsync, retry } from '@/utils/errorUtils';

import WorkpackageList from '../work-packages/WorkpackageList';
import ProjectEditModal from './ProjectEditModal';
import ProjectInfoDisplay from './ProjectInfoDisplay';

interface ProjectInfoPageProps {
  project: Project;
  projectId: string;
}

export default function ProjectInfoPage({ project, projectId }: ProjectInfoPageProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [eligibleUsers, setEligibleUsers] = useState<{
    costControllers: AppUser[];
    supervisors: AppUser[];
    safetyOfficers: AppUser[];
    managers: AppUser[];
  }>({
    costControllers: [],
    supervisors: [],
    safetyOfficers: [],
    managers: [],
  });

  useEffect(() => {
    const fetchEligibleUsers = async () => {
      try {
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await retry(() => getDocs(usersQuery), 3, 1000);
        
        const users = usersSnapshot.docs.map(doc => ({
          uid: doc.id,
          ...doc.data(),
        })) as AppUser[];

        setEligibleUsers({
          costControllers: users.filter(user => user.role === 'costController'),
          supervisors: users.filter(user => user.role === 'supervisor'),
          safetyOfficers: users.filter(user => user.role === 'safetyOfficer'),
          managers: users.filter(user => user.role === 'manager'),
        });
      } catch (error) {
        logError(error, { operation: 'fetch_eligible_users' });
      }
    };

    fetchEligibleUsers();
  }, []);

  const handleSave = () => {
    // 重新載入專案資料
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* 專案資訊顯示 */}
      <div className={cardStyles.container}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">專案資訊</h2>
          <button
            onClick={() => setIsEditing(true)}
            className={buttonStyles.primary}
          >
            編輯專案
          </button>
        </div>
        
        <ProjectInfoDisplay 
          project={project} 
          eligibleUsers={eligibleUsers} 
        />
      </div>

      {/* 工作包列表 */}
      <div className={cardStyles.container}>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">工作包管理</h2>
        <WorkpackageList 
          workpackages={project.workpackages || []} 
          projectId={projectId} 
        />
      </div>

      {/* 編輯彈窗 */}
      <ProjectEditModal
        project={project}
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        onSave={handleSave}
        eligibleUsers={eligibleUsers}
      />
    </div>
  );
} 