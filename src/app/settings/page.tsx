'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
    loading,
    error,
    createCustomRole,
    updateRolePermissions,
    deleteCustomRole,
    loadRoles,
  } = usePermission();

  const [initializing, setInitializing] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>權限不足</CardTitle>
            <CardDescription>
              您沒有權限訪問此頁面
            </CardDescription>
          </CardHeader>
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

        <Tabs defaultValue="overview" className="space-y-6">
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
                          <div>
                            <h4 className="font-medium">{role.name}</h4>
                            <p className="text-sm text-muted-foreground">{role.description}</p>
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
                  顯示各角色擁有的權限
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
                            {role.name}
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
                          {allRoles.map((role) => (
                            <td key={role.id} className="text-center p-2">
                              {role.permissions.includes(permission.id) ? (
                                <Badge variant="default">✓</Badge>
                              ) : (
                                <Badge variant="outline">✗</Badge>
                              )}
                            </td>
                          ))}
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
              <p className="text-muted-foreground">
                此功能需要額外的用戶管理組件實現
              </p>
            </PermissionGuard>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}