import { AdminBottomNav } from '@/modules/shared/interfaces/navigation/bottom/admin-nav';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="pb-16">
            {children}
            <AdminBottomNav />
        </div>
    );
}
