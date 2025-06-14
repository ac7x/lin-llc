"use client";

import React from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, Bar, ComposedChart, Line as ComposedLine } from 'recharts';
import { Workpackage, Project } from '@/types/project';
import { ROLE_HIERARCHY } from '@/utils/roleHierarchy';
import { db } from '@/lib/firebase-client';
import { collection } from 'firebase/firestore';
import { calculateProjectProgress } from '@/utils/projectProgress';

export default function DashboardPage() {
  // 取得 users 和 projects 集合的 snapshot
  const [usersSnapshot, usersLoading, usersError] = useCollection(collection(db, 'users'));
  const [projectsSnapshot, projectsLoading, projectsError] = useCollection(collection(db, 'projects'));
  // 新增：取得 orders 與 quotes 集合的 snapshot（改為 finance/default 子集合）
  const [ordersSnapshot, ordersLoading, ordersError] = useCollection(collection(db, 'finance', 'default', 'orders'));
  const [quotesSnapshot, quotesLoading, quotesError] = useCollection(collection(db, 'finance', 'default', 'quotes'));
  // 新增：取得 contracts 集合的 snapshot（改為 finance/default 子集合）
  const [contractsSnapshot, contractsLoading, contractsError] = useCollection(collection(db, 'finance', 'default', 'contracts'));

  // 工作包和子工作包統計
  const [workpackagesCount, setWorkpackagesCount] = React.useState<number>(0);
  const [subWorkpackagesCount, setSubWorkpackagesCount] = React.useState<number>(0);
  const [statsLoading, setStatsLoading] = React.useState<boolean>(true);

  // 計算工作包和子工作包數量
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

  // 統計各角色人數
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

  // 將 roleCounts 轉為陣列格式供圖表使用
  const roleData = Object.entries(roleCounts).map(([role, count]) => ({ name: role, value: count }));
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#2a8f4d', '#8f6b2a'];

  // 工作包進度分析數據
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

  const [selectedProject, setSelectedProject] = React.useState<string>('');

  // 專案進度變化和使用人力數據
  const projectProgressData = React.useMemo(() => {
    if (!projectsSnapshot) return [];
    
    const progressData: Array<{
      date: string;
      progress: number;
      workforce: number;
      projectName: string;
      dailyGrowth: number;
      efficiency: number;
    }> = [];

    projectsSnapshot.docs.forEach(doc => {
      const projectData = doc.data() as Project;
      // 如果沒有選擇專案，預設顯示第一個專案
      if (!selectedProject && projectsSnapshot.docs.length > 0) {
        setSelectedProject(projectsSnapshot.docs[0].data().projectName);
      }
      
      // 只處理選定的專案數據
      if (projectData.projectName === selectedProject && projectData.reports && Array.isArray(projectData.reports)) {
        // 按日期排序報告
        const sortedReports = [...projectData.reports].sort((a, b) => 
          a.date.toDate().getTime() - b.date.toDate().getTime()
        );

        sortedReports.forEach((report, index) => {
          if (report.date && report.projectProgress !== undefined && report.workforceCount !== undefined) {
            const dailyGrowth = index > 0 && sortedReports[index - 1]?.projectProgress !== undefined
              ? report.projectProgress - (sortedReports[index - 1]?.projectProgress ?? 0)
              : 0;
            
            const efficiency = report.workforceCount > 0 
              ? Number((dailyGrowth / report.workforceCount).toFixed(2))
              : 0;

            progressData.push({
              date: report.date.toDate().toISOString().split('T')[0],
              progress: report.projectProgress,
              workforce: report.workforceCount,
              projectName: projectData.projectName,
              dailyGrowth: dailyGrowth,
              efficiency: efficiency
            });
          }
        });
      }
    });

    return progressData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [projectsSnapshot, selectedProject]);

  return (
    <main className="max-w-4xl mx-auto mb-20">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent mb-6">業主管理儀表板</h1>
        
        <div className="flex gap-6 flex-col md:flex-row">
          {/* 人員統計區塊 */}
          <section className="flex-1 min-w-[320px] bg-white dark:bg-gray-900 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
            <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">人員分布</h3>
            {usersLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : usersError ? (
              <div className="text-red-500 text-center py-4">錯誤: {usersError.message}</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${value} ${name}`} labelLine={false}>
                    {roleData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
            {/* 專案總數卡片 */}
            <section className="flex-1 min-w-[120px] bg-white dark:bg-gray-900 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">專案總數</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {projectsLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                ) : projectsError ? (
                  <span className="text-red-500">錯誤</span>
                ) : (
                  projectsSnapshot?.size ?? 0
                )}
              </div>
            </section>

            {/* 合約總數卡片 */}
            <section className="flex-1 min-w-[120px] bg-white dark:bg-gray-900 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">合約總數</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {contractsLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                ) : contractsError ? (
                  <span className="text-red-500">錯誤</span>
                ) : (
                  contractsSnapshot?.size ?? 0
                )}
              </div>
            </section>

            {/* 訂單總數卡片 */}
            <section className="flex-1 min-w-[120px] bg-white dark:bg-gray-900 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">訂單總數</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {ordersLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                ) : ordersError ? (
                  <span className="text-red-500">錯誤</span>
                ) : (
                  ordersSnapshot?.size ?? 0
                )}
              </div>
            </section>

            {/* 估價單總數卡片 */}
            <section className="flex-1 min-w-[120px] bg-white dark:bg-gray-900 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">估價單總數</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {quotesLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                ) : quotesError ? (
                  <span className="text-red-500">錯誤</span>
                ) : (
                  quotesSnapshot?.size ?? 0
                )}
              </div>
            </section>

            {/* 工作包總數卡片 */}
            <section className="flex-1 min-w-[120px] bg-white dark:bg-gray-900 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">工作包總數</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {statsLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                ) : (
                  workpackagesCount
                )}
              </div>
            </section>

            {/* 子工作包總數卡片 */}
            <section className="flex-1 min-w-[120px] bg-white dark:bg-gray-900 rounded-xl p-4 shadow-md border border-gray-200 dark:border-gray-700 text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">子工作包總數</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {statsLoading ? (
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                ) : (
                  subWorkpackagesCount
                )}
              </div>
            </section>
          </div>
        </div>

        {/* 工作包進度分析圖 */}
        <section className="mt-8 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">工作包進度分析</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={workpackageProgressData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar
                name="進度"
                dataKey="progress"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </section>

        {/* 專案進度變化和使用人力圖表 */}
        <section className="mt-8 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <div className="flex justify-end items-center mb-2">
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
            <>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={projectProgressData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return `${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <YAxis 
                    label={{ value: '進度 (%)', angle: -90, position: 'insideLeft' }}
                    domain={[0, 100]}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === '進度') return [`${value}%`, name];
                      if (name === '每日增長') return [`${value > 0 ? '+' : ''}${value}%`, name];
                      if (name === '每人力效率') return [`${value > 0 ? '+' : ''}${value}%`, name];
                      return [value, name];
                    }}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="left"
                    wrapperStyle={{
                      paddingLeft: '20px',
                      paddingBottom: '10px'
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="progress"
                    name="進度"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="dailyGrowth"
                    name="每日增長"
                    stroke="#ff7300"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="efficiency"
                    name="每人力效率"
                    stroke="#ff0000"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              {/* 人力變化小區塊 */}
              <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                <ResponsiveContainer width="100%" height={100}>
                  <ComposedChart data={projectProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <YAxis 
                      tick={{ fontSize: 10 }}
                      label={{ value: '人力 (人)', angle: -90, position: 'insideLeft', style: { fontSize: 10 } }}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => {
                        if (name === '人力') return [`${value}人`, name];
                        if (name === '人力趨勢') return [`${value}人`, name];
                        return [value, name];
                      }}
                      labelFormatter={(label) => {
                        const date = new Date(label);
                        return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                    />
                    <Legend 
                      verticalAlign="top" 
                      align="left"
                      wrapperStyle={{
                        paddingLeft: '20px',
                        paddingBottom: '5px'
                      }}
                    />
                    <Bar 
                      dataKey="workforce" 
                      name="人力" 
                      fill="#82ca9d" 
                      barSize={20}
                      label={{ 
                        position: 'center',
                        fill: '#fff',
                        fontSize: 10,
                        formatter: (value: number) => `${value}人`
                      }}
                    />
                    <ComposedLine
                      type="monotone"
                      dataKey="workforce"
                      name="人力趨勢"
                      stroke="#2a8f4d"
                      strokeWidth={2}
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </>
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