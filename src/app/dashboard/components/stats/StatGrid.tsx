import { StatCard } from './StatCard';

// 從 StatCard 複製屬性介面，以便 StatGrid 使用
interface StatCardData {
  title: string;
  value?: string | number;
  loading?: boolean;
  error?: boolean;
}

interface StatGridProps {
  stats: StatCardData[];
}

/**
 * 統計卡片網格佈局
 * 用於顯示多個統計數據卡片
 */
export function StatGrid({ stats }: StatGridProps) {
  return (
    <div className='grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {stats.map(({ title, ...rest }) => (
        <StatCard key={title} title={title} {...rest} />
      ))}
    </div>
  );
}
