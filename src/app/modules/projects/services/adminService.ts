/**
 * 專案管理服務
 * 
 * 提供專案管理相關的後端服務：
 * - 用戶管理
 * - 權限管理
 * - 角色管理
 * - 專案統計
 */

import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';

import { db } from '@/lib/firebase-client';
import type { ProjectUser, ProjectRole, ProjectPermission, ProjectStats } from '../hooks/useProjectAdmin';

export class AdminService {
  /**
   * 取得所有用戶
   */
  static async getAllUsers(): Promise<ProjectUser[]> {
    try {
      const usersRef = collection(db, 'members');
      const usersSnapshot = await getDocs(usersRef);
      
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
    } catch (error) {
      console.error('取得用戶列表失敗:', error);
      throw new Error('取得用戶列表失敗');
    }
  }

  /**
   * 取得用戶詳情
   */
  static async getUserById(userId: string): Promise<ProjectUser | null> {
    try {
      const userRef = doc(db, 'members', userId);
      const userSnapshot = await getDoc(userRef);
      
      if (!userSnapshot.exists()) {
        return null;
      }

      const data = userSnapshot.data();
      return {
        id: userSnapshot.id,
        uid: data.uid || userSnapshot.id,
        email: data.email || '',
        displayName: data.displayName || data.name || '',
        role: data.currentRole || data.roles?.[0] || 'guest',
        permissions: data.permissions || [],
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
        isActive: data.isActive !== false,
      };
    } catch (error) {
      console.error('取得用戶詳情失敗:', error);
      throw new Error('取得用戶詳情失敗');
    }
  }

  /**
   * 更新用戶角色
   */
  static async updateUserRole(userId: string, newRole: string): Promise<void> {
    try {
      const userRef = doc(db, 'members', userId);
      await updateDoc(userRef, {
        currentRole: newRole,
        roles: [newRole],
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('更新用戶角色失敗:', error);
      throw new Error('更新用戶角色失敗');
    }
  }

  /**
   * 更新用戶權限
   */
  static async updateUserPermissions(userId: string, permissions: string[]): Promise<void> {
    try {
      const userRef = doc(db, 'members', userId);
      await updateDoc(userRef, {
        permissions,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('更新用戶權限失敗:', error);
      throw new Error('更新用戶權限失敗');
    }
  }

  /**
   * 停用用戶
   */
  static async deactivateUser(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'members', userId);
      await updateDoc(userRef, {
        isActive: false,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('停用用戶失敗:', error);
      throw new Error('停用用戶失敗');
    }
  }

  /**
   * 啟用用戶
   */
  static async activateUser(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'members', userId);
      await updateDoc(userRef, {
        isActive: true,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('啟用用戶失敗:', error);
      throw new Error('啟用用戶失敗');
    }
  }

  /**
   * 刪除用戶
   */
  static async deleteUser(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'members', userId);
      await deleteDoc(userRef);
    } catch (error) {
      console.error('刪除用戶失敗:', error);
      throw new Error('刪除用戶失敗');
    }
  }

  /**
   * 取得所有角色
   */
  static async getAllRoles(): Promise<ProjectRole[]> {
    try {
      const rolesRef = collection(db, 'roles');
      const rolesSnapshot = await getDocs(rolesRef);
      
      return rolesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          permissions: data.permissions || [],
          createdAt: data.createdAt?.toDate?.() || new Date(),
          updatedAt: data.updatedAt?.toDate?.() || new Date(),
        };
      });
    } catch (error) {
      console.error('取得角色列表失敗:', error);
      throw new Error('取得角色列表失敗');
    }
  }

  /**
   * 創建新角色
   */
  static async createRole(roleData: Omit<ProjectRole, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const rolesRef = collection(db, 'roles');
      const docRef = await addDoc(rolesRef, {
        ...roleData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('創建角色失敗:', error);
      throw new Error('創建角色失敗');
    }
  }

  /**
   * 更新角色
   */
  static async updateRole(roleId: string, roleData: Partial<ProjectRole>): Promise<void> {
    try {
      const roleRef = doc(db, 'roles', roleId);
      await updateDoc(roleRef, {
        ...roleData,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('更新角色失敗:', error);
      throw new Error('更新角色失敗');
    }
  }

  /**
   * 刪除角色
   */
  static async deleteRole(roleId: string): Promise<void> {
    try {
      const roleRef = doc(db, 'roles', roleId);
      await deleteDoc(roleRef);
    } catch (error) {
      console.error('刪除角色失敗:', error);
      throw new Error('刪除角色失敗');
    }
  }

  /**
   * 取得所有權限
   */
  static async getAllPermissions(): Promise<ProjectPermission[]> {
    try {
      const permissionsRef = collection(db, 'permissions');
      const permissionsSnapshot = await getDocs(permissionsRef);
      
      return permissionsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          description: data.description || '',
          category: data.category || '',
        };
      });
    } catch (error) {
      console.error('取得權限列表失敗:', error);
      throw new Error('取得權限列表失敗');
    }
  }

  /**
   * 取得專案統計
   */
  static async getProjectStats(): Promise<ProjectStats> {
    try {
      const [projectsSnapshot, usersSnapshot, workPackagesSnapshot, issuesSnapshot] = await Promise.all([
        getDocs(collection(db, 'projects')),
        getDocs(collection(db, 'members')),
        getDocs(collection(db, 'workPackages')),
        getDocs(collection(db, 'issues')),
      ]);

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
    } catch (error) {
      console.error('取得專案統計失敗:', error);
      throw new Error('取得專案統計失敗');
    }
  }

  /**
   * 取得活躍用戶
   */
  static async getActiveUsers(): Promise<ProjectUser[]> {
    try {
      const usersRef = collection(db, 'members');
      const q = query(usersRef, where('isActive', '==', true));
      const usersSnapshot = await getDocs(q);
      
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
    } catch (error) {
      console.error('取得活躍用戶失敗:', error);
      throw new Error('取得活躍用戶失敗');
    }
  }

  /**
   * 取得用戶活動記錄
   */
  static async getUserActivityLogs(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const logsRef = collection(db, 'activityLogs');
      const q = query(
        logsRef, 
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      const logsSnapshot = await getDocs(q);
      
      return logsSnapshot.docs.slice(0, limit).map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
      }));
    } catch (error) {
      console.error('取得用戶活動記錄失敗:', error);
      throw new Error('取得用戶活動記錄失敗');
    }
  }
}
