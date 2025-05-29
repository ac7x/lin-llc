"use client";

import { useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import React, { useEffect, useState } from "react";

export default function ProjectLayout({
    flow,
    journal,
    zones,
    schedule,
    attendance,
    edit,
    overview,
}: {
    flow: React.ReactNode;
    journal: React.ReactNode;
    zones: React.ReactNode;
    schedule: React.ReactNode;
    attendance: React.ReactNode;
    edit: React.ReactNode;
    overview: React.ReactNode;
}) {
    const { projectId } = useParams() as { projectId: string };
    const searchParams = useSearchParams();

    const tabs = [
        { label: "專案總覽", key: "overview", content: overview },
        { label: "進度日誌", key: "journal", content: journal },
        { label: "流程管理", key: "flow", content: flow },
        { label: "分區管理", key: "zones", content: zones },
        { label: "排程視覺化", key: "schedule", content: schedule },
        { label: "出工紀錄", key: "attendance", content: attendance },
        { label: "編輯專案", key: "edit", content: edit },
    ];

    const [currentTab, setCurrentTab] = useState("overview");

    useEffect(() => {
        for (const tab of tabs) {
            if (searchParams.has(tab.key)) {
                setCurrentTab(tab.key);
                return;
            }
        }
        setCurrentTab("overview");
    }, [searchParams.toString()]); // 依 query 變化更新

    return (
        <div className="flex max-w-6xl mx-auto px-12 py-8 gap-6">
            {/* 左側側邊欄 */}
            <aside className="w-44 shrink-0 border-r pr-4 ml-20">
                <nav className="flex flex-col gap-2">
                    {tabs.map((tab) => (
                        <Link
                            key={tab.key}
                            href={`/admin/projects/${projectId}?${tab.key}=active`}
                            className={`text-left px-3 py-2 rounded hover:bg-blue-50 font-medium transition ${currentTab === tab.key
                                    ? "bg-blue-100 text-blue-800"
                                    : "text-gray-700"
                                }`}
                        >
                            {tab.label}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* 右側 slot 注入 */}
            <main className="flex-1 min-w-0">
                {tabs.find((tab) => tab.key === currentTab)?.content}
            </main>
        </div>
    );
}