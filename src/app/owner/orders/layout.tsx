import { ReactNode } from "react";
import { OrderSideNav } from "@/components/side/order-nav";

export default function OrdersLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex">
            <OrderSideNav />
            <div className="flex-1">{children}</div>
        </div>
    );
}
