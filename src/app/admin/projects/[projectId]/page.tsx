import { ReactNode } from "react";

export default function ProjectLayout({
  children,
  overview,
  journal,
  flow,
  zones,
  schedule,
  attendance,
  edit,
}: {
  children: ReactNode;
  overview: ReactNode;
  journal: ReactNode;
  flow: ReactNode;
  zones: ReactNode;
  schedule: ReactNode;
  attendance: ReactNode;
  edit: ReactNode;
}) {
  return (
    <div>
      <h1>Project Detail</h1>
      <div style={{ display: "flex", gap: "2rem" }}>
        <section style={{ flex: 1 }}>
          <h2>專案總覽</h2>
          {overview}
        </section>
        <section style={{ flex: 1 }}>
          <h2>進度日誌</h2>
          {journal}
        </section>
        <section style={{ flex: 1 }}>
          <h2>流程管理</h2>
          {flow}
        </section>
        <section style={{ flex: 1 }}>
          <h2>分區管理</h2>
          {zones}
        </section>
        <section style={{ flex: 1 }}>
          <h2>排程視覺化</h2>
          {schedule}
        </section>
        <section style={{ flex: 1 }}>
          <h2>出工紀錄</h2>
          {attendance}
        </section>
        <section style={{ flex: 1 }}>
          <h2>編輯專案</h2>
          {edit}
        </section>
      </div>
      {children}
    </div>
  );
}