import React from "react";

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
    return (
        <main className="max-w-3xl mx-auto px-4 py-8">
            {/* 這裡可以放 tab 導覽列，連到不同 slot */}
            {/* children 是預設 slot（專案總覽） */}
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