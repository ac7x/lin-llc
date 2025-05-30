import { ReactNode } from "react";
import ArchivedNav from "@/modules/shared/interfaces/navigation/side/archived-nav";

export default function ArchivedLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex">
            <ArchivedNav />
            <div className="flex-1">{children}</div>
        </div>
    );
}
