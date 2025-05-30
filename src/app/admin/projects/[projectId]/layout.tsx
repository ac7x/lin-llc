'use client';

import { ProjectSideNav } from '@/modules/shared/interfaces/navigation/side/project-nav';
import { AdminBottomNav } from '@/modules/shared/interfaces/navigation/bottom/admin-nav';

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <ProjectSideNav />
      <div className="flex-1 flex flex-col min-h-screen">
        <main className="flex-1 pb-20 md:pb-0">
          {children}
        </main>
        <div className="md:hidden">
          <AdminBottomNav />
        </div>
      </div>
    </div>
  );
}