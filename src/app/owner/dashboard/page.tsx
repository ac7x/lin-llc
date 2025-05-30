"use client";

import React from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { collection, getDocs } from 'firebase/firestore';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

export default function DashboardPage() {
  // 取得 users 和 projects 集合的 snapshot
  const [usersSnapshot, usersLoading, usersError] = useCollection(collection(db, 'users'));
  const [projectsSnapshot, projectsLoading, projectsError] = useCollection(collection(db, 'projects'));
  // 新增：取得 orders 與 quotes 集合的 snapshot
  const [ordersSnapshot, ordersLoading, ordersError] = useCollection(collection(db, 'orders'));
  const [quotesSnapshot, quotesLoading, quotesError] = useCollection(collection(db, 'quotes'));
  // flowsSnapshot 型別修正
  interface FlowDoc {
    id: string;
    projectId: string;
    name?: string;
    date?: string;
    end?: unknown;
    [key: string]: unknown;
  }
  const [flowsSnapshot, setFlowsSnapshot] = React.useState<FlowDoc[]>([]);
  const [flowsLoading, setFlowsLoading] = React.useState(true);
  const [flowsError, setFlowsError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setFlowsLoading(true);
    setFlowsError(null);
    // 取得所有 projects，再取得每個 project 的 flows 子集合
    getDocs(collection(db, 'projects'))
      .then(async (projectsSnap) => {
        const allFlows: FlowDoc[] = [];
        await Promise.all(
          projectsSnap.docs.map(async (projectDoc) => {
            const flowsSnap = await getDocs(collection(db, 'projects', projectDoc.id, 'flows'));
            flowsSnap.docs.forEach(doc => {
              allFlows.push({
                ...doc.data(),
                id: doc.id,
                projectId: projectDoc.id,
              });
            });
          })
        );
        setFlowsSnapshot(allFlows);
      })
      .catch((err: unknown) => {
        setFlowsError((err as Error).message || '載入資料失敗');
      })
      .finally(() => {
        setFlowsLoading(false);
      });
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

  // S曲線資料處理
  let sCurveData: { date: string; value: number }[] = [];
  if (flowsSnapshot && !flowsLoading && !flowsError) {
    // 取得所有完成日期（date 或 end）
    const dateCounts: Record<string, number> = {};
    flowsSnapshot.forEach(data => {
      let dateStr = '';
      if (data.date) {
        dateStr = data.date; // yyyy-mm-dd
      } else if (
        data.end &&
        typeof data.end === 'object' &&
        data.end !== null &&
        'toDate' in data.end &&
        typeof (data.end as { toDate?: unknown }).toDate === 'function'
      ) {
        dateStr = (data.end as { toDate: () => Date }).toDate().toISOString().slice(0, 10);
      }
      if (dateStr) {
        dateCounts[dateStr] = (dateCounts[dateStr] || 0) + 1;
      }
    });
    // 依日期排序並累加
    const sortedDates = Object.keys(dateCounts).sort();
    let cumulative = 0;
    sCurveData = sortedDates.map(date => {
      cumulative += dateCounts[date];
      return { date, value: cumulative };
    });
  }

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
          </div>
        </div>
        {/* S曲線區塊 */}
        <section className="mt-12 bg-gray-50 dark:bg-gray-800 rounded-xl p-6 shadow-md">
          <h3 className="text-xl font-semibold mb-4 text-green-800 dark:text-green-200">流程累積進度（S曲線）</h3>
          {flowsLoading ? (
            <div>載入中...</div>
          ) : flowsError ? (
            <div>錯誤</div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={sCurveData} margin={{ top: 16, right: 32, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 14 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 14 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" name="累積完成數" stroke="#2a8f4d" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </section>
      </div>
    </main>
  );
}