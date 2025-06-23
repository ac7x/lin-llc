import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  children: ReactNode;
}

/**
 * 顯示專案進度的雷達圖
 */
export function ProgressRadarChart({ title, children }: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
