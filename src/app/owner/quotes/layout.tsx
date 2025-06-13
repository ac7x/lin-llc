import { ReactNode } from "react";
import QuoteSideNav from "@/components/side/quote-nav";

export default function QuotesLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex">
            <QuoteSideNav />
            <div className="flex-1 p-4">{children}</div>
        </div>
    );
}