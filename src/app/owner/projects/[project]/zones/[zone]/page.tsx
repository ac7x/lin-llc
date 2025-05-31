"use client";

import { useParams } from "next/navigation";
import { useDocument } from "react-firebase-hooks/firestore";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useFirebase } from "@/modules/shared/infrastructure/persistence/firebase/FirebaseContext";
import { Project, Zone } from "@/types/project";
import { Network } from "vis-network/standalone";
import { DataSet } from "vis-data";
import { useRef, useState, useEffect } from "react";

function NetworkGraph({ projectId, zoneId }: { projectId: string; zoneId: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { db } = useFirebase();
    // 初始預設節點與邊
    const [nodes, setNodes] = useState(new DataSet([
        { id: 1, label: "Zone" },
        { id: 2, label: "Project" },
        // ...existing code...
    ]));
    const [edges, setEdges] = useState(new DataSet([
        { id: 1, from: 1, to: 2, label: "連接" },
        // ...existing code...
    ]));

    // 監聽 Firestore 中圖形資料文件更新（假設存放於 projects/{projectId}/zones/{zoneId}/graph/data）
    useEffect(() => {
        const graphDocRef = doc(db, "projects", projectId, "zones", zoneId, "graph", "data");
        const unsubscribe = onSnapshot(graphDocRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                // 假設 data.nodes 與 data.edges 分別為陣列
                setNodes(new DataSet(data.nodes || []));
                setEdges(new DataSet(data.edges || []));
            }
        });
        return () => unsubscribe();
    }, [db, projectId, zoneId]);

    useEffect(() => {
        if (containerRef.current) {
            const data = { nodes, edges };
            const options = {
                layout: { hierarchical: false },
                physics: { enabled: true },
                manipulation: {
                    enabled: true,
                    initiallyActive: true,
                    editEdge: function (data: any, callback: any) {
                        const newLabel = prompt("請輸入新的邊標籤：", data.label) || data.label;
                        data.label = newLabel;
                        // 更新 edges dataset
                        edges.update({ id: data.id, label: newLabel });
                        // 將最新的 edges 寫回 Firestore
                        const allEdges = edges.get();
                        updateDoc(doc(db, "projects", projectId, "zones", zoneId, "graph", "data"), { edges: allEdges });
                        callback(data);
                    }
                }
            };
            new Network(containerRef.current, data, options);
        }
    }, [containerRef, nodes, edges, db, projectId, zoneId]);

    return <div ref={containerRef} style={{ height: "400px" }} />;
}

export default function ZoneDetailPage() {
    const params = useParams();
    const projectId = params?.project as string; // 確保 projectId 是字串類型
    const zoneId = params?.zone as string;       // 確保 zoneId 是字串類型

    if (!projectId || !zoneId) {
        return <div>無效的專案或分區 ID</div>;
    }

    const { db } = useFirebase();
    const [projectDoc, loading, error] = useDocument(doc(db, "projects", projectId));

    if (loading) return <div>載入中...</div>;
    if (error) return <div>錯誤: {error.message}</div>;
    if (!projectDoc?.exists()) return <div>找不到專案</div>;

    const project = projectDoc.data() as Project;
    const zone = project.zones.find((z: Zone) => z.zoneId === zoneId); // ...existing code...

    if (!zone) return <div>找不到分區</div>;

    return (
        <main className="max-w-3xl mx-auto p-4">
            // ...existing code...
            {/* 新增網路圖區域 */}
            <div className="mt-6">
                <h2 className="text-xl font-bold mb-2">網路圖</h2>
                <NetworkGraph projectId={projectId} zoneId={zoneId} />
            </div>
        </main>
    );
}
