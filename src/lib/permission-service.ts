import { 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  collection, 
  query, 
  where, 
  updateDoc, 
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase-init';
import { 
  Permission, 
  Role, 
  UserRole, 
  UserProfile, 
  PermissionCheck,
  DataScope 
} from '@/types';
import { isOwner, getDefaultRoleId } from './env-config';

/**
 * 權限管理服務
 * 提供完整的 RBAC 權限管理功能
 */
export class PermissionService {
  private static instance: PermissionService;
  
  private constructor() {}
  
  static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  /**
   * 創建或更新用戶資料
   */
  async createOrUpdateUserProfile(
    uid: string, 
    email: string, 
    displayName: string, 
    photoURL?: string
  ): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      const now = new Date().toISOString();
      const roleId = getDefaultRoleId(uid);
      
      if (userDoc.exists()) {
        // 更新現有用戶資料
        const updateData: Partial<UserProfile> = {
          displayName,
          lastLoginAt: now,
          loginCount: (userDoc.data()?.loginCount || 0) + 1,
          updatedAt: now,
        };
        
        // 只有當 photoURL 有值時才包含
        if (photoURL !== undefined) {
          updateData.photoURL = photoURL;
        }
        
        await updateDoc(userRef, updateData);
      } else {
        // 創建新用戶資料
        const userProfile: UserProfile = {
          uid,
          email,
          displayName,
          roleId,
          isActive: true,
          createdAt: now,
          updatedAt: now,
          lastLoginAt: now,
          loginCount: 1,
        };
        
        // 只有當 photoURL 有值時才包含
        if (photoURL) {
          userProfile.photoURL = photoURL;
        }
        
        await setDoc(userRef, userProfile);
        
        // 創建用戶角色關聯
        await this.assignUserRole(uid, roleId, uid);
      }
    } catch (error) {
      console.error('創建或更新用戶資料失敗:', error);
      throw error;
    }
  }

  /**
   * 分配用戶角色
   */
  async assignUserRole(
    uid: string, 
    roleId: string, 
    assignedBy: string,
    expiresAt?: string
  ): Promise<void> {
    try {
      const userRoleRef = doc(db, 'userRoles', uid);
      const userRoleData: UserRole = {
        uid,
        roleId,
        assignedBy,
        assignedAt: new Date().toISOString(),
        isActive: true,
      };
      
      // 只有當 expiresAt 有值時才包含
      if (expiresAt) {
        userRoleData.expiresAt = expiresAt;
      }
      
      await setDoc(userRoleRef, userRoleData);
    } catch (error) {
      console.error('分配用戶角色失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取用戶權限檢查結果
   */
  async checkUserPermission(
    uid: string, 
    permissionId: string
  ): Promise<PermissionCheck> {
    try {
      // 獲取用戶資料
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        return { hasPermission: false, role: null, userProfile: null };
      }
      
      const userProfile = userDoc.data() as UserProfile;
      
      // 獲取用戶角色
      const userRoleRef = doc(db, 'userRoles', uid);
      const userRoleDoc = await getDoc(userRoleRef);
      
      if (!userRoleDoc.exists()) {
        return { hasPermission: false, role: null, userProfile };
      }
      
      const userRole = userRoleDoc.data() as UserRole;
      
      // 檢查角色是否過期
      if (userRole.expiresAt && new Date(userRole.expiresAt) < new Date()) {
        return { hasPermission: false, role: null, userProfile };
      }
      
      // 獲取角色詳細資訊
      const roleRef = doc(db, 'roles', userRole.roleId);
      const roleDoc = await getDoc(roleRef);
      
      if (!roleDoc.exists()) {
        return { hasPermission: false, role: null, userProfile };
      }
      
      const role = roleDoc.data() as Role;
      
      // 擁有者擁有所有權限
      if (isOwner(uid)) {
        return { hasPermission: true, role, userProfile };
      }
      
      // 檢查角色是否包含所需權限
      const hasPermission = role.permissions.includes(permissionId);
      
      return { hasPermission, role, userProfile };
    } catch (error) {
      console.error('檢查用戶權限失敗:', error);
      return { hasPermission: false, role: null, userProfile: null };
    }
  }

  /**
   * 創建自定義角色
   */
  async createCustomRole(
    role: Omit<Role, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>,
    createdBy: string
  ): Promise<string> {
    try {
      const roleId = `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const now = new Date().toISOString();
      
      const newRole: Role = {
        ...role,
        id: roleId,
        isCustom: true,
        createdAt: now,
        createdBy,
        updatedAt: now,
        updatedBy: createdBy,
      };
      
      const roleRef = doc(db, 'roles', roleId);
      await setDoc(roleRef, newRole);
      
      return roleId;
    } catch (error) {
      console.error('創建自定義角色失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取所有角色
   */
  async getAllRoles(): Promise<Role[]> {
    try {
      const rolesRef = collection(db, 'roles');
      const rolesSnapshot = await getDocs(rolesRef);
      
      return rolesSnapshot.docs.map(doc => doc.data() as Role);
    } catch (error) {
      console.error('獲取所有角色失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取所有權限
   */
  async getAllPermissions(): Promise<Permission[]> {
    try {
      const permissionsRef = collection(db, 'permissions');
      const permissionsSnapshot = await getDocs(permissionsRef);
      
      return permissionsSnapshot.docs.map(doc => doc.data() as Permission);
    } catch (error) {
      console.error('獲取所有權限失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取所有用戶資料
   */
  async getAllUsers(): Promise<UserProfile[]> {
    try {
      const usersRef = collection(db, 'users');
      const usersSnapshot = await getDocs(usersRef);
      
      return usersSnapshot.docs.map(doc => doc.data() as UserProfile);
    } catch (error) {
      console.error('獲取所有用戶失敗:', error);
      throw error;
    }
  }

  /**
   * 更新角色權限
   */
  async updateRolePermissions(
    roleId: string, 
    permissions: string[], 
    updatedBy: string
  ): Promise<void> {
    try {
      const roleRef = doc(db, 'roles', roleId);
      await updateDoc(roleRef, {
        permissions,
        updatedAt: new Date().toISOString(),
        updatedBy,
      });
    } catch (error) {
      console.error('更新角色權限失敗:', error);
      throw error;
    }
  }

  /**
   * 刪除自定義角色
   */
  async deleteCustomRole(roleId: string): Promise<void> {
    try {
      const roleRef = doc(db, 'roles', roleId);
      const roleDoc = await getDoc(roleRef);
      
      if (!roleDoc.exists()) {
        throw new Error('角色不存在');
      }
      
      const role = roleDoc.data() as Role;
      
      if (!role.isCustom) {
        throw new Error('無法刪除系統預設角色');
      }
      
      await deleteDoc(roleRef);
    } catch (error) {
      console.error('刪除自定義角色失敗:', error);
      throw error;
    }
  }

  /**
   * 獲取用戶的資料範圍
   */
  async getUserDataScope(uid: string): Promise<DataScope> {
    try {
      const scopeRef = doc(db, 'dataScopes', uid);
      const scopeDoc = await getDoc(scopeRef);
      
      if (scopeDoc.exists()) {
        return scopeDoc.data() as DataScope;
      }
      
      // 預設資料範圍
      return {
        uid,
        scope: 'own',
      };
    } catch (error) {
      console.error('獲取用戶資料範圍失敗:', error);
      return { uid, scope: 'own' };
    }
  }
}

// 導出單例實例
export const permissionService = PermissionService.getInstance(); 