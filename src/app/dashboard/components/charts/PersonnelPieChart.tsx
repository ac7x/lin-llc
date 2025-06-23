'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROLE_NAMES } from '@/constants/roles';

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
  if (loading) {
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
                `${value} ${ROLE_NAMES[name as keyof typeof ROLE_NAMES] || name}`
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