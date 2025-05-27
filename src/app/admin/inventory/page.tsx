import { AdminBottomNav } from '@/modules/shared/interfaces/navigation/admin-bottom-nav';

export default function AdminInventoryPage() {
    return (
        <div className="pb-20">
            <h1 className="text-2xl font-bold mb-4">庫存管理</h1>
            <p>這是庫存管理頁面的內容。</p>
            <AdminBottomNav />
        </div>
    );
}
