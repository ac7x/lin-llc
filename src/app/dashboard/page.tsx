/**
 * 儀表板頁面
 *
 * 提供系統整體概覽，功能包含：
 * - 專案進度統計
 * - 財務報表
 * - 活動時間軸
 * - 績效指標
 * - 快速操作入口
 */

'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Bar,
} from 'recharts';

import { Workpackage, Project } from '@/app/projects/types/project';
import { Unauthorized } from '@/components/common/Unauthorized';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ROLE_HIERARCHY, ROLE_NAMES } from '@/constants/roles';
import { useAuth } from '@/hooks/useAuth';
import { db, collection } from '@/lib/firebase-client';
import { safeToDate } from '@/utils/dateUtils';
import { calculateProjectProgress } from '../projects/utils/progressUtils';
import { StatCard } from './components/stats/StatCard';

// 抽取圖表顏色配置
const CHART_COLORS = {
  primary: '#8884d8',
  secondary: '#ff7300',
  tertiary: '#ff0000',
  bar: '#82ca9d',
  trend: '#2a8f4d',
  pie: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#2a8f4d', '#8f6b2a'],
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

// 載入狀態組件
const LoadingSpinner = () => (
  <div className='flex items-center justify-center min-h-screen'>
    <div className='animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500'></div>
  </div>
);

// 錯誤狀態組件
const ErrorMessage = ({ message }: { message: string }) => (
  <Alert variant='destructive'>
    <AlertTitle>錯誤</AlertTitle>
    <AlertDescription>{message}</AlertDescription>
  </Alert>
);

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading, hasPermission } = useAuth();

  const [selectedProject, setSelectedProject] = useState<string>('');
  const [workpackagesCount, setWorkpackagesCount] = useState<number>(0);
  const [subWorkpackagesCount, setSubWorkpackagesCount] = useState<number>(0);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);

  const [usersSnapshot, usersLoading, usersError] = useCollection(collection(db, 'members'));
  const [projectsSnapshot, projectsLoading, projectsError] = useCollection(
    collection(db, 'projects')
  );
  const [ordersSnapshot, ordersLoading, ordersError] = useCollection(
    collection(db, 'finance', 'default', 'orders')
  );
  const [quotesSnapshot, quotesLoading, quotesError] = useCollection(
    collection(db, 'finance', 'default', 'quotes')
  );
  const [contractsSnapshot, contractsLoading, contractsError] = useCollection(
    collection(db, 'finance', 'default', 'contracts')
  );

  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (projectsSnapshot && !projectsLoading && !projectsError) {
      setStatsLoading(true);
      let totalWorkpackages = 0;
      let totalSubWorkpackages = 0;

      projectsSnapshot.docs.forEach(doc => {
        const projectData = doc.data();
        if (projectData.workpackages && Array.isArray(projectData.workpackages)) {
          totalWorkpackages += projectData.workpackages.length;

          projectData.workpackages.forEach((workpackage: Workpackage) => {
            if (workpackage.subWorkpackages && Array.isArray(workpackage.subWorkpackages)) {
              totalSubWorkpackages += workpackage.subWorkpackages.length;
            }
          });
        }
      });

      setWorkpackagesCount(totalWorkpackages);
      setSubWorkpackagesCount(totalSubWorkpackages);
      setStatsLoading(false);
    }
  }, [projectsSnapshot, projectsLoading, projectsError]);

  const roleCounts: Record<string, number> = Object.keys(ROLE_HIERARCHY).reduce(
    (acc, role) => {
      acc[role] = 0;
      return acc;
    },
    {} as Record<string, number>
  );
  if (usersSnapshot && !usersLoading && !usersError) {
    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      const role = userData.roles?.[0] || userData.currentRole || 'guest';
      if (roleCounts.hasOwnProperty(role)) {
        roleCounts[role] += 1;
      }
    });
  }

  const roleData = useMemo(
    () => Object.entries(roleCounts).map(([role, count]) => ({ name: role, value: count })),
    [roleCounts]
  );

  const statsList = [
    {
      title: '專案總數',
      loading: projectsLoading,
      error: projectsError,
      value: projectsSnapshot?.size,
    },
    {
      title: '合約總數',
      loading: contractsLoading,
      error: !!contractsError,
      value: contractsSnapshot?.size,
    },
    {
      title: '訂單總數',
      loading: ordersLoading,
      error: !!ordersError,
      value: ordersSnapshot?.size,
    },
    {
      title: '估價單總數',
      loading: quotesLoading,
      error: !!quotesError,
      value: quotesSnapshot?.size,
    },
    { title: '工作包總數', loading: statsLoading, value: workpackagesCount },
    { title: '子工作包總數', loading: statsLoading, value: subWorkpackagesCount },
  ];

  const workpackageProgressData = useMemo(() => {
    if (!projectsSnapshot) return [];
    return projectsSnapshot.docs.map(doc => {
      const projectData = doc.data() as Project;
      const progress = calculateProjectProgress(projectData);
      return {
        name: projectData.projectName,
        progress,
      };
    });
  }, [projectsSnapshot]);

  const projectProgressData = useMemo(() => {
    if (!projectsSnapshot) return [];

    const progressData: Array<{
      date: string;
      progress: number;
      workforce: number;
      projectName: string;
      dailyGrowth: number;
      efficiency: number;
      efficiencyStatus: string;
      averageWorkforce: number;
    }> = [];

    projectsSnapshot.docs.forEach(doc => {
      const projectData = doc.data() as Project;
      if (!selectedProject && projectsSnapshot.docs.length > 0) {
        setSelectedProject(projectsSnapshot.docs[0].data().projectName);
      }

      if (
        projectData.projectName === selectedProject &&
        projectData.reports &&
        Array.isArray(projectData.reports)
      ) {
        const sortedReports = [...projectData.reports].sort(
          (a, b) => {
            const dateA = safeToDate(a.date);
            const dateB = safeToDate(b.date);
            return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
          }
        );

        const calculateRollingAverage = (index: number, windowSize: number = 3) => {
          const startIndex = Math.max(0, index - windowSize + 1);
          const windowReports = sortedReports.slice(startIndex, index + 1);
          const totalWorkforce = windowReports.reduce(
            (sum, report) => sum + (report.workforceCount || 0),
            0
          );
          return windowReports.length > 0 ? totalWorkforce / windowReports.length : 0;
        };

        sortedReports.forEach((report, index) => {
          if (
            report.date &&
            report.projectProgress !== undefined &&
            report.workforceCount !== undefined
          ) {
            const dailyGrowth =
              index > 0 && sortedReports[index - 1]?.projectProgress !== undefined
                ? ((report.projectProgress - (sortedReports[index - 1]?.projectProgress ?? 0)) /
                    (sortedReports[index - 1]?.projectProgress ?? 1)) *
                  100
                : 0;

            const efficiency =
              report.workforceCount > 0
                ? Number((dailyGrowth / report.workforceCount).toFixed(2))
                : 0;

            const rollingAverageWorkforce = calculateRollingAverage(index);

            progressData.push({
              date: (() => {
                const date = safeToDate(report.date);
                return date ? date.toISOString().split('T')[0] : '';
              })(),
              progress: report.projectProgress,
              workforce: report.workforceCount,
              projectName: projectData.projectName,
              dailyGrowth: Number(dailyGrowth.toFixed(2)),
              efficiency,
              efficiencyStatus: efficiency > 5 ? '勤勞' : efficiency < 2 ? '偷懶' : '一般',
              averageWorkforce: Number(rollingAverageWorkforce.toFixed(1)),
            });
          }
        });
      }
    });

    return progressData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [projectsSnapshot, selectedProject]);

  const efficiencyTrendData = useMemo(() => {
    return projectProgressData.map(item => {
      const efficiencyPerPerson =
        item.workforce > 0
          ? Number((item.efficiency / item.workforce).toFixed(2))
          : 0;
      return {
        ...item,
        efficiency: efficiencyPerPerson,
      };
    });
  }, [projectProgressData]);

  const chartConfig = useMemo(
    () => ({
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
            人力趨勢: v => `${v}人`,
          };
          return [formatters[name]?.(value) ?? value, name];
        },
        labelFormatter: formatFullDate,
      },
    }),
    []
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null;
  }

  if (!hasPermission('dashboard')) {
    const roleName = user.currentRole ? ROLE_NAMES[user.currentRole] : '未知角色';
    return <Unauthorized message={`您目前的角色 (${roleName}) 沒有權限訪問儀表板`} />;
  }

  return (
    <main className='max-w-4xl mx-auto mb-20 p-4 sm:p-6 lg:p-8'>
      <div className='space-y-6'>
        <div className='space-y-1'>
          <h1 className='text-2xl font-bold tracking-tight'>管理儀表板</h1>
          <p className='text-muted-foreground'>查看系統活動、專案進度與財務概覽。</p>
        </div>

        <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
          <Card className='lg:col-span-1'>
            <CardHeader>
              <CardTitle>人員分布</CardTitle>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className='flex items-center justify-center h-[260px]'>
                  <Skeleton className='h-48 w-48 rounded-full' />
                </div>
              ) : usersError ? (
                <ErrorMessage message={usersError.message} />
              ) : (
                <ResponsiveContainer width='100%' height={260}>
                  <PieChart>
                    <Pie
                      data={roleData}
                      dataKey='value'
                      nameKey='name'
                      cx='50%'
                      cy='50%'
                      outerRadius={90}
                      label={({ name, value }) => `${value} ${ROLE_NAMES[name] || name}`}
                      labelLine={false}
                    >
                      {roleData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS.pie[index % CHART_COLORS.pie.length]}
                        />
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
                      {usersSnapshot?.size ?? 0}
                    </text>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <div className='grid grid-cols-2 gap-3 lg:col-span-2 content-start'>
            {statsList.map(({ title, loading, error, value }) => (
              <StatCard
                key={title}
                title={title}
                loading={loading}
                error={error}
                value={value?.toString()}
              />
            ))}
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>工作包進度分析</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width='100%' height={300}>
              <RadarChart data={workpackageProgressData}>
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

        <Card>
          <CardHeader>
            <div className='flex flex-wrap items-center justify-between gap-4'>
              <div>
                <CardTitle>專案進度與人力分析</CardTitle>
                <CardDescription>選擇一個專案以查看詳細數據</CardDescription>
              </div>
              <Select value={selectedProject} onValueChange={setSelectedProject}>
                <SelectTrigger className='w-[200px]'>
                  <SelectValue placeholder='選擇專案' />
                </SelectTrigger>
                <SelectContent>
                  {projectsSnapshot?.docs.map(doc => {
                    const projectData = doc.data() as Project;
                    return (
                      <SelectItem key={doc.id} value={projectData.projectName}>
                        {projectData.projectName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            {projectProgressData.length > 0 ? (
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <Card>
                  <CardHeader>
                    <CardTitle className='text-lg'>進度與每日增長</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width='100%' height={300}>
                      <ComposedChart data={projectProgressData}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis {...chartConfig.dateAxis} dataKey='date' />
                        <YAxis
                          yAxisId='progress'
                          label={{ value: '進度 (%)', angle: -90, position: 'insideLeft' }}
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                        />
                        <YAxis
                          yAxisId='growth'
                          orientation='right'
                          label={{ value: '每日增長 (%)', angle: 90, position: 'insideRight' }}
                          domain={[-50, 50]}
                          ticks={[-50, -25, 0, 25, 50]}
                        />
                        <Tooltip {...chartConfig.tooltip} />
                        <Legend />
                        <Line
                          type='monotone'
                          dataKey='progress'
                          name='進度'
                          stroke={CHART_COLORS.primary}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
                          yAxisId='progress'
                        />
                        <Line
                          type='monotone'
                          dataKey='dailyGrowth'
                          name='每日增長'
                          stroke={CHART_COLORS.secondary}
                          strokeWidth={2}
                          dot={{ r: 4 }}
                          activeDot={{ r: 6 }}
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
                      <ComposedChart data={projectProgressData}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis {...chartConfig.dateAxis} dataKey='date' />
                        <YAxis
                          yAxisId='workforce'
                          label={{ value: '人力 (人)', angle: -90, position: 'insideLeft' }}
                          domain={[0, 20]}
                          allowDataOverflow={true}
                        />
                        <YAxis
                          yAxisId='efficiency'
                          orientation='right'
                          label={{ value: '效率 (%)', angle: 90, position: 'insideRight' }}
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                        />
                        <Tooltip {...chartConfig.tooltip} />
                        <Legend />
                        <Bar
                          dataKey='workforce'
                          name='人力'
                          fill={CHART_COLORS.bar}
                          barSize={12}
                          yAxisId='workforce'
                          label={{
                            position: 'center',
                            fill: '#fff',
                            fontSize: 10,
                            formatter: (value: number) => `${value}人`,
                          }}
                        />
                        <Line
                          type='monotone'
                          dataKey='efficiency'
                          name='人力效率'
                          stroke={CHART_COLORS.tertiary}
                          strokeWidth={2}
                          dot={false}
                          yAxisId='efficiency'
                        />
                        <Line
                          type='monotone'
                          dataKey='averageWorkforce'
                          name='人力均值'
                          stroke='#FF69B4'
                          strokeWidth={2}
                          dot={false}
                          yAxisId='workforce'
                          strokeDasharray='5 5'
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
                      <ComposedChart data={projectProgressData}>
                        <CartesianGrid strokeDasharray='3 3' />
                        <XAxis {...chartConfig.dateAxis} dataKey='date' />
                        <YAxis
                          yAxisId='efficiency'
                          label={{ value: '效率 (%)', angle: -90, position: 'insideLeft' }}
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                        />
                        <Tooltip {...chartConfig.tooltip} />
                        <Legend />
                        <Line
                          type='monotone'
                          dataKey='efficiency'
                          name='人力效率'
                          stroke={CHART_COLORS.tertiary}
                          strokeWidth={2}
                          dot={false}
                          yAxisId='efficiency'
                        />
                        <Line
                          type='monotone'
                          dataKey='efficiency'
                          name='效率均值'
                          stroke='#FFD700'
                          strokeWidth={2}
                          dot={false}
                          yAxisId='efficiency'
                          strokeDasharray='5 5'
                          data={efficiencyTrendData}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className='flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400'>
                無可用數據，或請先選擇一個專案。
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
