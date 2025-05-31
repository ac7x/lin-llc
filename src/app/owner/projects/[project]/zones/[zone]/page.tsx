"use client";

import { useParams } from "next/navigation";
import { useFirebase } from "@/modules/shared/infrastructure/persistence/firebase/FirebaseContext";
import { Project, Zone } from "@/types/project";
import { Network } from "vis-network/standalone";
import { DataSet } from "vis-data";
import { useRef, useState, useEffect } from "react";

// 型別定義
type NodeType = { id: string; label: string };
type EdgeType = { id: string; from: string; to: string; label: string };

// vis-network manipulation 事件型別
type EditEdgeData = { id: string; label: string };
type DeleteEdgeData = Array<{ id: string }>;
type Callback<T> = (data: T | null) => void;

function NetworkGraph({
    projectId,
    zoneId,
    zones,
    projectName,
}: {
    projectId: string;
    zoneId: string;
    zones: Zone[];
    projectName: string;
}) {
    const containerRef = useRef<HTMLDivElement>(null);
    const networkRef = useRef<Network | null>(null);
    const { db, doc, onSnapshot, setDoc } = useFirebase();
    const [logs, setLogs] = useState<string[]>([]);
    const nodesRef = useRef(new DataSet<NodeType>([]));
    const edgesRef = useRef(new DataSet<EdgeType>([]));
    const isRemoteUpdate = useRef(false);

    // 數據同步核心功能
    useEffect(() => {
        setLogs(prev => [...prev, "開始監聽"]);
        const docRef = doc(db as typeof db, "projects", projectId, "zones_graph", zoneId);

        const unsubscribe = onSnapshot(docRef, (snapshot) => {
            if (snapshot.exists()) {
                isRemoteUpdate.current = true;
                const data = snapshot.data();
                if (data.nodes) nodesRef.current.update(data.nodes);
                if (data.edges) edgesRef.current.update(data.edges);
                setLogs(prev => [...prev, "數據更新完成"]);
                isRemoteUpdate.current = false;
            }
        });

        if (containerRef.current) {
            networkRef.current = new Network(containerRef.current,
                { nodes: nodesRef.current, edges: edgesRef.current },
                {
                    layout: { hierarchical: true },
                    manipulation: {
                        enabled: true,
                        addNode: async (data: NodeType, callback: Callback<NodeType>) => {
                            if (isRemoteUpdate.current) return;
                            try {
                                nodesRef.current.add(data);
                                await setDoc(docRef, { nodes: nodesRef.current.get() }, { merge: true });
                                setLogs(prev => [...prev, `新增節點: ${data.id}`]);
                                callback(data);
                            } catch (error) {
                                setLogs(prev => [...prev, "節點新增失敗"]);
                                callback(null);
                            }
                        },
                        addEdge: async (data: EdgeType, callback: Callback<EdgeType>) => {
                            if (isRemoteUpdate.current) return;
                            try {
                                edgesRef.current.add(data);
                                await setDoc(docRef, { edges: edgesRef.current.get() }, { merge: true });
                                setLogs(prev => [...prev, `新增連線: ${data.id}`]);
                                callback(data);
                            } catch (error) {
                                setLogs(prev => [...prev, "連線新增失敗"]);
                                callback(null);
                            }
                        }
                    }
                }
            );
        }

        return () => unsubscribe();
    }, []);

    return (
        <>
            <div ref={containerRef} style={{ height: "500px" }} />
            <div className="fixed right-2 top-2 bg-white p-2 border rounded shadow-sm max-h-[200px] overflow-y-auto">
                <h3>操作記錄:</h3>
                {logs.map((log, i) => <div key={i}>{log}</div>)}
            </div>
        </>
    );
}

export default function ZoneDetailPage() {
    const params = useParams();
    const projectId = params?.project as string;
    const zoneId = params?.zone as string;

    const { db, doc, useDocument } = useFirebase();  // 新增 useDocument
    const [projectDoc, loading, error] = useDocument(doc(db as typeof db, "projects", projectId));

    if (!projectId || !zoneId) {
        return <div>無效的專案或分區 ID</div>;
    }
    if (loading) return <div>載入中...</div>;
    if (error) return <div>錯誤: {error.message}</div>;
    if (!projectDoc?.exists()) return <div>找不到專案</div>;

    const project = projectDoc.data() as Project;
    const zone = project.zones.find((z: Zone) => z.zoneId === zoneId);
    if (!zone) return <div>找不到分區</div>;

    return (
        <main className="max-w-9xl mx-auto p-4">
            <div className="mt-6">
                <h2 className="text-xl font-bold mb-2">網路圖</h2>
                <NetworkGraph
                    projectId={projectId}
                    zoneId={zoneId}
                    zones={project.zones}
                    projectName={project.projectName}
                />
            </div>
        </main>
    );
}