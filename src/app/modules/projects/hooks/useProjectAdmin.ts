/**
 * 專案管理 Hook
 * 
 * 提供專案管理相關功能：
 * - 用戶管理
 * - 權限管理
 * - 角色管理
 * - 專案統計
 */

import { useState, useEffect, useCallback } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, doc, updateDoc, deleteDoc, addDoc, query, where } from 'firebase/firestore';

import { db } from '@/lib/firebase-client';
import { useAuth } from '@/hooks/useAuth';

// 用戶型別
export interface ProjectUser {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  role: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// 角色型別
export interface ProjectRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
}

// 權限型別
export interface ProjectPermission {
  id: string;
  name: string;
  description: string;
  category: string;
}

// 專案統計型別
export interface ProjectStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalUsers: number;
  totalWorkPackages: number;
  totalIssues: number;
  averageProgress: number;
  qualityScore: number;
}

export function useProjectAdmin() {
  const { user, hasPermission } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 載入用戶列表
  const [usersSnapshot, usersLoading, usersError] = useCollection(
    collection(db, 'members')
  );

  // 載入專案列表
  const [projectsSnapshot, projectsLoading, projectsError] = useCollection(
    collection(db, 'projects')
  );

  // 載入工作包列表
  const [workPackagesSnapshot, workPackagesLoading, workPackagesError] = useCollection(
    collection(db, 'workPackages')
  );

  // 載入問題列表
  const [issuesSnapshot, issuesLoading, issuesError] = useCollection(
    collection(db, 'issues')
  );

  // 處理錯誤
  const handleError = useCallback((err: Error, operation: string) => {
    console.error(`專案管理錯誤 (${operation}):`, err);
    setError(`${operation} 失敗: ${err.message}`);
  }, []);

  // 清除錯誤
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 更新用戶角色
  const updateUserRole = useCallback(async (userId: string, newRole: string) => {
    if (!hasPermission('admin')) {
      throw new Error('權限不足');
    }

    setLoading(true);
    setError(null);

    try {
      const userRef = doc(db, 'members', userId);
      await updateDoc(userRef, {
        currentRole: newRole,
        roles: [newRole],
        updatedAt: new Date(),
      });
    } catch (err) {
      handleError(err as Error, 'update_user_role');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, handleError]);

  // 停用用戶
  const deactivateUser = useCallback(async (userId: string) => {
    if (!hasPermission('admin')) {
      throw new Error('權限不足');
    }

    setLoading(true);
    setError(null);

    try {
      const userRef = doc(db, 'members', userId);
      await updateDoc(userRef, {
        isActive: false,
        updatedAt: new Date(),
      });
    } catch (err) {
      handleError(err as Error, 'deactivate_user');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, handleError]);

  // 啟用用戶
  const activateUser = useCallback(async (userId: string) => {
    if (!hasPermission('admin')) {
      throw new Error('權限不足');
    }

    setLoading(true);
    setError(null);

    try {
      const userRef = doc(db, 'members', userId);
      await updateDoc(userRef, {
        isActive: true,
        updatedAt: new Date(),
      });
    } catch (err) {
      handleError(err as Error, 'activate_user');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, handleError]);

  // 刪除用戶
  const deleteUser = useCallback(async (userId: string) => {
    if (!hasPermission('admin')) {
      throw new Error('權限不足');
    }

    setLoading(true);
    setError(null);

    try {
      const userRef = doc(db, 'members', userId);
      await deleteDoc(userRef);
    } catch (err) {
      handleError(err as Error, 'delete_user');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [hasPermission, handleError]);

  // 計算專案統計
  const calculateProjectStats = useCallback((): ProjectStats => {
    if (!projectsSnapshot || !usersSnapshot || !workPackagesSnapshot || !issuesSnapshot) {
      return {
        totalProjects: 0,
        activeProjects: 0,
        completedProjects: 0,
        totalUsers: 0,
        totalWorkPackages: 0,
        totalIssues: 0,
        averageProgress: 0,
        qualityScore: 0,
      };
    }

    const projects = projectsSnapshot.docs;
    const users = usersSnapshot.docs;
    const workPackages = workPackagesSnapshot.docs;
    const issues = issuesSnapshot.docs;

    const totalProjects = projects.length;
    const activeProjects = projects.filter(doc => {
      const data = doc.data();
      return data.status === 'in-progress' || data.status === 'approved';
    }).length;
    const completedProjects = projects.filter(doc => {
      const data = doc.data();
      return data.status === 'completed';
    }).length;

    const totalUsers = users.filter(doc => {
      const data = doc.data();
      return data.isActive !== false;
    }).length;

    const totalWorkPackages = workPackages.length;
    const totalIssues = issues.length;

    // 計算平均進度
    const totalProgress = projects.reduce((sum, doc) => {
      const data = doc.data();
      return sum + (data.progress || 0);
    }, 0);
    const averageProgress = totalProjects > 0 ? Math.round(totalProgress / totalProjects) : 0;

    // 計算品質分數
    const totalQualityScore = projects.reduce((sum, doc) => {
      const data = doc.data();
      return sum + (data.qualityScore || 0);
    }, 0);
    const qualityScore = totalProjects > 0 ? Math.round(totalQualityScore / totalProjects) : 0;

    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalUsers,
      totalWorkPackages,
      totalIssues,
      averageProgress,
      qualityScore,
    };
  }, [projectsSnapshot, usersSnapshot, workPackagesSnapshot, issuesSnapshot]);

  // 取得用戶列表
  const getUsers = useCallback((): ProjectUser[] => {
    if (!usersSnapshot) return [];

    return usersSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        uid: data.uid || doc.id,
        email: data.email || '',
        displayName: data.displayName || data.name || '',
        role: data.currentRole || data.roles?.[0] || 'guest',
        permissions: data.permissions || [],
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        isActive: data.isActive !== false,
      };
    });
  }, [usersSnapshot]);

  // 取得專案列表
  const getProjects = useCallback(() => {
    if (!projectsSnapshot) return [];

    return projectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  }, [projectsSnapshot]);

  return {
    // 狀態
    loading: loading || usersLoading || projectsLoading || workPackagesLoading || issuesLoading,
    error: error || usersError?.message || projectsError?.message || workPackagesError?.message || issuesError?.message,
    
    // 數據
    users: getUsers(),
    projects: getProjects(),
    stats: calculateProjectStats(),
    
    // 操作
    updateUserRole,
    deactivateUser,
    activateUser,
    deleteUser,
    clearError,
  };
}
