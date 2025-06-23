import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

/**
 * 顯示專案進度的雷達圖 (佔位符)
 */
export function ProgressRadarChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>專案進度雷達圖</CardTitle>
      </CardHeader>
      <CardContent className='flex h-64 items-center justify-center'>
        <p className='text-muted-foreground'>Visx Radar Chart 將顯示於此</p>
      </CardContent>
    </Card>
  );
}
