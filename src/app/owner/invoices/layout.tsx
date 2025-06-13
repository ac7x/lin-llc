import { ReactNode } from "react";
import InvoiceNav from "@/components/side/invoice-nav";

export default function InvoiceLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex">
            <InvoiceNav />
            <div className="flex-1 p-4">{children}</div>
        </div>
    );
}
