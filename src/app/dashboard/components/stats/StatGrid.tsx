import { StatCard } from './StatCard';

/**
 * 統計卡片網格佈局
 * 用於顯示多個統計數據卡片
 */
export function StatGrid() {
  // 佔位數據
  const stats = [
    { title: '總專案數', value: '0' },
    { title: '進行中專案', value: '0' },
    { title: '總人力', value: '0' },
    { title: '待處理日誌', value: '0' },
  ];

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {stats.map(stat => (
        <StatCard key={stat.title} title={stat.title} value={stat.value} />
      ))}
    </div>
  );
}
