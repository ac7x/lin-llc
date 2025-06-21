/**
 * 專案編輯彈窗組件
 *
 * 提供編輯專案基本資訊的功能，包括：
 * - 專案名稱、合約ID
 * - 專案成員（經理、監工、安全人員、成本控制員）
 * - 專案地點和時間資訊
 * - 預算權限控制（只有 manager 和 costController 可編輯）
 */

'use client';

import { doc, updateDoc, Timestamp } from 'firebase/firestore';
import { useState } from 'react';

import AddressSelector from '@/app/projects/components/AddressSelector';
import type { Project } from '@/app/projects/types/project';
import { ROLE_NAMES, type RoleKey } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase-client';
import type { AppUser } from '@/types/auth';
import { cn, modalStyles, formStyles, inputStyles, buttonStyles, loadingStyles } from '@/utils/classNameUtils';
import { formatDateForInput } from '@/utils/dateUtils';
import { getErrorMessage, logError, safeAsync, retry } from '@/utils/errorUtils';
import { TaiwanCityList } from '@/utils/taiwanCityUtils';

interface ProjectEditModalProps {
  project: Project;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  eligibleUsers: {
    costControllers: AppUser[];
    supervisors: AppUser[];
    safetyOfficers: AppUser[];
    managers: AppUser[];
  };
}

export default function ProjectEditModal({
  project,
  projectId,
  isOpen,
  onClose,
  eligibleUsers,
}: ProjectEditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentAddress, setCurrentAddress] = useState(project.address || '');
  const { user } = useAuth();

  // 檢查預算權限的函數
  const canEditBudget = (): boolean => {
    if (!user?.uid) return false;

    // 檢查是否為專案的 manager 或 costController
    return project.manager === user.uid || project.costController === user.uid;
  };

  const hasBudgetPermission = canEditBudget();

  const handleUpdateProject = async (formData: FormData) => {
    setIsSubmitting(true);
    await safeAsync(async () => {
      const startDate = formData.get('startDate')?.toString();
      const estimatedEndDate = formData.get('estimatedEndDate')?.toString();

      const updates = {
        projectName: formData.get('projectName'),
        contractId: formData.get('contractId'),
        manager: formData.get('manager'),
        supervisor: formData.get('supervisor'),
        safetyOfficer: formData.get('safetyOfficer'),
        costController: formData.get('costController'),
        region: formData.get('region'),
        address: currentAddress,
        owner: formData.get('owner'),
        startDate: startDate ? Timestamp.fromDate(new Date(startDate)) : null,
        estimatedEndDate: estimatedEndDate ? Timestamp.fromDate(new Date(estimatedEndDate)) : null,
        updatedAt: Timestamp.now(),
      };

      await retry(() => updateDoc(doc(db, 'projects', projectId), updates), 3, 1000);
      onClose();
    }, (error) => {
      alert(`更新失敗: ${getErrorMessage(error)}`);
      logError(error, { operation: 'update_project', projectId });
    });
    setIsSubmitting(false);
  };

  if (!isOpen) return null;

  return (
    <div className={modalStyles.overlay}>
      <div className={modalStyles.container}>
        <h2 className={modalStyles.title}>
          編輯專案資訊
        </h2>
        <form
          onSubmit={async e => {
            e.preventDefault();
            const formData = new FormData(e.target as HTMLFormElement);
            await handleUpdateProject(formData);
          }}
          className={formStyles.group}
        >
          <div className={formStyles.row}>
            <div>
              <label className={formStyles.label}>
                專案名稱
              </label>
              <input
                name='projectName'
                defaultValue={project.projectName}
                className={inputStyles.base}
                required
              />
            </div>
            <div>
              <label className={formStyles.label}>
                合約ID
              </label>
              <input
                name='contractId'
                defaultValue={project.contractId}
                className={inputStyles.base}
              />
            </div>
            <div>
              <label className={formStyles.label}>
                經理
              </label>
              <select
                name='manager'
                defaultValue={project.manager || ''}
                className={formStyles.select}
              >
                <option key='manager-empty' value=''>
                  請選擇
                </option>
                {(eligibleUsers.managers || []).map((user, index) => (
                  <option key={`manager-${user.uid}-${index}`} value={user.uid}>
                    {user.displayName} (
                    {ROLE_NAMES[(user.roles?.[0] || user.currentRole) as RoleKey]})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={formStyles.label}>
                監工
              </label>
              <select
                name='supervisor'
                defaultValue={project.supervisor || ''}
                className={formStyles.select}
              >
                <option key='supervisor-empty' value=''>
                  請選擇
                </option>
                {(eligibleUsers.supervisors || []).map((user, index) => (
                  <option key={`supervisor-${user.uid}-${index}`} value={user.uid}>
                    {user.displayName} (
                    {ROLE_NAMES[(user.roles?.[0] || user.currentRole) as RoleKey]})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={formStyles.label}>
                安全人員
              </label>
              <select
                name='safetyOfficer'
                defaultValue={project.safetyOfficer || ''}
                className={formStyles.select}
              >
                <option key='safety-empty' value=''>
                  請選擇
                </option>
                {(eligibleUsers.safetyOfficers || []).map((user, index) => (
                  <option key={`safety-${user.uid}-${index}`} value={user.uid}>
                    {user.displayName} (
                    {ROLE_NAMES[(user.roles?.[0] || user.currentRole) as RoleKey]})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={formStyles.label}>
                成本控制員
              </label>
              <select
                name='costController'
                defaultValue={project.costController || ''}
                className={formStyles.select}
              >
                <option key='cost-empty' value=''>
                  請選擇
                </option>
                {(eligibleUsers.costControllers || []).map((user, index) => (
                  <option key={`cost-${user.uid}-${index}`} value={user.uid}>
                    {user.displayName} (
                    {ROLE_NAMES[(user.roles?.[0] || user.currentRole) as RoleKey]})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={formStyles.label}>
                地區
              </label>
              <select
                name='region'
                defaultValue={project.region || ''}
                className={formStyles.select}
              >
                <option key='region-empty' value=''>
                  請選擇
                </option>
                {TaiwanCityList.map((opt, index) => (
                  <option key={`region-${opt.value}-${index}`} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={formStyles.label}>
                地址
              </label>
              <AddressSelector
                value={currentAddress}
                onChange={address => {
                  setCurrentAddress(address);
                }}
                placeholder='請輸入或選擇地址'
                className='w-full'
              />
            </div>
            <div>
              <label className={formStyles.label}>
                業主
              </label>
              <input
                name='owner'
                defaultValue={project.owner}
                className={inputStyles.base}
              />
            </div>
            <div>
              <label className={formStyles.label}>
                起始日
              </label>
              <input
                key='startDate'
                type='date'
                name='startDate'
                defaultValue={formatDateForInput(project.startDate)}
                className={inputStyles.date}
              />
            </div>
            <div>
              <label className={formStyles.label}>
                預估結束日
              </label>
              <input
                key='estimatedEndDate'
                type='date'
                name='estimatedEndDate'
                defaultValue={formatDateForInput(project.estimatedEndDate)}
                className={inputStyles.date}
              />
            </div>
          </div>

          {/* 預算權限提示 */}
          {!hasBudgetPermission && (
            <div className={cn(
              'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3'
            )}>
              <div className='flex items-center'>
                <svg
                  className='w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-2'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                  />
                </svg>
                <span className='text-sm text-yellow-800 dark:text-yellow-200'>
                  只有專案經理和成本控制員可以編輯預算相關資訊
                </span>
              </div>
            </div>
          )}

          <div className='flex justify-end space-x-3 pt-6'>
            <button
              type='button'
              onClick={onClose}
              disabled={isSubmitting}
              className={cn(buttonStyles.outline, 'disabled:opacity-50')}
            >
              取消
            </button>
            <button
              type='submit'
              disabled={isSubmitting}
              className={cn(buttonStyles.primary, 'disabled:opacity-50 flex items-center')}
            >
              {isSubmitting ? (
                <>
                  <div className={cn(loadingStyles.spinnerSmall, 'mr-2')}></div>
                  儲存中...
                </>
              ) : (
                '確認儲存'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
