
import type { ReactNode } from 'react';

export default function ProjectLayout({
  children,      // 預設 slot，對應 /project/page.tsx
  main,          // @main slot
  package: pkg,  // @package slot
  subpackage,    // @subpackage slot
}: {
  children: ReactNode;
  main: ReactNode;
  package: ReactNode;
  subpackage: ReactNode;
}) {
  return (
    <div className="flex flex-col h-full">
      <header>專案 Header</header>
      <div className="flex flex-1">
        <aside>側邊欄</aside>
        <main className="flex-1">
          {children}   {/* /project/page.tsx */}
          {main}      {/* /project/[projectId] */}
          {pkg}       {/* /project/[projectId]/package/[packageId] */}
          {subpackage} {/* /project/[projectId]/package/[packageId]/subpackage/[subpackageId] */}
        </main>
      </div>
    </div>
  );
}