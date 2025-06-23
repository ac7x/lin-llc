import { SidebarNav } from './SidebarNav';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// 佔位導覽項目
const sidebarNavItems = [
  {
    title: '總覽',
    href: '/dashboard/overview', // 假設的新路徑
  },
  {
    title: '日誌',
    href: '/dashboard/logs',
  },
  {
    title: '設定',
    href: '/dashboard/settings',
  },
];

/**
 * 儀表板的共用佈局元件
 */
export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className='hidden space-y-6 p-10 pb-16 md:block'>
      <div className='space-y-0.5'>
        <h2 className='text-2xl font-bold tracking-tight'>儀表板</h2>
        <p className='text-muted-foreground'>管理您的專案、查看數據分析與活動日誌。</p>
      </div>
      <div className='flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0'>
        <aside className='-mx-4 lg:w-1/5'>
          <SidebarNav items={sidebarNavItems} />
        </aside>
        <div className='flex-1 lg:max-w-4xl'>{children}</div>
      </div>
    </div>
  );
}
