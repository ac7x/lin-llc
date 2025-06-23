'use client';

import { useState, useEffect, useMemo } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';

import { Workpackage, Project } from '@/app/projects/types/project';
import { calculateProjectProgress } from '@/app/projects/utils/progressUtils';
import { ROLE_HIERARCHY } from '@/constants/roles';
import { db, collection } from '@/lib/firebase-client';
import { safeToDate } from '@/utils/dateUtils';

/**
 * 獲取儀表板所需全部數據的自訂 Hook
 * @param selectedProject - 當前選擇的專案名稱，用於過濾詳細數據
 * @returns 包含儀表板所有數據、載入狀態和錯誤訊息的物件
 */
export function useProjectData(selectedProject: string | null) {
  const [workpackagesCount, setWorkpackagesCount] = useState<number>(0);
  const [subWorkpackagesCount, setSubWorkpackagesCount] = useState<number>(0);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);

  // 1. 數據獲取 (useCollection)
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

  // 2. 衍生狀態計算 (useEffect)
  useEffect(() => {
    if (projectsSnapshot) {
      setStatsLoading(true);
      const { totalWorkpackages, totalSubWorkpackages } = projectsSnapshot.docs.reduce(
        (acc, doc) => {
          const projectData = doc.data() as Project;
          if (projectData.workpackages && Array.isArray(projectData.workpackages)) {
            acc.totalWorkpackages += projectData.workpackages.length;
            projectData.workpackages.forEach((wp: Workpackage) => {
              if (wp.subWorkpackages && Array.isArray(wp.subWorkpackages)) {
                acc.totalSubWorkpackages += wp.subWorkpackages.length;
              }
            });
          }
          return acc;
        },
        { totalWorkpackages: 0, totalSubWorkpackages: 0 }
      );
      setWorkpackagesCount(totalWorkpackages);
      setSubWorkpackagesCount(totalSubWorkpackages);
      setStatsLoading(false);
    }
  }, [projectsSnapshot]);

  // 3. 數據轉換與計算 (useMemo)

  // 人員分佈數據
  const roleData = useMemo(() => {
    if (!usersSnapshot) return [];
    const roleCounts = Object.keys(ROLE_HIERARCHY).reduce(
      (acc, role) => ({ ...acc, [role]: 0 }),
      {} as Record<string, number>
    );

    usersSnapshot.docs.forEach(doc => {
      const userData = doc.data();
      const role = userData.roles?.[0] || userData.currentRole || 'guest';
      if (roleCounts.hasOwnProperty(role)) {
        roleCounts[role] += 1;
      }
    });
    return Object.entries(roleCounts).map(([name, value]) => ({ name, value }));
  }, [usersSnapshot]);

  // 頂部統計卡片數據
  const statsList = useMemo(
    () => [
      {
        title: '專案總數',
        loading: projectsLoading,
        error: !!projectsError,
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
    ],
    [
      projectsLoading, projectsError, projectsSnapshot?.size,
      contractsLoading, contractsError, contractsSnapshot?.size,
      ordersLoading, ordersError, ordersSnapshot?.size,
      quotesLoading, quotesError, quotesSnapshot?.size,
      statsLoading, workpackagesCount, subWorkpackagesCount,
    ]
  );

  // 工作包進度雷達圖數據
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

  // 專案詳細進度與人力分析圖表數據
  const projectProgressData = useMemo(() => {
    if (!projectsSnapshot || !selectedProject) return [];

    const projectDoc = projectsSnapshot.docs.find(
      doc => doc.data().projectName === selectedProject
    );
    if (!projectDoc) return [];

    const projectData = projectDoc.data() as Project;
    if (!projectData.reports || !Array.isArray(projectData.reports)) return [];

    // 1. Sort reports by date to ensure chronological order
    const sortedReports = [...projectData.reports].sort((a, b) => {
      const dateA = safeToDate(a.date);
      const dateB = safeToDate(b.date);
      return (dateA?.getTime() || 0) - (dateB?.getTime() || 0);
    });

    // 2. Filter to keep only the last report for each day
    const dailyReportsMap = new Map<string, (typeof sortedReports)[0]>();
    sortedReports.forEach(report => {
      const date = safeToDate(report.date);
      if (date) {
        const dateString = date.toISOString().split('T')[0];
        dailyReportsMap.set(dateString, report); // Overwrites earlier reports for the same day
      }
    });
    const uniqueDailyReports = Array.from(dailyReportsMap.values());

    const calculateRollingAverage = (data: typeof uniqueDailyReports, index: number, windowSize: number = 3) => {
      const startIndex = Math.max(0, index - windowSize + 1);
      const windowReports = data.slice(startIndex, index + 1);
      const totalWorkforce = windowReports.reduce(
        (sum, report) => sum + (report.workforceCount || 0),
        0
      );
      return windowReports.length > 0 ? totalWorkforce / windowReports.length : 0;
    };

    return uniqueDailyReports.map((report, index) => {
      const prevProgress =
        index > 0 ? uniqueDailyReports[index - 1]?.projectProgress ?? null : null;
      const currentProgress = report.projectProgress ?? 0;

      const dailyGrowth =
        prevProgress !== null
          ? ((currentProgress - prevProgress) / (prevProgress || 1)) * 100
          : 0;

      const efficiency =
        report.workforceCount > 0 ? Number((dailyGrowth / report.workforceCount).toFixed(2)) : 0;
      const rollingAverageWorkforce = calculateRollingAverage(uniqueDailyReports, index);
      const date = safeToDate(report.date);

      return {
        date: date ? date.toISOString().split('T')[0] : '',
        progress: report.projectProgress ?? 0,
        workforce: report.workforceCount || 0,
        projectName: projectData.projectName,
        dailyGrowth: Number(dailyGrowth.toFixed(2)),
        efficiency,
        efficiencyStatus: efficiency > 5 ? '勤勞' : efficiency < 2 ? '偷懶' : '一般',
        averageWorkforce: Number(rollingAverageWorkforce.toFixed(1)),
      };
    });
  }, [projectsSnapshot, selectedProject]);

  // 效率趨勢圖數據
  const efficiencyTrendData = useMemo(() => {
    if (!projectProgressData) return [];
    return projectProgressData.map(item => ({
      ...item,
      averageEfficiency:
        item.workforce > 0 ? Number((item.efficiency / item.workforce).toFixed(2)) : 0,
    }));
  }, [projectProgressData]);


  // 4. 返回所有數據和狀態
  return {
    // 數據
    statsList,
    roleData,
    workpackageProgressData,
    projectProgressData,
    efficiencyTrendData,
    projects: projectsSnapshot?.docs.map(doc => doc.data() as Project) || [],
    totalUsers: usersSnapshot?.size ?? 0,
    // 載入狀態
    loading: {
      users: usersLoading,
      projects: projectsLoading,
      orders: ordersLoading,
      quotes: quotesLoading,
      contracts: contractsLoading,
      stats: statsLoading,
    },
    // 錯誤狀態
    error: {
      users: usersError ?? null,
      projects: projectsError ?? null,
      orders: ordersError ?? null,
      quotes: quotesError ?? null,
      contracts: contractsError ?? null,
    },
  };
}
