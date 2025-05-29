"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/modules/shared/infrastructure/persistence/firebase/firebase-client";

type Zone = {
    id: string;
    name: string;
    desc?: string;
    createdAt?: any;
};

// 此頁面已由分區 tab 取代，保留作為 fallback 或導引用途
export default function ZoneDetailPage() {
    return (
        <main className="p-8 text-gray-400">
            請回到分區列表頁面操作。
        </main>
    );
}
