import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  title: string;
  value?: string | number;
  icon?: React.ReactNode;
  loading?: boolean;
  error?: boolean;
}

/**
 * 儀表板上的單一統計數據卡片
 */
export function StatCard({ title, value, icon, loading, error }: StatCardProps) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className='h-10'>
          {loading ? (
            <Skeleton className='h-8 w-24' />
          ) : error ? (
            <div className='text-sm font-medium text-destructive'>讀取錯誤</div>
          ) : (
            <div className='text-2xl font-bold'>{value ?? 'N/A'}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
