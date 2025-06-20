/**
 * 專案資訊顯示組件
 *
 * 顯示專案的基本資訊，包括：
 * - 專案名稱、合約ID
 * - 專案成員（經理、監工、安全人員、成本控制員）
 * - 專案地點和時間資訊
 * - 業主資訊
 */

'use client';

import { ROLE_NAMES, type RoleKey } from '@/constants/roles';
import type { AppUser } from '@/types/auth';
import type { Project } from '@/types/project';
import { formatLocalDate } from '@/utils/dateUtils';

interface ProjectInfoDisplayProps {
  project: Project;
  eligibleUsers: {
    costControllers: AppUser[];
    supervisors: AppUser[];
    safetyOfficers: AppUser[];
    managers: AppUser[];
  };
}

export default function ProjectInfoDisplay({ project, eligibleUsers }: ProjectInfoDisplayProps) {
  const getUserDisplayName = (uid: string | null | undefined, userList: AppUser[] | undefined) => {
    if (!uid || !userList) return '-';
    const user = userList.find(u => u.uid === uid);
    if (!user) return '-';
    return `${user.displayName} (${ROLE_NAMES[(user.roles?.[0] || user.currentRole) as RoleKey]})`;
  };

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
      <div className='space-y-4'>
        <div>
          <label className='text-sm font-medium text-gray-500 dark:text-gray-400'>專案名稱</label>
          <div className='mt-1 text-gray-900 dark:text-gray-100'>{project.projectName}</div>
        </div>
        <div>
          <label className='text-sm font-medium text-gray-500 dark:text-gray-400'>合約ID</label>
          <div className='mt-1 text-gray-900 dark:text-gray-100'>{project.contractId || '-'}</div>
        </div>
        <div>
          <label className='text-sm font-medium text-gray-500 dark:text-gray-400'>經理</label>
          <div className='mt-1 text-gray-900 dark:text-gray-100'>
            {getUserDisplayName(project.manager, eligibleUsers.managers)}
          </div>
        </div>
        <div>
          <label className='text-sm font-medium text-gray-500 dark:text-gray-400'>監工</label>
          <div className='mt-1 text-gray-900 dark:text-gray-100'>
            {getUserDisplayName(project.supervisor, eligibleUsers.supervisors)}
          </div>
        </div>
        <div>
          <label className='text-sm font-medium text-gray-500 dark:text-gray-400'>安全人員</label>
          <div className='mt-1 text-gray-900 dark:text-gray-100'>
            {getUserDisplayName(project.safetyOfficer, eligibleUsers.safetyOfficers)}
          </div>
        </div>
        <div>
          <label className='text-sm font-medium text-gray-500 dark:text-gray-400'>成本控制員</label>
          <div className='mt-1 text-gray-900 dark:text-gray-100'>
            {getUserDisplayName(project.costController, eligibleUsers.costControllers)}
          </div>
        </div>
      </div>
      <div className='space-y-4'>
        <div>
          <label className='text-sm font-medium text-gray-500 dark:text-gray-400'>地區</label>
          <div className='mt-1 text-gray-900 dark:text-gray-100'>{project.region || '-'}</div>
        </div>
        <div>
          <label className='text-sm font-medium text-gray-500 dark:text-gray-400'>地址</label>
          <div className='mt-1 text-gray-900 dark:text-gray-100'>{project.address || '-'}</div>
        </div>
        <div>
          <label className='text-sm font-medium text-gray-500 dark:text-gray-400'>業主</label>
          <div className='mt-1 text-gray-900 dark:text-gray-100'>{project.owner || '-'}</div>
        </div>
        <div>
          <label className='text-sm font-medium text-gray-500 dark:text-gray-400'>起始日</label>
          <div className='mt-1 text-gray-900 dark:text-gray-100'>
            {project.startDate ? formatLocalDate(project.startDate) : '-'}
          </div>
        </div>
        <div>
          <label className='text-sm font-medium text-gray-500 dark:text-gray-400'>預估結束日</label>
          <div className='mt-1 text-gray-900 dark:text-gray-100'>
            {project.estimatedEndDate ? formatLocalDate(project.estimatedEndDate) : '-'}
          </div>
        </div>
      </div>
    </div>
  );
}
