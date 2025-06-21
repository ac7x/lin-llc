/**
 * 專案資訊頁面組件
 *
 * 整合專案資訊顯示、編輯和工作包管理功能
 */

'use client';

import { useState, useEffect } from 'react';

import { collection, query, getDocs, db } from '@/lib/firebase-client';
import type { Project } from '@/app/test-projects/types/project';
import type { AppUser } from '@/types/auth';
import { cn, cardStyles, buttonStyles } from '@/utils/classNameUtils';
import { logError, safeAsync, retry } from '@/utils/errorUtils';
import { projectStyles } from '@/app/test-projects/styles';

import { WorkpackageList } from '../work-packages';
import ProjectEditModal from './ProjectEditModal';
import ProjectInfoDisplay from './ProjectInfoDisplay';

interface ProjectInfoPageProps {
  project: Project & { id: string };
  eligibleUsers: {
    costControllers: AppUser[];
    supervisors: AppUser[];
    safetyOfficers: AppUser[];
    managers: AppUser[];
  };
}

export default function ProjectInfoPage({ project, eligibleUsers }: ProjectInfoPageProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'workpackages'>('info');

  return (
    <div className="space-y-6">
      {/* 標題 */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          {project.projectName}
        </h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('info')}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors duration-200',
              activeTab === 'info'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
          >
            專案資訊
          </button>
          <button
            onClick={() => setActiveTab('workpackages')}
            className={cn(
              'px-4 py-2 rounded-lg font-medium transition-colors duration-200',
              activeTab === 'workpackages'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            )}
          >
            工作包
          </button>
        </div>
      </div>

      {/* 內容區域 */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {activeTab === 'info' && (
          <div className="p-6">
            <ProjectInfoDisplay project={project} eligibleUsers={eligibleUsers} />
          </div>
        )}
        
        {activeTab === 'workpackages' && (
          <div className="p-6">
        <WorkpackageList 
              workpackages={project.workpackages}
              projectId={project.id}
        />
          </div>
        )}
      </div>
    </div>
  );
} 