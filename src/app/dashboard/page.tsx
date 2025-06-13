"use client";

import React from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { LineChart, Line } from 'recharts';
import { Workpackage, Project } from '@/types/project';
import { ROLE_HIERARCHY } from '@/utils/roleHierarchy';
import { db } from '@/lib/firebase-client';
import { collection, getDocs } from 'firebase/firestore';
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

  // 四合一折線圖資料處理
  const [multiLineData, setMultiLineData] = React.useState<Array<{ date: string; 訂單: number; 估價單: number; 合約: number; 專案: number }>>([]);
  const [multiLineLoading, setMultiLineLoading] = React.useState(true);
  const [multiLineError, setMultiLineError] = React.useState<string | null>(null);

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

  React.useEffect(() => {
    setMultiLineLoading(true);
    setMultiLineError(null);
    async function fetchAllCreatedAt() {
      try {
        // 取得四個集合的 createdAt
        const [ordersSnap, quotesSnap, contractsSnap, projectsSnap] = await Promise.all([
          getDocs(collection(db, 'finance', 'default', 'orders')),
          getDocs(collection(db, 'finance', 'default', 'quotes')),
          getDocs(collection(db, 'finance', 'default', 'contracts')),
          getDocs(collection(db, 'projects')),
        ]);
        // 依集合分類
        const orders = ordersSnap.docs.map(doc => doc.data()?.createdAt?.toDate ? doc.data().createdAt.toDate() : (doc.data().createdAt instanceof Date ? doc.data().createdAt : null)).filter(Boolean) as Date[];
        const quotes = quotesSnap.docs.map(doc => doc.data()?.createdAt?.toDate ? doc.data().createdAt.toDate() : (doc.data().createdAt instanceof Date ? doc.data().createdAt : null)).filter(Boolean) as Date[];
        const contracts = contractsSnap.docs.map(doc => doc.data()?.createdAt?.toDate ? doc.data().createdAt.toDate() : (doc.data().createdAt instanceof Date ? doc.data().createdAt : null)).filter(Boolean) as Date[];
        const projects = projectsSnap.docs.map(doc => doc.data()?.createdAt?.toDate ? doc.data().createdAt.toDate() : (doc.data().createdAt instanceof Date ? doc.data().createdAt : null)).filter(Boolean) as Date[];
        // 將所有日期合併，找出所有出現過的日期
        const allDatesSet = new Set<string>();
        [orders, quotes, contracts, projects].forEach(arr => {
          arr.forEach((d: Date) => allDatesSet.add(d.toISOString().slice(0, 10)));
        });
        const allDates = Array.from(allDatesSet).sort();
        // 依日期累積數量
        function getCumulative(arr: Date[], allDates: string[]): number[] {
          const dateCounts: Record<string, number> = {};
          arr.forEach((d: Date) => {
            const dateStr = d.toISOString().slice(0, 10);
            dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
          });
          let cumulative = 0;
          return allDates.map(date => {
            cumulative += dateCounts[date] || 0;
            return cumulative;
          });
        }
        const ordersC = getCumulative(orders, allDates);
        const quotesC = getCumulative(quotes, allDates);
        const contractsC = getCumulative(contracts, allDates);
        const projectsC = getCumulative(projects, allDates);
        // 組合成圖表資料
        const chartData = allDates.map((date, i) => ({
          date,
          訂單: ordersC[i],
          估價單: quotesC[i],
          合約: contractsC[i],
          專案: projectsC[i],
        }));
        setMultiLineData(chartData);
      } catch (err: unknown) {
        setMultiLineError((err as Error).message || '載入資料失敗');
      } finally {
        setMultiLineLoading(false);
      }
    }
    fetchAllCreatedAt();
  }, []);

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

  // 專案狀態分布數據
  const projectStatusData = React.useMemo(() => {
    if (!projectsSnapshot) return [];
    const statusCounts = projectsSnapshot.docs.reduce((acc, doc) => {
      const status = doc.data().status;
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(statusCounts).map(([name, value]) => ({
      name,
      value
    }));
  }, [projectsSnapshot]);

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

  // 財務趨勢分析數據
  const financialData = React.useMemo(() => {
    if (!ordersSnapshot || !quotesSnapshot || !contractsSnapshot) return [];
    
    const allDates = new Set<string>();
    const data: Record<string, { orders: number; quotes: number; contracts: number }> = {};

    // 處理訂單數據
    ordersSnapshot.docs.forEach(doc => {
      const date = doc.data().createdAt.toDate().toISOString().split('T')[0];
      allDates.add(date);
      if (!data[date]) data[date] = { orders: 0, quotes: 0, contracts: 0 };
      data[date].orders += doc.data().totalAmount || 0;
    });

    // 處理估價單數據
    quotesSnapshot.docs.forEach(doc => {
      const date = doc.data().createdAt.toDate().toISOString().split('T')[0];
      allDates.add(date);
      if (!data[date]) data[date] = { orders: 0, quotes: 0, contracts: 0 };
      data[date].quotes += doc.data().totalAmount || 0;
    });

    // 處理合約數據
    contractsSnapshot.docs.forEach(doc => {
      const date = doc.data().createdAt.toDate().toISOString().split('T')[0];
      allDates.add(date);
      if (!data[date]) data[date] = { orders: 0, quotes: 0, contracts: 0 };
      data[date].contracts += doc.data().totalAmount || 0;
    });

    return Array.from(allDates).sort().map(date => ({
      date,
      ...data[date]
    }));
  }, [ordersSnapshot, quotesSnapshot, contractsSnapshot]);

  return (
    <main className="max-w-4xl mx-auto">
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

        {/* 四合一折線圖區塊 */}
        <section className="mt-8 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">專案/合約/訂單/估價單建立數量</h3>
          {multiLineLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : multiLineError ? (
            <div className="text-red-500 text-center py-4">錯誤: {multiLineError}</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={multiLineData} margin={{ top: 16, right: 32, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 14 }} stroke="#6b7280" />
                <YAxis allowDecimals={false} tick={{ fontSize: 14 }} stroke="#6b7280" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="專案" name="專案" stroke="#FFBB28" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="合約" name="合約" stroke="#0088FE" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="訂單" name="訂單" stroke="#00C49F" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="估價單" name="估價單" stroke="#8884d8" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* 專案狀態分布圖 */}
        <section className="mt-8 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">專案狀態分布</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={projectStatusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {projectStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </section>

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

        {/* 財務趨勢分析圖 */}
        <section className="mt-8 bg-white dark:bg-gray-900 rounded-xl p-6 shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold mb-4 bg-gradient-to-r from-blue-600 to-blue-400 bg-clip-text text-transparent">財務趨勢分析</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={financialData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="orders" stackId="1" stroke="#8884d8" fill="#8884d8" />
              <Area type="monotone" dataKey="quotes" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
              <Area type="monotone" dataKey="contracts" stackId="1" stroke="#ffc658" fill="#ffc658" />
            </AreaChart>
          </ResponsiveContainer>
        </section>
      </div>
    </main>
  );
}