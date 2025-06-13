// src/modules/contract/interfaces/layout/contract-layout.tsx

import { ReactNode } from "react";
import ContractNav from "@/components/side/contract-nav";

export default function ContractLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex">
            <ContractNav />
            <div className="flex-1 p-4">{children}</div>
        </div>
    );
}
