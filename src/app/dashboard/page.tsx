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

"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useAuth } from '@/hooks/useAuth';
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
  Bar 
} from 'recharts';
import { Workpackage, Project } from '@/types/project';
import { ROLE_HIERARCHY } from '@/utils/roleHierarchy';
import { db } from '@/lib/firebase-client';
import { collection } from 'firebase/firestore';
import { calculateProjectProgress } from '@/utils/progressUtils';

// 抽取共用樣式
const cardStyles = "bg-white dark:bg-gray-900 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700";
const titleStyles = "text-xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent";
const loadingSpinner = "animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500";

// 抽取圖表顏色配置
const CHART_COLORS = {
  primary: '#8884d8',
  secondary: '#ff7300',
  tertiary: '#ff0000',
  bar: '#82ca9d',
  trend: '#2a8f4d',
  pie: ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#2a8f4d', '#8f6b2a']
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
  <div className="flex items-center justify-center py-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
  </div>
);

// 錯誤狀態組件
const ErrorMessage = ({ message }: { message: string }) => (
  <div className="text-red-500 text-center py-4">錯誤: {message}</div>
);

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // 2. 狀態管理 Hooks
  const [selectedProject, setSelectedProject] = React.useState<string>('');
  const [workpackagesCount, setWorkpackagesCount] = React.useState<number>(0);
  const [subWorkpackagesCount, setSubWorkpackagesCount] = React.useState<number>(0);
  const [statsLoading, setStatsLoading] = React.useState<boolean>(true);

  // 3. Firestore 數據 Hooks
  const [usersSnapshot, usersLoading, usersError] = useCollection(collection(db, 'users'));
  const [projectsSnapshot, projectsLoading, projectsError] = useCollection(collection(db, 'projects'));
  const [ordersSnapshot, ordersLoading, ordersError] = useCollection(collection(db, 'finance', 'default', 'orders'));
  const [quotesSnapshot, quotesLoading, quotesError] = useCollection(collection(db, 'finance', 'default', 'quotes'));
  const [contractsSnapshot, contractsLoading, contractsError] = useCollection(collection(db, 'finance', 'default', 'contracts'));

  // 檢查用戶是否已登入
  React.useEffect(() => {
    if (!authLoading && !user) {
      router.push('/');
    }
  }, [authLoading, user, router]);

  // 5. 工作包統計 Effect
  React.useEffect(() => {
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

  // 6. 統計各角色人數
  const roleCounts: Record<string, number> = Object.keys(ROLE_HIERARCHY).reduce((acc, role) => {
    acc[role] = 0;
    return acc;
  }, {} as Record<string, number>);
  if (usersSnapshot && !usersLoading && !usersError) {
    usersSnapshot.docs.forEach(doc => {
      const role = doc.data().role;
      if (roleCounts.hasOwnProperty(role)) {
        roleCounts[role] += 1;
      }
    });
  }

  // 7. 數據轉換 Memos
  const roleData = React.useMemo(() => 
    Object.entries(roleCounts).map(([role, count]) => ({ name: role, value: count })),
    [roleCounts]
  );

  const workpackageProgressData = React.useMemo(() => {
    if (!projectsSnapshot) return [];
    return projectsSnapshot.docs.map(doc => {
      const projectData = doc.data() as Project;
      const progress = calculateProjectProgress(projectData);
      return {
        name: projectData.projectName,
        progress: progress
      };
    });
  }, [projectsSnapshot]);

  const projectProgressData = React.useMemo(() => {
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
      
      if (projectData.projectName === selectedProject && projectData.reports && Array.isArray(projectData.reports)) {
        const sortedReports = [...projectData.reports].sort((a, b) => 
          a.date.toDate().getTime() - b.date.toDate().getTime()
        );

        const calculateRollingAverage = (index: number, windowSize: number = 3) => {
          const startIndex = Math.max(0, index - windowSize + 1);
          const windowReports = sortedReports.slice(startIndex, index + 1);
          const totalWorkforce = windowReports.reduce((sum, report) => sum + (report.workforceCount || 0), 0);
          return windowReports.length > 0 ? totalWorkforce / windowReports.length : 0;
        };

        sortedReports.forEach((report, index) => {
          if (report.date && report.projectProgress !== undefined && report.workforceCount !== undefined) {
            const dailyGrowth = index > 0 && sortedReports[index - 1]?.projectProgress !== undefined
              ? ((report.projectProgress - (sortedReports[index - 1]?.projectProgress ?? 0)) / (sortedReports[index - 1]?.projectProgress ?? 1)) * 100
              : 0;
            
            const efficiency = report.workforceCount > 0 
              ? Number((dailyGrowth / report.workforceCount).toFixed(2))
              : 0;

            const rollingAverageWorkforce = calculateRollingAverage(index);

            progressData.push({
              date: report.date.toDate().toISOString().split('T')[0],
              progress: report.projectProgress,
              workforce: report.workforceCount,
              projectName: projectData.projectName,
              dailyGrowth: Number(dailyGrowth.toFixed(2)),
              efficiency: efficiency,
              efficiencyStatus: efficiency > 5 ? '勤勞' : efficiency < 2 ? '偷懶' : '一般',
              averageWorkforce: Number(rollingAverageWorkforce.toFixed(1))
            });
          }
        });
      }
    });

    return progressData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [projectsSnapshot, selectedProject]);

  // 8. 圖表配置
  const chartConfig = React.useMemo(() => ({
    dateAxis: {
      tick: { fontSize: 12 },
      tickFormatter: formatDate
    },
    tooltip: {
      formatter: (value: number, name: string) => {
        const formatters: Record<string, (value: number) => string> = {
          '進度': (v) => `${v}%`,
          '每日增長': (v) => `${v > 0 ? '+' : ''}${v}%`,
          '人力效率': (v) => `${v > 0 ? '+' : ''}${v}%`,
          '人力': (v) => `${v}人`,
          '人力趨勢': (v) => `${v}人`
        };
        return [formatters[name]?.(value) ?? value, name];
      },
      labelFormatter: formatFullDate
    }
  }), []);

  // 如果正在載入認證，顯示載入中
  if (authLoading) {
    return <LoadingSpinner />;
  }

  // 如果未登入，不渲染內容
  if (!user) {
    return null;
  }

  // 渲染儀表板內容
  return (
    <main className="max-w-4xl mx-auto mb-20">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-6">業主管理儀表板</h1>
        
        <div className="flex gap-6 flex-col md:flex-row">
          {/* 人員統計區塊 */}
          <section className={`flex-1 min-w-[320px] ${cardStyles}`}>
            <h3 className={titleStyles}>人員分布</h3>
            {usersLoading ? (
              <LoadingSpinner />
            ) : usersError ? (
              <ErrorMessage message={usersError.message} />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${value} ${name}`} labelLine={false}>
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS.pie[index % CHART_COLORS.pie.length]} />
                    ))}
                  </Pie>
                  <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="28" fontWeight="bold" fill="#2a4d8f">
                    {usersSnapshot?.size ?? 0}
                  </text>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </section>

          {/* 小型統計卡片區塊 */}
          <div className="flex gap-3 flex-wrap">
            {[
              { title: '專案總數', loading: projectsLoading, error: projectsError, value: projectsSnapshot?.size },
              { title: '合約總數', loading: contractsLoading, error: contractsError, value: contractsSnapshot?.size },
              { title: '訂單總數', loading: ordersLoading, error: ordersError, value: ordersSnapshot?.size },
              { title: '估價單總數', loading: quotesLoading, error: quotesError, value: quotesSnapshot?.size },
              { title: '工作包總數', loading: statsLoading, value: workpackagesCount },
              { title: '子工作包總數', loading: statsLoading, value: subWorkpackagesCount }
            ].map(({ title, loading, error, value }) => (
              <section key={title} className={`flex-1 min-w-[120px] ${cardStyles} text-center`}>
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</div>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {loading ? (
                    <div className={loadingSpinner}></div>
                  ) : error ? (
                    <span className="text-red-500">錯誤</span>
                  ) : (
                    value ?? 0
                  )}
                </div>
              </section>
            ))}
          </div>
        </div>

        {/* 工作包進度分析圖 */}
        <section className={`mt-8 ${cardStyles}`}>
          <h3 className={titleStyles}>工作包進度分析</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={workpackageProgressData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="進度"
                dataKey="progress"
                stroke={CHART_COLORS.primary}
                fill={CHART_COLORS.primary}
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </section>

        {/* 專案進度變化和使用人力圖表 */}
        <section className={`mt-8 ${cardStyles}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className={titleStyles}>專案進度與人力分析</h3>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {projectsSnapshot?.docs.map((doc) => {
                const projectData = doc.data() as Project;
                return (
                  <option key={projectData.projectName} value={projectData.projectName}>
                    {projectData.projectName}
                  </option>
                );
              })}
            </select>
          </div>
          
          {projectProgressData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 進度與每日增長圖表 */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold mb-4 text-blue-600 dark:text-blue-400">進度與每日增長</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={projectProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis {...chartConfig.dateAxis} dataKey="date" />
                    <YAxis 
                      yAxisId="progress"
                      label={{ value: '進度 (%)', angle: -90, position: 'insideLeft' }}
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                    />
                    <YAxis 
                      yAxisId="growth"
                      orientation="right"
                      label={{ value: '每日增長 (%)', angle: 90, position: 'insideRight' }}
                      domain={[-50, 50]}
                      ticks={[-50, -25, 0, 25, 50]}
                    />
                    <Tooltip {...chartConfig.tooltip} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="progress"
                      name="進度"
                      stroke={CHART_COLORS.primary}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      yAxisId="progress"
                    />
                    <Line
                      type="monotone"
                      dataKey="dailyGrowth"
                      name="每日增長"
                      stroke={CHART_COLORS.secondary}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      yAxisId="growth"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* 人力與效率圖表 */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold mb-4 text-blue-600 dark:text-blue-400">人力與效率分析</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={projectProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis {...chartConfig.dateAxis} dataKey="date" />
                    <YAxis 
                      yAxisId="workforce"
                      label={{ value: '人力 (人)', angle: -90, position: 'insideLeft' }}
                      domain={[0, 20]}
                      allowDataOverflow={true}
                    />
                    <YAxis 
                      yAxisId="efficiency"
                      orientation="right"
                      label={{ value: '效率 (%)', angle: 90, position: 'insideRight' }}
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                    />
                    <Tooltip {...chartConfig.tooltip} />
                    <Legend />
                    <Bar 
                      dataKey="workforce" 
                      name="人力" 
                      fill={CHART_COLORS.bar} 
                      barSize={12}
                      yAxisId="workforce"
                      label={{ 
                        position: 'center',
                        fill: '#fff',
                        fontSize: 10,
                        formatter: (value: number) => `${value}人`
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="efficiency"
                      name="人力效率"
                      stroke={CHART_COLORS.tertiary}
                      strokeWidth={2}
                      dot={false}
                      yAxisId="efficiency"
                    />
                    <Line
                      type="monotone"
                      dataKey="averageWorkforce"
                      name="人力均值"
                      stroke="#FF69B4"
                      strokeWidth={2}
                      dot={false}
                      yAxisId="workforce"
                      strokeDasharray="5 5"
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* 效率趨勢圖表 */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold mb-4 text-blue-600 dark:text-blue-400">效率趨勢分析</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={projectProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis {...chartConfig.dateAxis} dataKey="date" />
                    <YAxis 
                      yAxisId="efficiency"
                      label={{ value: '效率 (%)', angle: -90, position: 'insideLeft' }}
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                    />
                    <Tooltip {...chartConfig.tooltip} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="efficiency"
                      name="人力效率"
                      stroke={CHART_COLORS.tertiary}
                      strokeWidth={2}
                      dot={false}
                      yAxisId="efficiency"
                    />
                    <Line
                      type="monotone"
                      dataKey="efficiency"
                      name="效率均值"
                      stroke="#FFD700"
                      strokeWidth={2}
                      dot={false}
                      yAxisId="efficiency"
                      strokeDasharray="5 5"
                      data={projectProgressData.map((item) => {
                        const efficiencyPerPerson = item.workforce > 0 
                          ? Number((item.efficiency / item.workforce).toFixed(2))
                          : 0;
                        return {
                          ...item,
                          efficiency: efficiencyPerPerson
                        };
                      })}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* 狀態分析圖表 */}
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                <h4 className="text-lg font-semibold mb-4 text-blue-600 dark:text-blue-400">工作狀態分析</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={projectProgressData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis {...chartConfig.dateAxis} dataKey="date" />
                    <YAxis 
                      yAxisId="progress"
                      label={{ value: '進度 (%)', angle: -90, position: 'insideLeft' }}
                      domain={[0, 100]}
                      ticks={[0, 25, 50, 75, 100]}
                    />
                    <YAxis 
                      yAxisId="workforce"
                      orientation="right"
                      label={{ value: '人力 (人)', angle: 90, position: 'insideRight' }}
                      domain={[0, 20]}
                      allowDataOverflow={true}
                    />
                    <Tooltip {...chartConfig.tooltip} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="progress"
                      name="進度"
                      stroke={CHART_COLORS.primary}
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                      yAxisId="progress"
                    />
                    <Bar 
                      dataKey="workforce" 
                      name="人力" 
                      fill={CHART_COLORS.bar} 
                      barSize={12}
                      yAxisId="workforce"
                      label={{ 
                        position: 'center',
                        fill: '#fff',
                        fontSize: 10,
                        formatter: (value: number) => `${value}人`
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500 dark:text-gray-400">
              無可用數據
            </div>
          )}
        </section>
      </div>
    </main>
  );
}