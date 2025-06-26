'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  PermissionMatrixGenerator, 
  PERMISSION_CATEGORIES, 
  ROLE_PERMISSION_MAPPING 
} from '@/app/(system)/permissions/lib/permission-matrix';

interface PermissionMatrixAnalyzerProps {
  className?: string;
}

export function PermissionMatrixAnalyzer({ className }: PermissionMatrixAnalyzerProps) {
  const [analysisData, setAnalysisData] = useState<{
    totalPermissions: number;
    rolesCoverage: Record<string, { permissionCount: number; coverage: number }>;
  } | null>(null);
  
  const [permissionMatrix, setPermissionMatrix] = useState<Record<string, Record<string, boolean>>>({});
  const [allPermissions, setAllPermissions] = useState<Array<{
    id: string;
    name: string;
    description: string;
    category: string;
    action: string;
    resource?: string;
  }>>([]);

  useEffect(() => {
    // 載入分析資料
    const coverage = PermissionMatrixGenerator.analyzePermissionCoverage();
    const matrix = PermissionMatrixGenerator.getPermissionMatrix();
    const permissions = PermissionMatrixGenerator.generateAllPermissions();
    
    setAnalysisData(coverage);
    setPermissionMatrix(matrix);
    setAllPermissions(permissions);
  }, []);

  if (!analysisData) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // 按類別分組權限
  const permissionsByCategory = allPermissions.reduce((acc, permission) => {
    if (!acc[permission.category]) {
      acc[permission.category] = [];
    }
    acc[permission.category].push(permission);
    return acc;
  }, {} as Record<string, typeof allPermissions>);

  // 角色資訊
  const roles = Object.entries(ROLE_PERMISSION_MAPPING);

  return (
    <div className={className}>
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">概覽分析</TabsTrigger>
          <TabsTrigger value="matrix">權限矩陣</TabsTrigger>
          <TabsTrigger value="categories">類別分析</TabsTrigger>
        </TabsList>

        {/* 概覽分析 */}
        <TabsContent value="overview" className="space-y-6">
          {/* 總體統計 */}
          <Card>
            <CardHeader>
              <CardTitle>權限系統概覽</CardTitle>
              <CardDescription>系統中的權限分布和角色覆蓋率</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">{analysisData.totalPermissions}</div>
                  <div className="text-sm text-muted-foreground">總權限數</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-secondary">{roles.length}</div>
                  <div className="text-sm text-muted-foreground">角色數量</div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-accent">{Object.keys(PERMISSION_CATEGORIES).length}</div>
                  <div className="text-sm text-muted-foreground">權限類別</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 角色權限覆蓋率 */}
          <Card>
            <CardHeader>
              <CardTitle>角色權限覆蓋率</CardTitle>
              <CardDescription>各角色的權限數量和覆蓋百分比</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {roles.map(([roleId, roleInfo]) => {
                  const coverage = analysisData.rolesCoverage[roleId];
                  const progressValue = roleId === 'owner' ? 100 : coverage?.coverage || 0;
                  
                  return (
                    <div key={roleId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{roleInfo.name}</span>
                          <Badge variant="outline">等級 {roleInfo.level}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {roleId === 'owner' ? '全部權限' : `${coverage?.permissionCount || 0} / ${analysisData.totalPermissions}`}
                        </div>
                      </div>
                      <Progress value={progressValue} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{roleInfo.description}</span>
                        <span>{progressValue.toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 權限矩陣 */}
        <TabsContent value="matrix" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>完整權限矩陣</CardTitle>
              <CardDescription>所有角色與權限的對應關係表</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2 font-medium">權限</th>
                      {roles.map(([roleId, roleInfo]) => (
                        <th key={roleId} className="text-center p-2 font-medium min-w-[100px]">
                          <div className="flex flex-col items-center">
                            <span>{roleInfo.name}</span>
                            <span className="text-xs text-muted-foreground">Level {roleInfo.level}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allPermissions.map((permission) => (
                      <tr key={permission.id} className="border-b hover:bg-muted/30">
                        <td className="p-2">
                          <div>
                            <div className="font-medium">{permission.name}</div>
                            <div className="text-xs text-muted-foreground">{permission.description}</div>
                          </div>
                        </td>
                        {roles.map(([roleId]) => {
                          const hasPermission = permissionMatrix[roleId]?.[permission.id] || false;
                          return (
                            <td key={`${roleId}-${permission.id}`} className="text-center p-2">
                              <div className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium ${
                                hasPermission 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {hasPermission ? '✓' : '✗'}
                              </div>
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

        {/* 類別分析 */}
        <TabsContent value="categories" className="space-y-6">
          {Object.entries(permissionsByCategory).map(([category, permissions]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle>{category} 權限分析</CardTitle>
                <CardDescription>此類別包含 {permissions.length} 個權限</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid gap-2">
                    {permissions.map((permission) => (
                      <div key={permission.id} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <span className="font-medium">{permission.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">{permission.description}</span>
                        </div>
                        <div className="flex space-x-1">
                          {roles.map(([roleId, roleInfo]) => {
                            const hasPermission = permissionMatrix[roleId]?.[permission.id] || false;
                            return (
                              <div
                                key={roleId}
                                className={`w-3 h-3 rounded-full ${
                                  hasPermission ? 'bg-green-500' : 'bg-gray-300'
                                }`}
                                title={`${roleInfo.name}: ${hasPermission ? '有權限' : '無權限'}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
} 