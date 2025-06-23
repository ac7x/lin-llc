import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

/**
 * 顯示人力趨勢的線圖 (佔位符)
 */
export function WorkforceLineChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>人力趨勢線圖</CardTitle>
      </CardHeader>
      <CardContent className='flex h-64 items-center justify-center'>
        <p className='text-muted-foreground'>Visx Line Chart 將顯示於此</p>
      </CardContent>
    </Card>
  );
}
