import { doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { useState } from 'react';
import { db } from '@/lib/firebase-client';
import { safeAsync, retry, getErrorMessage, logError } from '@/utils/errorUtils';
import type { Project } from '../types';

export function useProjectActions() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProject = async (projectId: string, updates: Partial<Project>) => {
    setIsLoading(true);
    setError(null);

    await safeAsync(async () => {
      const projectRef = doc(db, 'projects', projectId);
      await retry(() => updateDoc(projectRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      }), 3, 1000);
    }, (error) => {
      const message = `更新專案失敗: ${getErrorMessage(error)}`;
      setError(message);
      logError(error, { operation: 'update_project', projectId });
      throw new Error(message);
    });

    setIsLoading(false);
  };

  const deleteProject = async (projectId: string) => {
    setIsLoading(true);
    setError(null);

    await safeAsync(async () => {
      const projectRef = doc(db, 'projects', projectId);
      await retry(() => deleteDoc(projectRef), 3, 1000);
    }, (error) => {
      const message = `刪除專案失敗: ${getErrorMessage(error)}`;
      setError(message);
      logError(error, { operation: 'delete_project', projectId });
      throw new Error(message);
    });

    setIsLoading(false);
  };

  const archiveProject = async (projectId: string) => {
    setIsLoading(true);
    setError(null);

    await safeAsync(async () => {
      const projectRef = doc(db, 'projects', projectId);
      await retry(() => updateDoc(projectRef, {
        status: 'archived',
        archivedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }), 3, 1000);
    }, (error) => {
      const message = `封存專案失敗: ${getErrorMessage(error)}`;
      setError(message);
      logError(error, { operation: 'archive_project', projectId });
      throw new Error(message);
    });

    setIsLoading(false);
  };

  return {
    updateProject,
    deleteProject,
    archiveProject,
    isLoading,
    error,
  };
} 