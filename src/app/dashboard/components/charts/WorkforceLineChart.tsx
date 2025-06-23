import { ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

/**
 * 顯示人力趨勢的線圖
 */
export function WorkforceLineChart({ title, children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
