"use client";

import React from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { db } from '@/modules/shared/infrastructure/persistence/firebase/firebase-client';
import { collection } from 'firebase/firestore';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function OwnerDashboardPage() {
  // 取得 users 和 projects 集合的 snapshot
  const [usersSnapshot, usersLoading, usersError] = useCollection(collection(db, 'users'));
  const [projectsSnapshot, projectsLoading, projectsError] = useCollection(collection(db, 'projects'));

  // 統計各角色人數
  const roleCounts: Record<string, number> = {
    admin: 0,
    finance: 0,
    owner: 0,
    user: 0,
    vendor: 0,
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
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  return (
    <main>
      <div style={{ marginTop: 24, display: 'flex', gap: 32 }}>
        {/* 人員統計區塊 */}
        <section style={{ flex: 1, minWidth: 260 }}>
          {/* 人員統計圖表 */}
          {usersLoading ? (
            <div>載入中...</div>
          ) : usersError ? (
            <div>錯誤</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={roleData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${value} ${name}`} labelLine={false}>
                  {roleData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" fontSize="22" fontWeight="bold">
                  {usersSnapshot?.size ?? 0}
                </text>
                <Tooltip />
                {/* <Legend /> 移除圖例，底部角色不顯示 */}
              </PieChart>
            </ResponsiveContainer>
          )}
        </section>
        {/* 專案統計區塊 */}
        <section style={{ flex: 1, minWidth: 260 }}>
          <h2>專案統計</h2>
          <ul>
            <li>
              專案總數：{projectsLoading ? '載入中...' : projectsError ? '錯誤' : projectsSnapshot?.size ?? 0}
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}