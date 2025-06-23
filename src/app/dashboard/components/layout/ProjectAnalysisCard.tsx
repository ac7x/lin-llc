'use client';

import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  ResponsiveContainer,
} from 'recharts';

import { Project } from '@/app/projects/types/project';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CHART_COLORS = {
  primary: '#8884d8',
  secondary: '#ff7300',
  tertiary: '#ff0000',
  bar: '#82ca9d',
};

// 日期格式化函數
const formatDate = (date: Date | string) => {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

const formatFullDate = (date: Date | string) => {
  const d = new Date(date);
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
};

const chartConfig = {
  dateAxis: {
    tick: { fontSize: 12 },
    tickFormatter: formatDate,
  },
  tooltip: {
    formatter: (value: number, name: string) => {
      const formatters: Record<string, (value: number) => string> = {
        進度: v => `${v}%`,
        每日增長: v => `${v > 0 ? '+' : ''}${v}%`,
        人力效率: v => `${v > 0 ? '+' : ''}${v}%`,
        人力: v => `${v}人`,
        人力均值: v => `${v}人`,
      };
      return [formatters[name]?.(value) ?? value, name];
    },
    labelFormatter: formatFullDate,
  },
};

interface ProjectProgressDataItem {
  date: string;
  progress: number;
  workforce: number;
  dailyGrowth: number;
  efficiency: number;
  averageWorkforce: number;
}

interface ProjectAnalysisCardProps {
  projects: Project[];
  selectedProject: string | null;
  onProjectChange: (value: string) => void;
  progressData: ProjectProgressDataItem[];
  efficiencyTrendData: any[]; // 簡化類型，因其結構與 progressData 相似
}

/**
 * 顯示單一專案的詳細進度與人力分析圖表卡片
 */
export function ProjectAnalysisCard({
  projects,
  selectedProject,
  onProjectChange,
  progressData,
  efficiencyTrendData,
}: ProjectAnalysisCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className='flex flex-wrap items-center justify-between gap-4'>
          <div>
            <CardTitle>專案進度與人力分析</CardTitle>
            <CardDescription>選擇一個專案以查看詳細數據</CardDescription>
          </div>
          <Select value={selectedProject ?? ''} onValueChange={onProjectChange}>
            <SelectTrigger className='w-[200px]'>
              <SelectValue placeholder='選擇專案' />
            </SelectTrigger>
            <SelectContent>
              {projects.map(project => (
                <SelectItem key={project.projectName} value={project.projectName}>
                  {project.projectName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {progressData.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>進度與每日增長</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <ComposedChart data={progressData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis {...chartConfig.dateAxis} dataKey='date' />
                    <YAxis
                      key='progress-y-axis'
                      yAxisId='progress'
                      label={{ value: '進度 (%)', angle: -90, position: 'insideLeft' }}
                      domain={[0, 100]}
                    />
                    <YAxis
                      key='growth-y-axis'
                      yAxisId='growth'
                      orientation='right'
                      label={{ value: '每日增長 (%)', angle: 90, position: 'insideRight' }}
                    />
                    <Tooltip {...chartConfig.tooltip} />
                    <Legend />
                    <Line
                      key='progress-line'
                      type='monotone'
                      dataKey='progress'
                      name='進度'
                      stroke={CHART_COLORS.primary}
                      yAxisId='progress'
                    />
                    <Line
                      key='daily-growth-line'
                      type='monotone'
                      dataKey='dailyGrowth'
                      name='每日增長'
                      stroke={CHART_COLORS.secondary}
                      yAxisId='growth'
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className='text-lg'>人力與效率分析</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <ComposedChart data={progressData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis {...chartConfig.dateAxis} dataKey='date' />
                    <YAxis
                      key='workforce-y-axis'
                      yAxisId='workforce'
                      label={{ value: '人力 (人)', angle: -90, position: 'insideLeft' }}
                    />
                    <YAxis
                      key='efficiency-y-axis'
                      yAxisId='efficiency'
                      orientation='right'
                      label={{ value: '效率 (%)', angle: 90, position: 'insideRight' }}
                    />
                    <Tooltip {...chartConfig.tooltip} />
                    <Legend />
                    <Bar key='workforce-bar' dataKey='workforce' name='人力' fill={CHART_COLORS.bar} yAxisId='workforce' />
                    <Line
                      key='efficiency-line'
                      type='monotone'
                      dataKey='efficiency'
                      name='人力效率'
                      stroke={CHART_COLORS.tertiary}
                      yAxisId='efficiency'
                    />
                    <Line
                      key='avg-workforce-line'
                      type='monotone'
                      dataKey='averageWorkforce'
                      name='人力均值'
                      stroke='#FF69B4'
                      strokeDasharray='5 5'
                      yAxisId='workforce'
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className='md:col-span-2'>
              <CardHeader>
                <CardTitle className='text-lg'>效率趨勢分析</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width='100%' height={300}>
                  <ComposedChart data={efficiencyTrendData}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis {...chartConfig.dateAxis} dataKey='date' />
                    <YAxis
                      yAxisId='efficiency'
                      label={{ value: '效率 (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip {...chartConfig.tooltip} />
                    <Legend />
                    <Line
                      key='efficiency-trend-line'
                      type='monotone'
                      dataKey='efficiency'
                      name='人力效率'
                      stroke={CHART_COLORS.tertiary}
                      yAxisId='efficiency'
                    />
                    <Line
                      key='avg-efficiency-line'
                      type='monotone'
                      dataKey='averageEfficiency'
                      name='效率均值'
                      stroke='#FFD700'
                      strokeDasharray='5 5'
                      yAxisId='efficiency'
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className='flex items-center justify-center h-[300px] text-muted-foreground'>
            請先選擇一個專案以查看數據。
          </div>
        )}
      </CardContent>
    </Card>
  );
} 