import { ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

/**
 * 顯示效率分析的長條圖
 */
export function EfficiencyBarChart({
  title,
  description,
  children,
  className,
}: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && (
          <p className='text-sm text-muted-foreground'>{description}</p>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
