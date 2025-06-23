'use client';

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const CHART_COLORS = {
  primary: '#8884d8',
};

interface ProgressRadarChartProps {
  data: { name: string; progress: number }[];
}

/**
 * 顯示專案進度的雷達圖
 */
export function ProgressRadarChart({ data }: ProgressRadarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>工作包進度分析</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width='100%' height={300}>
          <RadarChart data={data}>
            <PolarGrid />
            <PolarAngleAxis dataKey='name' />
            <PolarRadiusAxis angle={30} domain={[0, 100]} />
            <Radar
              name='進度'
              dataKey='progress'
              stroke={CHART_COLORS.primary}
              fill={CHART_COLORS.primary}
              fillOpacity={0.6}
            />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
