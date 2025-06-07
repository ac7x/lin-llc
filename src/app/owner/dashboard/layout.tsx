import { ReactNode } from "react";
import DashboardNav from "@/components/dashboard-nav";

export default function DashboardLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex">
            <DashboardNav />
            <div className="flex-1">{children}</div>
        </div>
    );
}
