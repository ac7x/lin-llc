import { ReactNode } from "react";
import { QuoteSideNav } from "@/modules/shared/interfaces/navigation/side/quote-nav";

export default function QuotesLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex">
            <QuoteSideNav />
            <div className="flex-1">{children}</div>
        </div>
    );
}