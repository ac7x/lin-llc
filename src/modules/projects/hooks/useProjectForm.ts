/**
 * 專案表單 Hook
 * 提供專案表單狀態管理和驗證功能
 */

import { useState, useCallback } from 'react';
import type { Project } from '../types/project';

interface UseProjectFormReturn {
  formData: Partial<Project>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  handleInputChange: (field: string, value: string | number | Date | null) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
}

export function useProjectForm(
  initialData: Partial<Project> = {},
  onSubmit: (data: Partial<Project>) => Promise<void>
): UseProjectFormReturn {
  const [formData, setFormData] = useState<Partial<Project>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: string, value: string | number | Date | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));

    // 清除對應的錯誤訊息
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
      }));
    }
  };

  const validateField = useCallback((field: keyof Project): boolean => {
    const value = formData[field];
    
    // 基本驗證邏輯
    if (field === 'projectName') {
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        setErrors(prev => ({ ...prev, [field]: '專案名稱為必填項目' }));
        return false;
      }
      if (typeof value === 'string' && value.length < 2) {
        setErrors(prev => ({ ...prev, [field]: '專案名稱至少需要 2 個字元' }));
        return false;
      }
      if (typeof value === 'string' && value.length > 100) {
        setErrors(prev => ({ ...prev, [field]: '專案名稱不能超過 100 個字元' }));
        return false;
      }
    }
    
    if (field === 'status') {
      if (!value) {
        setErrors(prev => ({ ...prev, [field]: '專案狀態為必填項目' }));
        return false;
      }
    }

    // 清除錯誤
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
    
    return true;
  }, [formData]);

  const validateForm = useCallback((): boolean => {
    const fieldsToValidate: (keyof Project)[] = ['projectName', 'status'];
    let isValid = true;
    const newErrors: Record<string, string> = {};

    for (const field of fieldsToValidate) {
      const value = formData[field];
      
      if (field === 'projectName') {
        if (!value || (typeof value === 'string' && value.trim() === '')) {
          newErrors[field] = '專案名稱為必填項目';
          isValid = false;
          continue;
        }
        if (typeof value === 'string' && value.length < 2) {
          newErrors[field] = '專案名稱至少需要 2 個字元';
          isValid = false;
          continue;
        }
        if (typeof value === 'string' && value.length > 100) {
          newErrors[field] = '專案名稱不能超過 100 個字元';
          isValid = false;
          continue;
        }
      }
      
      if (field === 'status') {
        if (!value) {
          newErrors[field] = '專案狀態為必填項目';
          isValid = false;
          continue;
        }
      }
    }

    setErrors(newErrors);
    return isValid;
  }, [formData]);

  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (validateForm()) {
      await onSubmit(formData);
    }

    setIsSubmitting(false);
  };

  return {
    formData,
    errors,
    isSubmitting,
    handleInputChange,
    handleSubmit,
    resetForm,
  };
} 