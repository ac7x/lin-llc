import { ReactNode } from "react";
import { QuoteSideNav } from "@/components/side/quote-nav";

export default function QuotesLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex bg-gray-50 dark:bg-gray-900 min-h-screen">
            <QuoteSideNav />
            <div className="flex-1 bg-white dark:bg-gray-800 text-black dark:text-gray-100">
                {children}
            </div>
        </div>
    );
}