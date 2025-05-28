import { AdminBottomNav } from '@/modules/shared/interfaces/navigation/admin-bottom-nav';

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
