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

import { useState, useEffect, type ReactElement } from 'react';

import { ROLE_NAMES, type RoleKey } from '@/constants/roles';
import { cn, getQualityColor } from '@/utils/classNameUtils';
import { formatLocalDate } from '@/utils/dateUtils';
import { projectStyles } from '@/app/modules/projects/styles';
import type { Project } from '@/app/modules/projects/types';
import type { AppUser } from '@/types/auth';

interface ProjectInfoDisplayProps {
  project: Project;
  eligibleUsers: {
    costControllers: AppUser[];
    supervisors: AppUser[];
    safetyOfficers: AppUser[];
    managers: AppUser[];
  };
}

export default function ProjectInfoDisplay({ project, eligibleUsers }: ProjectInfoDisplayProps): ReactElement {
  const [qualityScore, setQualityScore] = useState<number>(0);

  useEffect(() => {
    // 計算品質分數
    const calculateQuality = () => {
      let score = 0;
      let totalWeight = 0;

      // 進度完成度 (30%)
      if (project.progress !== undefined) {
        score += (project.progress / 100) * 30;
        totalWeight += 30;
      }

      // 問題數量 (25%)
      const issues = project.issues || [];
      const unresolvedIssues = issues.filter(issue => {
        // 檢查 issue 是否有 status 屬性（IssueRecord 有，ProjectIssue 沒有）
        return 'status' in issue && issue.status !== 'resolved';
      }).length;
      const issueScore = Math.max(0, 25 - unresolvedIssues * 2);
      score += issueScore;
      totalWeight += 25;

      // 時間控制 (25%)
      if (project.startDate && project.estimatedEndDate) {
        const startDate = project.startDate instanceof Date ? project.startDate : 
                         typeof project.startDate === 'string' ? new Date(project.startDate) :
                         project.startDate?.toDate?.() || new Date();
        const endDate = project.estimatedEndDate instanceof Date ? project.estimatedEndDate : 
                       typeof project.estimatedEndDate === 'string' ? new Date(project.estimatedEndDate) :
                       project.estimatedEndDate?.toDate?.() || new Date();
        const now = new Date();
        const totalDuration = endDate.getTime() - startDate.getTime();
        const elapsed = now.getTime() - startDate.getTime();
        
        if (totalDuration > 0) {
          const timeProgress = Math.min(1, elapsed / totalDuration);
          const expectedProgress = timeProgress * 100;
          const actualProgress = project.progress || 0;
          const timeScore = Math.max(0, 25 - Math.abs(expectedProgress - actualProgress) / 2);
          score += timeScore;
          totalWeight += 25;
        }
      }

      // 品質指標 (20%)
      if (project.qualityScore !== undefined) {
        score += (project.qualityScore / 100) * 20;
      totalWeight += 20;
      }

      return totalWeight > 0 ? Math.round(score) : 0;
    };

    setQualityScore(calculateQuality());
  }, [project]);

  const getUserName = (uid: string | undefined, userList: AppUser[]): string => {
    if (!uid) return '未指派';
    const user = userList.find(u => u.uid === uid);
    return user?.displayName || user?.email || '未指派';
  };

  const getRoleDisplayName = (role: string): string => {
    switch (role) {
      case 'manager':
        return '專案經理';
      case 'supervisor':
        return '監工';
      case 'safetyOfficer':
        return '安全人員';
      case 'costController':
        return '成本控制員';
      default:
        return role;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 專案基本資訊 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">基本資訊</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">專案名稱</label>
            <p className="mt-1 text-sm text-gray-900">{project.projectName}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">合約ID</label>
            <p className="mt-1 text-sm text-gray-900">{project.contractId || '未設定'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">業主</label>
            <p className="mt-1 text-sm text-gray-900">{project.owner || '未設定'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">品質分數</label>
            <div className="mt-1 flex items-center">
              <span className={cn(
                'text-sm font-medium',
                getQualityColor(qualityScore)
              )}>
                {qualityScore}%
              </span>
              <div className="ml-2 flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    getQualityColor(qualityScore).replace('text-', 'bg-')
                  )}
                  style={{ width: `${qualityScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 專案成員 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">專案成員</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {getRoleDisplayName('manager')}
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {getUserName(project.manager, eligibleUsers.managers)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {getRoleDisplayName('supervisor')}
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {getUserName(project.supervisor, eligibleUsers.supervisors)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {getRoleDisplayName('safetyOfficer')}
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {getUserName(project.safetyOfficer, eligibleUsers.safetyOfficers)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              {getRoleDisplayName('costController')}
            </label>
            <p className="mt-1 text-sm text-gray-900">
              {getUserName(project.costController, eligibleUsers.costControllers)}
            </p>
          </div>
        </div>

        {/* 專案地點和時間 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">地點與時間</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">地區</label>
            <p className="mt-1 text-sm text-gray-900">{project.region || '未設定'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">區域</label>
            <p className="mt-1 text-sm text-gray-900">{project.area || '未設定'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">地址</label>
            <p className="mt-1 text-sm text-gray-900">{project.address || '未設定'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">開始日期</label>
            <p className="mt-1 text-sm text-gray-900">
              {project.startDate ? formatLocalDate(project.startDate) : '未設定'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">預計結束日期</label>
            <p className="mt-1 text-sm text-gray-900">
              {project.estimatedEndDate ? formatLocalDate(project.estimatedEndDate) : '未設定'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 