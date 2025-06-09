"use client";

import React from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db, collection, getDocs } from '@/lib/firebase-client';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { Workpackage } from '@/types/project';

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
  const roleCounts: Record<string, number> = {
    admin: 0,
    finance: 0,
    owner: 0,
    user: 0,
    vendor: 0,
    foreman: 0,
    safety: 0,
    coord: 0,
  };
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

  return (
    <main className="min-h-screen py-8 bg-white dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-8 bg-white dark:bg-gray-900 rounded-2xl shadow-lg">
        {/* <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32, letterSpacing: 2, color: '#222' }}>業主管理儀表板</h2> */}
        <div className="flex gap-10 flex-col md:flex-row">
          {/* 人員統計區塊 */}
          <section className="flex-1 min-w-[320px] bg-blue-50 dark:bg-blue-950 rounded-xl p-6 shadow-md mb-6 md:mb-0">
            <h3 className="text-xl font-semibold mb-4 text-blue-900 dark:text-blue-200">人員分布</h3>
            {usersLoading ? (
              <div>載入中...</div>
            ) : usersError ? (
              <div>錯誤</div>
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
          {/* 小型統計卡片區塊（更小更緊湊） */}
          <div className="flex gap-2 flex-wrap mb-6">
            {/* 專案總數卡片 */}
            <section className="flex-1 min-w-[100px] bg-yellow-50 dark:bg-yellow-950 rounded-md p-2 shadow text-center h-[70px] flex flex-col justify-center items-center">
              <div className="text-[11px] text-yellow-800 dark:text-yellow-200 mb-0.5">專案總數</div>
              <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200 leading-tight">
                {projectsLoading ? '...' : projectsError ? '錯誤' : projectsSnapshot?.size ?? 0}
              </div>
            </section>
            {/* 合約總數卡片 */}
            <section className="flex-1 min-w-[100px] bg-blue-50 dark:bg-blue-950 rounded-md p-2 shadow text-center h-[70px] flex flex-col justify-center items-center">
              <div className="text-[11px] text-blue-800 dark:text-blue-200 mb-0.5">合約總數</div>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200 leading-tight">
                {contractsLoading ? '...' : contractsError ? '錯誤' : contractsSnapshot?.size ?? 0}
              </div>
            </section>
            {/* 訂單總數卡片 */}
            <section className="flex-1 min-w-[100px] bg-green-50 dark:bg-green-950 rounded-md p-2 shadow text-center h-[70px] flex flex-col justify-center items-center">
              <div className="text-[11px] text-green-800 dark:text-green-200 mb-0.5">訂單總數</div>
              <div className="text-2xl font-bold text-green-800 dark:text-green-200 leading-tight">
                {ordersLoading ? '...' : ordersError ? '錯誤' : ordersSnapshot?.size ?? 0}
              </div>
            </section>
            {/* 估價單總數卡片 */}
            <section className="flex-1 min-w-[100px] bg-purple-50 dark:bg-purple-950 rounded-md p-2 shadow text-center h-[70px] flex flex-col justify-center items-center">
              <div className="text-[11px] text-purple-800 dark:text-purple-200 mb-0.5">估價單總數</div>
              <div className="text-2xl font-bold text-purple-800 dark:text-purple-200 leading-tight">
                {quotesLoading ? '...' : quotesError ? '錯誤' : quotesSnapshot?.size ?? 0}
              </div>
            </section>
            {/* 工作包總數卡片 */}
            <section className="flex-1 min-w-[100px] bg-orange-50 dark:bg-orange-950 rounded-md p-2 shadow text-center h-[70px] flex flex-col justify-center items-center">
              <div className="text-[11px] text-orange-800 dark:text-orange-200 mb-0.5">工作包總數</div>
              <div className="text-2xl font-bold text-orange-800 dark:text-orange-200 leading-tight">
                {statsLoading ? '...' : workpackagesCount}
              </div>
            </section>
            {/* 子工作包總數卡片 */}
            <section className="flex-1 min-w-[100px] bg-teal-50 dark:bg-teal-950 rounded-md p-2 shadow text-center h-[70px] flex flex-col justify-center items-center">
              <div className="text-[11px] text-teal-800 dark:text-teal-200 mb-0.5">子工作包總數</div>
              <div className="text-2xl font-bold text-teal-800 dark:text-teal-200 leading-tight">
                {statsLoading ? '...' : subWorkpackagesCount}
              </div>
            </section>
          </div>
        </div>
        {/* 四合一折線圖區塊 */}
        <section className="mt-12 bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-blue-800 dark:text-blue-200">專案/合約/訂單/估價單建立數量</h3>
          {multiLineLoading ? (
            <div>載入中...</div>
          ) : multiLineError ? (
            <div>錯誤</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={multiLineData} margin={{ top: 16, right: 32, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 14 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 14 }} />
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
      </div>
    </main>
  );
}