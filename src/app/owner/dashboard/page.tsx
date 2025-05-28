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
    <main style={{ background: '#f5f6fa', minHeight: '100vh', padding: '32px 0' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 32, background: '#fff', borderRadius: 16, boxShadow: '0 2px 16px #0001' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 32, letterSpacing: 2, color: '#222' }}>業主管理儀表板</h2>
        <div style={{ display: 'flex', gap: 40 }}>
          {/* 人員統計區塊 */}
          <section style={{ flex: 1, minWidth: 320, background: '#f0f4ff', borderRadius: 12, padding: 24, boxShadow: '0 1px 6px #0001' }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: '#2a4d8f' }}>人員分布</h3>
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
          {/* 專案統計區塊 */}
          <section style={{ flex: 1, minWidth: 320, background: '#f8f6f0', borderRadius: 12, padding: 24, boxShadow: '0 1px 6px #0001' }}>
            <h3 style={{ fontSize: 20, fontWeight: 600, marginBottom: 16, color: '#8f6b2a' }}>專案統計</h3>
            <div style={{ fontSize: 48, fontWeight: 700, color: '#8f6b2a', marginBottom: 8 }}>
              {projectsLoading ? '載入中...' : projectsError ? '錯誤' : projectsSnapshot?.size ?? 0}
            </div>
            <div style={{ fontSize: 18, color: '#8f6b2a' }}>專案總數</div>
          </section>
        </div>
      </div>
    </main>
  );
}