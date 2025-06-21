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

import { ROLE_NAMES, type RoleKey } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';
import { db } from '@/lib/firebase-client';
import { AddressSelector } from '@/modules/projects/components/common';
import type { Project } from '@/modules/projects/types/project';
import type { AppUser } from '@/types/auth';
import { cn, modalStyles, formStyles, inputStyles, buttonStyles, loadingStyles, alertStyles } from '@/utils/classNameUtils';
import { formatDateForInput } from '@/utils/dateUtils';
import { getErrorMessage, logError, safeAsync, retry } from '@/utils/errorUtils';

interface ProjectEditModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  eligibleUsers: {
    costControllers: AppUser[];
    supervisors: AppUser[];
    safetyOfficers: AppUser[];
    managers: AppUser[];
  };
}

export default function ProjectEditModal({
  project,
  isOpen,
  onClose,
  onSave,
  eligibleUsers,
}: ProjectEditModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    projectName: project.projectName || '',
    contractId: project.contractId || '',
    manager: project.manager || '',
    supervisor: project.supervisor || '',
    safetyOfficer: project.safetyOfficer || '',
    costController: project.costController || '',
    region: project.region || '',
    area: project.area || '',
    address: project.address || '',
    startDate: project.startDate ? formatDateForInput(project.startDate) : '',
    estimatedEndDate: project.estimatedEndDate ? formatDateForInput(project.estimatedEndDate) : '',
    budget: project.budget || 0,
    owner: project.owner || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEditBudget = user?.role === 'manager' || user?.role === 'costController';

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const projectRef = doc(db, 'projects', project.id);
      const updateData: Partial<Project> = {
        ...formData,
        budget: Number(formData.budget),
        updatedAt: Timestamp.now(),
      };

      // 轉換日期格式
      if (formData.startDate) {
        updateData.startDate = new Date(formData.startDate);
      }
      if (formData.estimatedEndDate) {
        updateData.estimatedEndDate = new Date(formData.estimatedEndDate);
      }

      await retry(() => updateDoc(projectRef, updateData), 3, 1000);
      onSave();
      onClose();
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      logError(err, { operation: 'update_project', projectId: project.id });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={modalStyles.overlay}>
      <div className={modalStyles.content}>
        <div className={modalStyles.header}>
          <h2 className={modalStyles.title}>編輯專案資訊</h2>
          <button
            onClick={onClose}
            className={modalStyles.closeButton}
            disabled={loading}
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className={formStyles.form}>
          {error && (
            <div className={alertStyles.error}>
              {error}
            </div>
          )}

          <div className={formStyles.grid}>
            {/* 專案基本資訊 */}
            <div className={formStyles.field}>
              <label className={formStyles.label}>專案名稱 *</label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => handleInputChange('projectName', e.target.value)}
                className={inputStyles.input}
                required
              />
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label}>合約ID</label>
              <input
                type="text"
                value={formData.contractId}
                onChange={(e) => handleInputChange('contractId', e.target.value)}
                className={inputStyles.input}
              />
            </div>

            {/* 專案成員 */}
            <div className={formStyles.field}>
              <label className={formStyles.label}>專案經理</label>
              <select
                value={formData.manager}
                onChange={(e) => handleInputChange('manager', e.target.value)}
                className={inputStyles.select}
              >
                <option value="">請選擇專案經理</option>
                {eligibleUsers.managers.map((manager) => (
                  <option key={manager.uid} value={manager.uid}>
                    {manager.displayName || manager.email}
                  </option>
                ))}
              </select>
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label}>監工</label>
              <select
                value={formData.supervisor}
                onChange={(e) => handleInputChange('supervisor', e.target.value)}
                className={inputStyles.select}
              >
                <option value="">請選擇監工</option>
                {eligibleUsers.supervisors.map((supervisor) => (
                  <option key={supervisor.uid} value={supervisor.uid}>
                    {supervisor.displayName || supervisor.email}
                  </option>
                ))}
              </select>
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label}>安全人員</label>
              <select
                value={formData.safetyOfficer}
                onChange={(e) => handleInputChange('safetyOfficer', e.target.value)}
                className={inputStyles.select}
              >
                <option value="">請選擇安全人員</option>
                {eligibleUsers.safetyOfficers.map((safetyOfficer) => (
                  <option key={safetyOfficer.uid} value={safetyOfficer.uid}>
                    {safetyOfficer.displayName || safetyOfficer.email}
                  </option>
                ))}
              </select>
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label}>成本控制員</label>
              <select
                value={formData.costController}
                onChange={(e) => handleInputChange('costController', e.target.value)}
                className={inputStyles.select}
              >
                <option value="">請選擇成本控制員</option>
                {eligibleUsers.costControllers.map((costController) => (
                  <option key={costController.uid} value={costController.uid}>
                    {costController.displayName || costController.email}
                  </option>
                ))}
              </select>
            </div>

            {/* 專案地點 */}
            <div className={formStyles.field}>
              <label className={formStyles.label}>地區</label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => handleInputChange('region', e.target.value)}
                className={inputStyles.input}
              />
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label}>區域</label>
              <input
                type="text"
                value={formData.area}
                onChange={(e) => handleInputChange('area', e.target.value)}
                className={inputStyles.input}
              />
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label}>地址</label>
              <AddressSelector
                value={formData.address}
                onChange={(value) => handleInputChange('address', value)}
                className={inputStyles.input}
              />
            </div>

            {/* 專案時間 */}
            <div className={formStyles.field}>
              <label className={formStyles.label}>開始日期</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className={inputStyles.input}
              />
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label}>預計結束日期</label>
              <input
                type="date"
                value={formData.estimatedEndDate}
                onChange={(e) => handleInputChange('estimatedEndDate', e.target.value)}
                className={inputStyles.input}
              />
            </div>

            {/* 預算和業主 */}
            <div className={formStyles.field}>
              <label className={formStyles.label}>
                預算 {!canEditBudget && '(僅限經理和成本控制員編輯)'}
              </label>
              <input
                type="number"
                value={formData.budget}
                onChange={(e) => handleInputChange('budget', Number(e.target.value))}
                className={cn(inputStyles.input, !canEditBudget && 'opacity-50')}
                disabled={!canEditBudget}
                min="0"
                step="0.01"
              />
            </div>

            <div className={formStyles.field}>
              <label className={formStyles.label}>業主</label>
              <input
                type="text"
                value={formData.owner}
                onChange={(e) => handleInputChange('owner', e.target.value)}
                className={inputStyles.input}
              />
            </div>
          </div>

          <div className={formStyles.actions}>
            <button
              type="button"
              onClick={onClose}
              className={buttonStyles.secondary}
              disabled={loading}
            >
              取消
            </button>
            <button
              type="submit"
              className={cn(buttonStyles.primary, loading && loadingStyles.button)}
              disabled={loading}
            >
              {loading ? '儲存中...' : '儲存變更'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 