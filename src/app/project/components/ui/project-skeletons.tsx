import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * 專案列表載入 Skeleton 組件
 */
export function ProjectListSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-2 p-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 flex-1" />
        </div>
      ))}
    </div>
  );
}

/**
 * 專案概覽卡片載入 Skeleton 組件
 */
export function ProjectOverviewSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded" />
              <div className="flex-1">
                <Skeleton className="h-8 w-12 mb-1" />
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * 進度條載入 Skeleton 組件
 */
export function ProgressSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <Skeleton className="h-6 w-24" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-2 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * 專案資訊載入 Skeleton 組件
 */
export function ProjectInfoSkeleton() {
  return (
    <Card className="border-0 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-6 w-24" />
        </div>
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-48" />
      </CardContent>
    </Card>
  );
}

/**
 * 主要內容載入 Skeleton 組件
 */
export function MainContentSkeleton() {
  return (
    <div className="space-y-6">
      {/* 專案資訊 Skeleton */}
      <ProjectInfoSkeleton />
      
      {/* 專案概覽 Skeleton */}
      <ProjectOverviewSkeleton />
      
      {/* 進度條 Skeleton */}
      <ProgressSkeleton />
    </div>
  );
}

/**
 * 右側面板載入 Skeleton 組件
 */
export function RightPanelSkeleton() {
  return (
    <>
      {/* 專案概覽 Skeleton */}
      <div className="text-sm space-y-1">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-8" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-8" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-8" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </>
  );
}

/**
 * 詳細資訊載入 Skeleton 組件
 */
export function DetailsSkeleton() {
  return (
    <div className="text-sm space-y-1">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-3 w-32" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-3 w-24" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-16" />
      </div>
      <Skeleton className="h-3 w-40" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-3 w-16" />
    </div>
  );
} 