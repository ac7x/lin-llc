/**
 * 專案資訊顯示組件
 *
 * 顯示專案的基本資訊，包括：
 * - 專案名稱、合約ID
 * - 專案成員（經理、監工、安全人員、成本控制員）
 * - 專案地點和時間資訊
 * - 業主資訊
 * - 品質分數
 */

'use client';

import { useState, useEffect } from 'react';

import { useQualityScore } from '@/app/projects/hooks/useFilteredProjects';
import type { Project } from '@/app/projects/types/project';
import AddressSelector from '@/app/projects/components/AddressSelector';
import { ROLE_NAMES, type RoleKey } from '@/constants/roles';
import type { AppUser } from '@/types/auth';
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
  const [showAddressMap, setShowAddressMap] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(project.address || '');
  
  // 同步專案地址變化
  useEffect(() => {
    setCurrentAddress(project.address || '');
  }, [project.address]);
  
  const getUserDisplayName = (uid: string | null | undefined, userList: AppUser[] | undefined) => {
    if (!uid || !userList) return '-';
    const user = userList.find(u => u.uid === uid);
    if (!user) return '-';
    return `${user.displayName} (${ROLE_NAMES[(user.roles?.[0] || user.currentRole) as RoleKey]})`;
  };

  // 使用品質分數 hook
  const qualityScoreInfo = useQualityScore(project);

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
          <div className='mt-1'>
            {project.address ? (
              <div className='flex items-center gap-2'>
                <span className='text-gray-900 dark:text-gray-100 flex-1'>{project.address}</span>
                <button
                  onClick={() => setShowAddressMap(!showAddressMap)}
                  className='px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors duration-200'
                  title='查看地圖'
                >
                  <svg className='w-3 h-3' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
                    <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
                  </svg>
                </button>
              </div>
            ) : (
              <span className='text-gray-500 dark:text-gray-400'>-</span>
            )}
          </div>
          {/* 地址地圖選擇器 */}
          {showAddressMap && (
            <div className='mt-2'>
              <AddressSelector
                value={currentAddress}
                onChange={setCurrentAddress}
                placeholder='查看地址位置'
                className='w-full'
                readOnly={true}
              />
            </div>
          )}
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
        <div>
          <label className='text-sm font-medium text-gray-500 dark:text-gray-400'>品質分數</label>
          <div className='mt-1 flex items-center gap-2'>
            <span className={`text-lg font-bold ${
              qualityScoreInfo.currentScore >= 8 ? 'text-green-600 dark:text-green-400' :
              qualityScoreInfo.currentScore >= 6 ? 'text-yellow-600 dark:text-yellow-400' :
              'text-red-600 dark:text-red-400'
            }`}>
              {qualityScoreInfo.currentScore.toFixed(1)}/10
            </span>
            {qualityScoreInfo.qualityOrProgressIssuesCount > 0 && (
              <span className='text-xs text-orange-600 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/20 px-2 py-1 rounded'>
                {qualityScoreInfo.qualityOrProgressIssuesCount} 個問題
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
