/**
 * 載入中動畫組件
 * 提供一個統一的載入中動畫效果
 */

export function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center min-h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );
} 