"use client";

import React from "react";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";

export default function ProjectLayout({
    children,
    flow,
    journal,
    zones,
    schedule,
    attendance,
    edit,
}: {
    children: React.ReactNode;
    flow: React.ReactNode;
    journal: React.ReactNode;
    zones: React.ReactNode;
    schedule: React.ReactNode;
    attendance: React.ReactNode;
    edit: React.ReactNode;
}) {
    const segments = useSelectedLayoutSegments();
    const currentTab = segments[0] || "default";

    return (
        <main className="max-w-3xl mx-auto px-4 py-8">
            <nav className="mb-6 flex gap-2 border-b border-gray-200 dark:border-neutral-700">
                {[
                    { href: ".", label: "專案詳情", id: "default" },
                    { href: "zones", label: "分區列表", id: "zones" },
                    { href: "schedule", label: "進度排程", id: "schedule" },
                    { href: "flow", label: "工程流程", id: "flow" },
                    { href: "journal", label: "工程日誌", id: "journal" },
                    { href: "attendance", label: "出工人數", id: "attendance" },
                    { href: "edit", label: "編輯", id: "edit" },
                ].map(({ href, label, id }) => (
                    <Link
                        key={id}
                        href={href}
                        className={`px-4 py-2 font-semibold border-b-2 transition hover:text-blue-700
                            ${currentTab === id
                                ? "border-blue-600 text-blue-700"
                                : "border-transparent text-gray-600"}`}
                    >
                        {label}
                    </Link>
                ))}
            </nav>
            {children}
            {flow}
            {journal}
            {zones}
            {schedule}
            {attendance}
            {edit}
        </main>
    );
}