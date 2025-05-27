import { FinanceBottomNav } from '@/modules/shared/interfaces/navigation/finance-bottom-nav';

export default function TransactionsPage() {
    return (
        <div className="pb-20">
            <h1 className="text-2xl font-bold mb-4">交易頁面</h1>
            <p>這是交易頁面的內容。</p>
            <FinanceBottomNav />
        </div>
    );
}