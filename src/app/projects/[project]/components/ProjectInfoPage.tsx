/**
 * 專案資訊頁面組件
 *
 * 整合專案資訊顯示、編輯和工作包管理功能
 */

'use client';

import { useState, useEffect } from 'react';

import type { Project } from '@/app/projects/types/project';
import { collection, query, getDocs, db } from '@/lib/firebase-client';
import type { AppUser } from '@/types/auth';
import { logError, safeAsync, retry } from '@/utils/errorUtils';

import ProjectEditModal from './ProjectEditModal';
import ProjectInfoDisplay from './ProjectInfoDisplay';
import WorkpackageList from './WorkpackageList';


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
    const fetchMembers = async () => {
      await safeAsync(async () => {
        const membersRef = collection(db, 'members');
        const membersSnap = await retry(() => getDocs(query(membersRef)), 3, 1000);

        const users = membersSnap.docs.map(doc => ({
          uid: doc.id,
          ...doc.data(),
        })) as AppUser[];

        // 根據角色分類用戶
        const categorizedUsers = {
          costControllers: users.filter(
            user => user.roles?.includes('finance') || user.currentRole === 'finance'
          ),
          supervisors: users.filter(
            user => user.roles?.includes('foreman') || user.currentRole === 'foreman'
          ),
          safetyOfficers: users.filter(
            user => user.roles?.includes('safety') || user.currentRole === 'safety'
          ),
          managers: users.filter(
            user => user.roles?.includes('manager') || user.currentRole === 'manager'
          ),
        };

        setEligibleUsers(categorizedUsers);
      }, (error) => {
        logError(error, { operation: 'fetch_project_members' });
      });
    };

    fetchMembers();
  }, []);

  return (
    <div className='bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6'>
      <div className='flex justify-between items-start mb-6'>
        <h2 className='text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent'>
          專案資訊
        </h2>
        <button
          onClick={() => setIsEditing(true)}
          className='p-2 rounded-lg bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors duration-200'
          title='編輯'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-5 w-5'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
            />
          </svg>
        </button>
      </div>

      <ProjectInfoDisplay project={project} eligibleUsers={eligibleUsers} />

      {/* 工作包列表 */}
      <div className='mt-8'>
        <h3 className='text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100'>工作包</h3>
        <WorkpackageList workpackages={project.workpackages || []} projectId={projectId} />
      </div>

      {/* 編輯彈窗 */}
      <ProjectEditModal
        project={project}
        projectId={projectId}
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        eligibleUsers={eligibleUsers}
      />
    </div>
  );
}
