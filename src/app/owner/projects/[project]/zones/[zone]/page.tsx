"use client";

import { useParams } from "next/navigation";
import { useDocument } from "react-firebase-hooks/firestore";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { useFirebase } from "@/modules/shared/infrastructure/persistence/firebase/FirebaseContext";
import { Project, Zone } from "@/types/project";
import { Network } from "vis-network/standalone";
import { DataSet } from "vis-data";
import { useRef, useState, useEffect } from "react";

// 新增型別定義
type NodeType = { id: string; label: string };
type EdgeType = { id: string; from: string; to: string; label: string };

function NetworkGraph({ projectId, zoneId, zones }: { projectId: string; zoneId: string; zones: Zone[] }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const { db } = useFirebase();
    // 使用泛型指定 DataSet 型別
    const [nodes, setNodes] = useState(new DataSet<NodeType>([]));
    const [edges, setEdges] = useState(new DataSet<EdgeType>([]));

    // 從 Firestore 同步網路圖資料
    useEffect(() => {
        const graphDocRef = doc(db, "projects", projectId, "zones", zoneId, "graph", "data");
        const unsubscribe = onSnapshot(graphDocRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                setNodes(new DataSet<NodeType>(data.nodes || []));
                setEdges(new DataSet<EdgeType>(data.edges || []));
            }
        });
        return () => unsubscribe();
    }, [db, projectId, zoneId]);

    // 若 Firestore 沒有初始化，利用 zones 陣列初始化節點與邊
    useEffect(() => {
        if (nodes.length > 0 || zones.length === 0) return;
        const projectNode: NodeType = { id: "project", label: "專案" };
        const zoneNodes = zones.map(zone => ({ id: zone.zoneId, label: zone.zoneName } as NodeType));
        setNodes(new DataSet<NodeType>([projectNode, ...zoneNodes]));
        const newEdges = zones.map(zone => ({
            id: `edge-${zone.zoneId}`,
            from: zone.zoneId,
            to: "project",
            label: "連接"
        } as EdgeType));
        setEdges(new DataSet<EdgeType>(newEdges));
        updateDoc(doc(db, "projects", projectId, "zones", zoneId, "graph", "data"), {
            nodes: [projectNode, ...zoneNodes],
            edges: newEdges
        }).catch(() => { });
    }, [zones, nodes, db, projectId, zoneId]);

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
                        edges.update({ id: data.id, label: newLabel });
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
    const zone = project.zones.find((z: Zone) => z.zoneId === zoneId);
    if (!zone) return <div>找不到分區</div>;

    return (
        <main className="max-w-3xl mx-auto p-4">
            {/* 新增網路圖區域，傳入 zones 陣列 */}
            <div className="mt-6">
                <h2 className="text-xl font-bold mb-2">網路圖</h2>
                <NetworkGraph projectId={projectId} zoneId={zoneId} zones={project.zones} />
            </div>
        </main>
    );
}
