'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { usePermission } from '@/hooks/use-permission';
import { PermissionGuard } from '@/components/permission-guard';
import { Role } from '@/types';
import { isOwner, validateEnvConfig } from '@/lib/env-config';
import { initializePermissions, checkInitialization } from '@/lib/permission-init';

export default function SettingsPage() {
  const {
    userRole,
    userProfile,
    allRoles,
    allPermissions,
    allUsers,
    loading,
    error,
    createCustomRole,
    updateRolePermissions,
    updateRoleName,
    updateRoleDescription,
    deleteCustomRole,
    loadRoles,
  } = usePermission();

  const [initializing, setInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [matrixLoading, setMatrixLoading] = useState<Set<string>>(new Set());
  const [editingRoleName, setEditingRoleName] = useState<string | null>(null);
  const [editingRoleDescription, setEditingRoleDescription] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState<string>('');
  const [editingDescriptionValue, setEditingDescriptionValue] = useState<string>('');
  const [editingMatrixRoleName, setEditingMatrixRoleName] = useState<string | null>(null);
  const [editingMatrixNameValue, setEditingMatrixNameValue] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<string>('overview');

  // 初始化權限系統
  useEffect(() => {
    const initSystem = async () => {
      try {
        setInitializing(true);
        setInitError(null);
        
        // 驗證環境配置
        validateEnvConfig();
        
        // 檢查是否需要初始化
        const needsInit = await checkInitialization();
        if (needsInit) {
          await initializePermissions();
          console.log('權限系統初始化完成');
        }
      } catch (err) {
        setInitError(err instanceof Error ? err.message : '初始化失敗');
      } finally {
        setInitializing(false);
      }
    };

    void initSystem();
  }, []);

  // 處理角色選擇
  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role);
    setSelectedPermissions(role.permissions);
  };

  // 處理權限切換
  const handlePermissionToggle = (permissionId: string) => {
    setSelectedPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  // 保存角色權限
  const handleSaveRolePermissions = async () => {
    if (!selectedRole || !userProfile?.uid) return;
    
    try {
      await updateRolePermissions(selectedRole.id, selectedPermissions);
      await loadRoles();
      setSelectedRole(null);
      setSelectedPermissions([]);
    } catch (err) {
      console.error('保存角色權限失敗:', err);
    }
  };

  // 創建新角色
  const handleCreateRole = async () => {
    if (!userProfile?.uid) return;
    
    const newRole: Omit<Role, 'id' | 'createdAt' | 'createdBy' | 'updatedAt' | 'updatedBy'> = {
      name: '新角色',
      description: '自定義角色',
      level: 10,
      permissions: [],
      isCustom: true,
    };
    
    try {
      await createCustomRole(newRole);
      await loadRoles();
    } catch (err) {
      console.error('創建角色失敗:', err);
    }
  };

  // 刪除角色
  const handleDeleteRole = async (roleId: string) => {
    try {
      await deleteCustomRole(roleId);
      if (selectedRole?.id === roleId) {
        setSelectedRole(null);
        setSelectedPermissions([]);
      }
    } catch (err) {
      console.error('刪除角色失敗:', err);
    }
  };

  // 處理權限矩陣中的權限切換
  const handleMatrixPermissionToggle = async (roleId: string, permissionId: string) => {
    const role = allRoles.find(r => r.id === roleId);
    if (!role) return;

    // 檢查是否為 owner（owner 權限不可調整）
    if (roleId === 'owner') {
      console.warn('無法修改擁有者的權限');
      return;
    }

    const loadingKey = `${roleId}-${permissionId}`;
    setMatrixLoading(prev => new Set(prev).add(loadingKey));

    try {
      const currentPermissions = [...role.permissions];
      const hasPermission = currentPermissions.includes(permissionId);
      
      let newPermissions: string[];
      if (hasPermission) {
        // 移除權限
        newPermissions = currentPermissions.filter(p => p !== permissionId);
      } else {
        // 添加權限
        newPermissions = [...currentPermissions, permissionId];
      }

      await updateRolePermissions(roleId, newPermissions);
      
      // 重新載入角色列表來更新狀態
      await loadRoles();
      
    } catch (err) {
      console.error('更新權限失敗:', err);
    } finally {
      setMatrixLoading(prev => {
        const newSet = new Set(prev);
        newSet.delete(loadingKey);
        return newSet;
      });
    }
  };

  // 處理角色名稱編輯
  const handleRoleNameEdit = async (roleId: string, newName: string) => {
    if (!newName.trim()) return;
    
    try {
      const role = allRoles.find(r => r.id === roleId);
      if (!role || !role.isCustom) return;
      
      // 更新角色名稱
      await updateRoleName(roleId, newName.trim());
      
      // 重新載入角色列表
      await loadRoles();
      
      // 如果正在編輯的是選中的角色，更新選中狀態
      if (selectedRole?.id === roleId) {
        setSelectedRole(prev => prev ? { ...prev, name: newName.trim() } : null);
      }
      
      setEditingRoleName(null);
      setEditingNameValue('');
    } catch (err) {
      console.error('更新角色名稱失敗:', err);
    }
  };

  // 處理角色描述編輯
  const handleRoleDescriptionEdit = async (roleId: string, newDescription: string) => {
    try {
      const role = allRoles.find(r => r.id === roleId);
      if (!role || !role.isCustom) return;
      
      // 更新角色描述
      await updateRoleDescription(roleId, newDescription.trim());
      
      // 重新載入角色列表
      await loadRoles();
      
      // 如果正在編輯的是選中的角色，更新選中狀態
      if (selectedRole?.id === roleId) {
        setSelectedRole(prev => prev ? { ...prev, description: newDescription.trim() } : null);
      }
      
      setEditingRoleDescription(null);
      setEditingDescriptionValue('');
    } catch (err) {
      console.error('更新角色描述失敗:', err);
    }
  };

  // 處理權限矩陣中角色名稱編輯
  const handleMatrixRoleNameEdit = async (roleId: string, newName: string) => {
    if (!newName.trim()) return;
    
    try {
      const role = allRoles.find(r => r.id === roleId);
      if (!role || !role.isCustom) return;
      
      // 更新角色名稱
      await updateRoleName(roleId, newName.trim());
      
      // 重新載入角色列表
      await loadRoles();
      
      setEditingMatrixRoleName(null);
      setEditingMatrixNameValue('');
    } catch (err) {
      console.error('更新角色名稱失敗:', err);
    }
  };

  // 顯示載入狀態
  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-sm text-muted-foreground">
                {initializing ? '初始化權限系統...' : '載入中...'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 顯示錯誤
  if (error || initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>載入失敗</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertDescription>
                {error || initError}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 檢查權限
  if (!userProfile || (!isOwner(userProfile.uid) && !userRole?.permissions.includes('settings:read'))) {
    console.log('權限檢查失敗:');
    console.log('- userProfile:', userProfile);
    console.log('- userProfile?.uid:', userProfile?.uid);
    console.log('- 環境變數 NEXT_PUBLIC_OWNER_UID:', process.env.NEXT_PUBLIC_OWNER_UID);
    console.log('- isOwner(userProfile?.uid):', userProfile?.uid ? isOwner(userProfile.uid) : 'N/A');
    console.log('- userRole:', userRole);
    console.log('- userRole?.permissions:', userRole?.permissions);
    console.log('- 是否有 settings:read 權限:', userRole?.permissions.includes('settings:read'));
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>權限不足</CardTitle>
            <CardDescription>
              您沒有權限訪問此頁面
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground space-y-2">
              <p>用戶 ID: {userProfile?.uid || '未載入'}</p>
              <p>擁有者 ID: {process.env.NEXT_PUBLIC_OWNER_UID || '未設定'}</p>
              <p>是否為擁有者: {userProfile?.uid ? (isOwner(userProfile.uid) ? '是' : '否') : '未知'}</p>
              <p>用戶角色: {userRole?.name || '未載入'}</p>
              <p>權限數量: {userRole?.permissions.length || 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">系統設定</h1>
          <p className="text-muted-foreground">管理權限、角色和系統配置</p>
        </div>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概覽</TabsTrigger>
            <TabsTrigger value="roles">角色管理</TabsTrigger>
            <TabsTrigger value="permissions">權限矩陣</TabsTrigger>
            <TabsTrigger value="users">用戶管理</TabsTrigger>
          </TabsList>

          {/* 概覽頁面 */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>當前用戶</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">角色:</span> {userRole?.name || '未知'}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">權限數量:</span> {userRole?.permissions.length || 0}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">等級:</span> {userRole?.level || '未知'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>系統統計</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <span className="font-medium">角色總數:</span> {allRoles.length}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">權限總數:</span> {allPermissions.length}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <PermissionGuard permission="settings:admin" requireOwner>
                <Card>
                  <CardHeader>
                    <CardTitle>系統管理</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={handleCreateRole} className="w-full">
                      創建新角色
                    </Button>
                  </CardContent>
                </Card>
              </PermissionGuard>
            </div>
          </TabsContent>

          {/* 角色管理頁面 */}
          <TabsContent value="roles" className="space-y-6">
            <PermissionGuard permission="settings:write">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">角色管理</h2>
                <Button onClick={handleCreateRole}>
                  創建新角色
                </Button>
              </div>
            </PermissionGuard>

            <div className="grid gap-6 md:grid-cols-2">
              {/* 角色列表 */}
              <Card>
                <CardHeader>
                  <CardTitle>角色列表</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {allRoles.map((role) => (
                      <div
                        key={role.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedRole?.id === role.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => handleRoleSelect(role)}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            {/* 角色名稱 */}
                            {role.isCustom && editingRoleName === role.id ? (
                              <div className="mb-2">
                                <Input
                                  value={editingNameValue}
                                  onChange={(e) => setEditingNameValue(e.target.value)}
                                  onBlur={() => {
                                    if (editingNameValue.trim()) {
                                      void handleRoleNameEdit(editingRoleName, editingNameValue);
                                    } else {
                                      setEditingRoleName(null);
                                      setEditingNameValue('');
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      if (editingNameValue.trim()) {
                                        void handleRoleNameEdit(editingRoleName, editingNameValue);
                                      }
                                    } else if (e.key === 'Escape') {
                                      setEditingRoleName(null);
                                      setEditingNameValue('');
                                    }
                                  }}
                                  className="h-8 text-sm font-medium"
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <h4 
                                className={`font-medium ${role.isCustom ? 'cursor-pointer hover:text-primary' : ''}`}
                                onClick={(e) => {
                                  if (role.isCustom) {
                                    e.stopPropagation();
                                    setEditingRoleName(role.id);
                                    setEditingNameValue(role.name);
                                  }
                                }}
                              >
                                {role.name}
                              </h4>
                            )}
                            
                            {/* 角色描述 */}
                            {role.isCustom && editingRoleDescription === role.id ? (
                              <div className="mb-2">
                                <Input
                                  value={editingDescriptionValue}
                                  onChange={(e) => setEditingDescriptionValue(e.target.value)}
                                  onBlur={() => {
                                    void handleRoleDescriptionEdit(editingRoleDescription, editingDescriptionValue);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      void handleRoleDescriptionEdit(editingRoleDescription, editingDescriptionValue);
                                    } else if (e.key === 'Escape') {
                                      setEditingRoleDescription(null);
                                      setEditingDescriptionValue('');
                                    }
                                  }}
                                  className="h-8 text-sm"
                                  autoFocus
                                />
                              </div>
                            ) : (
                              <p 
                                className={`text-sm text-muted-foreground ${role.isCustom ? 'cursor-pointer hover:text-primary' : ''}`}
                                onClick={(e) => {
                                  if (role.isCustom) {
                                    e.stopPropagation();
                                    setEditingRoleDescription(role.id);
                                    setEditingDescriptionValue(role.description);
                                  }
                                }}
                              >
                                {role.description}
                              </p>
                            )}
                            
                            <div className="flex gap-1 mt-2">
                              <Badge variant="outline">等級 {role.level}</Badge>
                              {role.isCustom && <Badge variant="secondary">自定義</Badge>}
                            </div>
                          </div>
                          <PermissionGuard permission="settings:write">
                            {role.isCustom && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  void handleDeleteRole(role.id);
                                }}
                              >
                                刪除
                              </Button>
                            )}
                          </PermissionGuard>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 角色權限編輯 */}
              {selectedRole && (
                <Card>
                  <CardHeader>
                    <CardTitle>編輯角色權限</CardTitle>
                    <CardDescription>{selectedRole.name}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">權限設定</h4>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          {allPermissions.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                id={permission.id}
                                checked={selectedPermissions.includes(permission.id)}
                                onChange={() => handlePermissionToggle(permission.id)}
                                className="rounded"
                              />
                              <label htmlFor={permission.id} className="text-sm cursor-pointer">
                                <div className="font-medium">{permission.name}</div>
                                <div className="text-muted-foreground">{permission.description}</div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <PermissionGuard permission="settings:write">
                        <Button onClick={handleSaveRolePermissions} className="w-full">
                          保存權限
                        </Button>
                      </PermissionGuard>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* 權限矩陣頁面 */}
          <TabsContent value="permissions" className="space-y-6">
            <h2 className="text-2xl font-bold">權限矩陣</h2>
            
            <Card>
              <CardHeader>
                <CardTitle>權限對照表</CardTitle>
                <CardDescription>
                  點擊 ✓ 或 ✗ 來切換權限（擁有者權限不可調整）
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">權限</th>
                        {allRoles.map((role) => (
                          <th key={role.id} className="text-center p-2">
                            <div className="flex flex-col items-center">
                              {/* 角色名稱編輯 */}
                              {role.isCustom && editingMatrixRoleName === role.id ? (
                                <Input
                                  value={editingMatrixNameValue}
                                  onChange={(e) => setEditingMatrixNameValue(e.target.value)}
                                  onBlur={() => {
                                    if (editingMatrixNameValue.trim()) {
                                      void handleMatrixRoleNameEdit(editingMatrixRoleName, editingMatrixNameValue);
                                    } else {
                                      setEditingMatrixRoleName(null);
                                      setEditingMatrixNameValue('');
                                    }
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      if (editingMatrixNameValue.trim()) {
                                        void handleMatrixRoleNameEdit(editingMatrixRoleName, editingMatrixNameValue);
                                      }
                                    } else if (e.key === 'Escape') {
                                      setEditingMatrixRoleName(null);
                                      setEditingMatrixNameValue('');
                                    }
                                  }}
                                  className="h-6 text-xs font-medium text-center"
                                  autoFocus
                                />
                              ) : (
                                <span 
                                  className={`font-medium ${role.isCustom ? 'cursor-pointer hover:text-primary' : ''}`}
                                  onClick={() => {
                                    if (role.isCustom) {
                                      setEditingMatrixRoleName(role.id);
                                      setEditingMatrixNameValue(role.name);
                                    }
                                  }}
                                >
                                  {role.name}
                                </span>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {role.isCustom ? '自定義' : '系統'}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {allPermissions.map((permission) => (
                        <tr key={permission.id} className="border-b">
                          <td className="p-2">
                            <div>
                              <div className="font-medium">{permission.name}</div>
                              <div className="text-sm text-muted-foreground">{permission.description}</div>
                            </div>
                          </td>
                          {allRoles.map((role) => {
                            const hasPermission = role.permissions.includes(permission.id);
                            const canEdit = role.id !== 'owner'; // 除了 owner 都可以編輯
                            const loadingKey = `${role.id}-${permission.id}`;
                            const isLoading = matrixLoading.has(loadingKey);
                            
                            return (
                              <td key={role.id} className="text-center p-2">
                                {canEdit ? (
                                  <button
                                    onClick={() => handleMatrixPermissionToggle(role.id, permission.id)}
                                    disabled={isLoading}
                                    className={`inline-flex items-center justify-center w-8 h-8 rounded-full transition-all ${
                                      hasPermission
                                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    } ${
                                      isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                    }`}
                                  >
                                    {isLoading ? (
                                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                      <span className="text-sm font-medium">
                                        {hasPermission ? '✓' : '✗'}
                                      </span>
                                    )}
                                  </button>
                                ) : (
                                  <Badge 
                                    variant={hasPermission ? "default" : "outline"}
                                    className="cursor-default"
                                  >
                                    {hasPermission ? '✓' : '✗'}
                                  </Badge>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 用戶管理頁面 */}
          <TabsContent value="users" className="space-y-6">
            <PermissionGuard permission="user:read">
              <h2 className="text-2xl font-bold">用戶管理</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>用戶列表</CardTitle>
                  <CardDescription>
                    系統中的所有用戶 ({allUsers.length} 個用戶)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {allUsers.map((user) => {
                      const userRole = allRoles.find(role => role.id === user.roleId);
                      return (
                        <div
                          key={user.uid}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="flex-shrink-0">
                              {user.photoURL ? (
                                <Image
                                  src={user.photoURL}
                                  alt={user.displayName}
                                  width={40}
                                  height={40}
                                  className="w-10 h-10 rounded-full"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium">
                                    {user.displayName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="text-sm font-medium truncate">
                                  {user.displayName}
                                </h4>
                                {user.uid === process.env.NEXT_PUBLIC_OWNER_UID && (
                                  <Badge variant="default" className="text-xs">
                                    擁有者
                                  </Badge>
                                )}
                                {!user.isActive && (
                                  <Badge variant="secondary" className="text-xs">
                                    停用
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground truncate">
                                {user.email}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {userRole?.name || '未知角色'}
                                </Badge>
                                <span className="text-xs text-muted-foreground">
                                  登入 {user.loginCount} 次
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right text-xs text-muted-foreground">
                              <div>註冊: {new Date(user.createdAt).toLocaleDateString('zh-TW')}</div>
                              <div>最後登入: {new Date(user.lastLoginAt).toLocaleDateString('zh-TW')}</div>
                            </div>
                            <PermissionGuard permission="user:write">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // TODO: 實現用戶編輯功能
                                  console.log('編輯用戶:', user.uid);
                                }}
                              >
                                編輯
                              </Button>
                            </PermissionGuard>
                          </div>
                        </div>
                      );
                    })}
                    
                    {allUsers.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground">暫無用戶資料</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </PermissionGuard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}