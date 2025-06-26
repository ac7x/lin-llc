import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/app/(system)';
import { Permission, Role } from '@/app/(system)/permissions/types';

/**
 * 預設權限定義
 */
export const DEFAULT_PERMISSIONS: Permission[] = [
  // 財務管理權限
  { id: 'finance:read', name: '查看財務', description: '查看財務資料', resource: 'finance', action: 'read', category: 'finance' },
  { id: 'finance:write', name: '編輯財務', description: '編輯財務資料', resource: 'finance', action: 'write', category: 'finance' },
  { id: 'finance:delete', name: '刪除財務', description: '刪除財務資料', resource: 'finance', action: 'delete', category: 'finance' },
  { id: 'finance:admin', name: '財務管理', description: '完整財務管理權限', resource: 'finance', action: 'admin', category: 'finance' },
  
  // 專案管理權限 - 基礎權限
  { id: 'project:read', name: '查看專案', description: '查看專案資料', resource: 'project', action: 'read', category: 'project' },
  { id: 'project:write', name: '編輯專案', description: '編輯專案資料', resource: 'project', action: 'write', category: 'project' },
  { id: 'project:delete', name: '刪除專案', description: '刪除專案資料', resource: 'project', action: 'delete', category: 'project' },
  { id: 'project:admin', name: '專案管理', description: '完整專案管理權限', resource: 'project', action: 'admin', category: 'project' },
  
  // 專案管理權限 - 工作包權限
  { id: 'project:package:read', name: '查看工作包', description: '查看工作包資料', resource: 'project', action: 'package:read', category: 'project' },
  { id: 'project:package:write', name: '編輯工作包', description: '編輯工作包資料', resource: 'project', action: 'package:write', category: 'project' },
  { id: 'project:package:delete', name: '刪除工作包', description: '刪除工作包資料', resource: 'project', action: 'package:delete', category: 'project' },
  { id: 'project:package:create', name: '創建工作包', description: '創建新的工作包', resource: 'project', action: 'package:create', category: 'project' },
  
  // 專案管理權限 - 子工作包權限
  { id: 'project:subpackage:read', name: '查看子工作包', description: '查看子工作包資料', resource: 'project', action: 'subpackage:read', category: 'project' },
  { id: 'project:subpackage:write', name: '編輯子工作包', description: '編輯子工作包資料', resource: 'project', action: 'subpackage:write', category: 'project' },
  { id: 'project:subpackage:delete', name: '刪除子工作包', description: '刪除子工作包資料', resource: 'project', action: 'subpackage:delete', category: 'project' },
  { id: 'project:subpackage:create', name: '創建子工作包', description: '創建新的子工作包', resource: 'project', action: 'subpackage:create', category: 'project' },
  
  // 專案管理權限 - 任務權限
  { id: 'project:task:read', name: '查看任務', description: '查看任務資料', resource: 'project', action: 'task:read', category: 'project' },
  { id: 'project:task:write', name: '編輯任務', description: '編輯任務資料', resource: 'project', action: 'task:write', category: 'project' },
  { id: 'project:task:delete', name: '刪除任務', description: '刪除任務資料', resource: 'project', action: 'task:delete', category: 'project' },
  { id: 'project:task:create', name: '創建任務', description: '創建新的任務', resource: 'project', action: 'task:create', category: 'project' },
  { id: 'project:task:assign', name: '指派任務', description: '指派任務給用戶', resource: 'project', action: 'task:assign', category: 'project' },
  
  // 專案管理權限 - 專案成員權限
  { id: 'project:member:read', name: '查看專案成員', description: '查看專案成員資料', resource: 'project', action: 'member:read', category: 'project' },
  { id: 'project:member:write', name: '編輯專案成員', description: '編輯專案成員資料', resource: 'project', action: 'member:write', category: 'project' },
  { id: 'project:member:add', name: '新增專案成員', description: '新增成員到專案', resource: 'project', action: 'member:add', category: 'project' },
  { id: 'project:member:remove', name: '移除專案成員', description: '從專案移除成員', resource: 'project', action: 'member:remove', category: 'project' },
  
  // 專案管理權限 - 專案設定權限
  { id: 'project:settings:read', name: '查看專案設定', description: '查看專案設定', resource: 'project', action: 'settings:read', category: 'project' },
  { id: 'project:settings:write', name: '編輯專案設定', description: '編輯專案設定', resource: 'project', action: 'settings:write', category: 'project' },
  
  // 用戶管理權限
  { id: 'user:read', name: '查看用戶', description: '查看用戶資料', resource: 'user', action: 'read', category: 'user' },
  { id: 'user:write', name: '編輯用戶', description: '編輯用戶資料', resource: 'user', action: 'write', category: 'user' },
  { id: 'user:delete', name: '刪除用戶', description: '刪除用戶資料', resource: 'user', action: 'delete', category: 'user' },
  { id: 'user:admin', name: '用戶管理', description: '完整用戶管理權限', resource: 'user', action: 'admin', category: 'user' },
  
  // 系統設定權限
  { id: 'settings:read', name: '查看設定', description: '查看系統設定', resource: 'settings', action: 'read', category: 'settings' },
  { id: 'settings:write', name: '編輯設定', description: '編輯系統設定', resource: 'settings', action: 'write', category: 'settings' },
  { id: 'settings:admin', name: '設定管理', description: '完整設定管理權限', resource: 'settings', action: 'admin', category: 'settings' },
  
  // 系統管理權限
  { id: 'system:read', name: '查看系統', description: '查看系統資訊', resource: 'system', action: 'read', category: 'system' },
  { id: 'system:write', name: '編輯系統', description: '編輯系統設定', resource: 'system', action: 'write', category: 'system' },
  { id: 'system:admin', name: '系統管理', description: '完整系統管理權限', resource: 'system', action: 'admin', category: 'system' },
  
  // 底部導航權限控制
  { id: 'navigation:home', name: '首頁導航', description: '顯示首頁導航項目', resource: 'navigation', action: 'home', category: 'navigation' },
  { id: 'navigation:project', name: '專案導航', description: '顯示專案導航項目', resource: 'navigation', action: 'project', category: 'navigation' },
  { id: 'navigation:task', name: '任務導航', description: '顯示任務導航項目', resource: 'navigation', action: 'task', category: 'navigation' },
  { id: 'navigation:account', name: '帳戶導航', description: '顯示帳戶導航項目', resource: 'navigation', action: 'account', category: 'navigation' },
  { id: 'navigation:settings', name: '設定導航', description: '顯示設定導航項目', resource: 'navigation', action: 'settings', category: 'navigation' },
  
  // 儀表板權限
  { id: 'dashboard:read', name: '查看儀表板', description: '查看系統儀表板', resource: 'dashboard', action: 'read', category: 'dashboard' },
  
  // 通知權限
  { id: 'notification:read', name: '查看通知', description: '查看個人通知', resource: 'notification', action: 'read', category: 'notification' },
  { id: 'notification:write', name: '管理通知', description: '管理通知設定', resource: 'notification', action: 'write', category: 'notification' },
];

/**
 * 預設角色定義
 */
export const DEFAULT_ROLES: Omit<Role, 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'>[] = [
  {
    id: 'owner',
    name: '擁有者',
    description: '系統擁有者，擁有所有權限',
    level: 0,
    permissions: DEFAULT_PERMISSIONS.map(p => p.id),
    isCustom: false,
  },
  {
    id: 'admin',
    name: '管理員',
    description: '系統管理員，擁有大部分權限',
    level: 1,
    permissions: [
      'finance:read', 'finance:write', 'finance:admin',
      'project:read', 'project:write', 'project:delete', 'project:admin',
      'project:package:read', 'project:package:write', 'project:package:delete', 'project:package:create',
      'project:subpackage:read', 'project:subpackage:write', 'project:subpackage:delete', 'project:subpackage:create',
      'project:task:read', 'project:task:write', 'project:task:delete', 'project:task:create', 'project:task:assign',
      'project:member:read', 'project:member:write', 'project:member:add', 'project:member:remove',
      'project:settings:read', 'project:settings:write',
      'user:read', 'user:write',
      'settings:read', 'settings:write',
      'system:read',
      'navigation:home', 'navigation:project', 'navigation:task', 'navigation:account', 'navigation:settings',
      'dashboard:read',
      'notification:read', 'notification:write',
    ],
    isCustom: false,
  },
  {
    id: 'manager',
    name: '經理',
    description: '部門經理，擁有部門管理權限',
    level: 2,
    permissions: [
      'finance:read', 'finance:write',
      'project:read', 'project:write',
      'project:package:read', 'project:package:write', 'project:package:create',
      'project:subpackage:read', 'project:subpackage:write', 'project:subpackage:create',
      'project:task:read', 'project:task:write', 'project:task:create', 'project:task:assign',
      'project:member:read', 'project:member:add',
      'project:settings:read',
      'user:read',
      'settings:read',
      'navigation:home', 'navigation:project', 'navigation:task', 'navigation:account',
      'dashboard:read',
      'notification:read',
    ],
    isCustom: false,
  },
  {
    id: 'user',
    name: '一般用戶',
    description: '一般用戶，擁有基本操作權限',
    level: 3,
    permissions: [
      'finance:read',
      'project:read', 'project:write',
      'project:package:read', 'project:package:write', 'project:package:create',
      'project:subpackage:read', 'project:subpackage:write', 'project:subpackage:create',
      'project:task:read', 'project:task:write', 'project:task:create',
      'project:member:read',
      'project:settings:read',
      'navigation:home', 'navigation:project', 'navigation:task', 'navigation:account',
      'dashboard:read',
      'notification:read',
    ],
    isCustom: false,
  },
  {
    id: 'guest',
    name: '訪客',
    description: '訪客用戶，僅有查看權限',
    level: 99,
    permissions: [
      'project:read',
      'project:package:read',
      'project:subpackage:read',
      'project:task:read',
      'project:member:read',
      'navigation:home',
    ],
    isCustom: false,
  },
];

/**
 * 初始化權限和角色
 */
export async function initializePermissions(): Promise<void> {
  try {
    console.log('開始初始化權限和角色...');
    
    // 初始化權限
    for (const permission of DEFAULT_PERMISSIONS) {
      const permissionRef = doc(db, 'permissions', permission.id);
      const permissionDoc = await getDoc(permissionRef);
      
      if (!permissionDoc.exists()) {
        await setDoc(permissionRef, permission);
        console.log(`已創建權限: ${permission.name}`);
      }
    }
    
    // 初始化角色
    const now = new Date().toISOString();
    for (const role of DEFAULT_ROLES) {
      const roleRef = doc(db, 'roles', role.id);
      const roleDoc = await getDoc(roleRef);
      
      if (!roleDoc.exists()) {
        const newRole: Role = {
          ...role,
          createdAt: now,
          createdBy: 'system',
          updatedAt: now,
          updatedBy: 'system',
        };
        
        await setDoc(roleRef, newRole);
        console.log(`已創建角色: ${role.name}`);
      }
    }
    
    console.log('權限和角色初始化完成');
  } catch (error) {
    console.error('初始化權限和角色失敗:', error);
    throw error;
  }
}

/**
 * 檢查是否需要初始化
 */
export async function checkInitialization(): Promise<boolean> {
  try {
    const ownerRoleRef = doc(db, 'roles', 'owner');
    const ownerRoleDoc = await getDoc(ownerRoleRef);
    
    return !ownerRoleDoc.exists();
  } catch (error) {
    console.error('檢查初始化狀態失敗:', error);
    return true;
  }
} 