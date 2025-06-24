'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROLE_NAMES } from '@/constants/roles';
import { db } from '@/lib/firebase-client';
import type { CustomRole } from '@/constants/roles';

// 顏色配置
const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

// 錯誤訊息組件
const ErrorMessage = ({ message }: { message: string }) => (
  <Alert variant='destructive'>
    <AlertTitle>錯誤</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
);

interface PersonnelPieChartProps {
  data: { name: string; value: number }[];
  totalUsers: number;
  loading: boolean;
  error: Error | null;
}

/**
 * 人員分佈圓餅圖
 */
export function PersonnelPieChart({ data, totalUsers, loading, error }: PersonnelPieChartProps) {
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // 載入自訂角色以取得角色名稱
  useEffect(() => {
    const loadCustomRoles = async () => {
      try {
        const rolesSnapshot = await getDocs(collection(db, 'customRoles'));
        const roles: CustomRole[] = [];
        rolesSnapshot.forEach(doc => {
          roles.push({ id: doc.id, ...doc.data() } as CustomRole);
        });
        setCustomRoles(roles);
      } catch (error) {
        console.error('Failed to load custom roles:', error);
      } finally {
        setLoadingRoles(false);
      }
    };

    void loadCustomRoles();
  }, []);

  // 取得角色顯示名稱
  const getRoleDisplayName = (roleId: string): string => {
    // 檢查是否為標準角色
    if (roleId in ROLE_NAMES) {
      return ROLE_NAMES[roleId as keyof typeof ROLE_NAMES];
    }
    
    // 檢查是否為自訂角色
    const customRole = customRoles.find(r => r.id === roleId);
    return customRole ? customRole.name : roleId;
  };

  if (loading || loadingRoles) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>人員分布</CardTitle>
        </CardHeader>
        <CardContent className='flex items-center justify-center h-[260px]'>
          <Skeleton className='h-48 w-48 rounded-full' />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>人員分布</CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorMessage message={error.message} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>人員分布</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={260}>
          <PieChart>
            <Pie
              data={data}
              dataKey='value'
              nameKey='name'
              cx='50%'
              cy='50%'
              outerRadius={90}
              label={({ name, value }) =>
                `${value} ${getRoleDisplayName(name)}`
              }
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
              ))}
            </Pie>
            <text
              x='50%'
              y='50%'
              textAnchor='middle'
              dominantBaseline='middle'
              fontSize='28'
              fontWeight='bold'
              fill='hsl(var(--primary))'
            >
              {totalUsers}
            </text>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
} 