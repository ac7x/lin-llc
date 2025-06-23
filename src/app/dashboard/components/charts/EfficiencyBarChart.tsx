import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

/**
 * 顯示效率分析的長條圖 (佔位符)
 */
export function EfficiencyBarChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>效率分析長條圖</CardTitle>
      </CardHeader>
      <CardContent className='flex h-64 items-center justify-center'>
        <p className='text-muted-foreground'>Visx Bar Chart 將顯示於此</p>
      </CardContent>
    </Card>
  );
}
