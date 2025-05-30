"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

// 定義 QuoteData 型別
interface QuoteItem {
    itemName: string;
    itemPrice: number;
    itemQuantity: number;
}
interface QuoteData {
    clientName: string;
    clientContact: string;
    clientEmail: string;
    quoteItems: QuoteItem[];
    totalPrice: number;
}

export default function QuoteDetailPage() {
    const router = useRouter();
    const { quote } = router.query;
    const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchQuote = async () => {
            if (!quote) return;
            try {
                const quoteDoc = await getDoc(doc(db, "quotes", quote as string));
                if (quoteDoc.exists()) {
                    setQuoteData(quoteDoc.data() as QuoteData);
                } else {
                    setError("Quote not found");
                }
            } catch (err) {
                setError("Error fetching quote: " + (err instanceof Error ? err.message : String(err)));
            } finally {
                setLoading(false);
            }
        };
        fetchQuote();
    }, [quote]);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <main className="max-w-xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-bold mb-4">Quote Details</h1>
            <div>
                {/* 若 quoteData 為 null 則不渲染內容 */}
                {quoteData && (
                    <>
                        <h2 className="text-lg font-semibold">Client Name: {quoteData.clientName}</h2>
                        <p>Contact: {quoteData.clientContact}</p>
                        <p>Email: {quoteData.clientEmail}</p>
                        <h3 className="mt-4">Quote Items:</h3>
                        <ul>
                            {quoteData.quoteItems.map((item, index) => (
                                <li key={index}>
                                    {item.itemName} - ${item.itemPrice} x {item.itemQuantity}
                                </li>
                            ))}
                        </ul>
                        <p className="mt-4">Total Price: ${quoteData.totalPrice}</p>
                    </>
                )}
            </div>
        </main>
    );
}