"use client";

import { useParams } from "next/navigation";
import { useDocument } from "react-firebase-hooks/firestore";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { useFirebase } from "@/modules/shared/infrastructure/persistence/firebase/FirebaseContext";
import { Project, Zone } from "@/types/project";
import { Network } from "vis-network/standalone";
import { DataSet } from "vis-data";
import { useRef, useState, useEffect } from "react";

// 新增型別定義
type NodeType = { id: string; label: string };
type EdgeType = { id: string; from: string; to: string; label: string };

// 針對 vis-network 事件的類型
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
    const { db } = useFirebase();
    const [syncStatus, setSyncStatus] = useState<string>("");
    const [operationLogs, setOperationLogs] = useState<string[]>([]);
    // DataSet 只初始化一次
    const nodesRef = useRef(new DataSet<NodeType>([]));
    const edgesRef = useRef(new DataSet<EdgeType>([]));
    // 新增 flag 避免循環觸發
    const isRemoteUpdate = useRef(false);

    // Firestore 監聽只同步 graph 資料到 DataSet
    useEffect(() => {
        setOperationLogs(prev => [...prev, "開始訂閱 Firestore 實時更新"]);
        // graph 資料建議存放於 projects/{projectId}/zones_graph/{zoneId}
        const graphDocRef = doc(db, "projects", projectId, "zones_graph", zoneId);
        const unsubscribe = onSnapshot(graphDocRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                isRemoteUpdate.current = true;
                nodesRef.current.clear();
                edgesRef.current.clear();
                nodesRef.current.add(data.nodes || []);
                edgesRef.current.add(data.edges || []);
                setOperationLogs(prev => [...prev, "從 Firestore 同步更新節點與邊"]);
                isRemoteUpdate.current = false;
            } else if (zones.length > 0) {
                setOperationLogs(prev => [...prev, "Firestore 無資料，開始初始化同步"]);
                const projectNode: NodeType = { id: "project", label: projectName || "專案" };
                const zoneNodes = zones.map(zone => ({ id: zone.zoneId, label: zone.zoneName } as NodeType));
                const newEdges = zones.map(zone => ({
                    id: `edge-${zone.zoneId}`,
                    from: zone.zoneId,
                    to: "project",
                    label: "連接"
                } as EdgeType));
                setDoc(graphDocRef, {
                    nodes: [projectNode, ...zoneNodes],
                    edges: newEdges
                })
                    .then(() => {
                        setOperationLogs(prev => [
                            ...prev,
                            `初始化同步成功: 節點數量=${[projectNode, ...zoneNodes].length}, 邊數量=${newEdges.length}`
                        ]);
                    })
                    .catch(() => {
                        setOperationLogs(prev => [...prev, `初始化同步失敗`]);
                    });
            }
        });
        return () => {
            unsubscribe();
            setOperationLogs(prev => [...prev, "取消訂閱 Firestore"]);
        };
    }, [db, projectId, zoneId, zones, projectName]);

    // Network 實例只初始化一次
    useEffect(() => {
        if (containerRef.current && !networkRef.current) {
            const data = { nodes: nodesRef.current, edges: edgesRef.current };
            const options = {
                layout: { hierarchical: false },
                physics: { enabled: true },
                manipulation: {
                    enabled: true,
                    initiallyActive: true,
                    editEdge: async (data: EditEdgeData, callback: Callback<EditEdgeData>) => {
                        setOperationLogs(prev => [...prev, `開始編輯邊: ${data.id}`]);
                        setOperationLogs(prev => [...prev, "編輯邊操作開始"]);
                        const newLabel = prompt("請輸入新的邊標籤：", data.label) || data.label;
                        data.label = newLabel;
                        // 先寫入 Firestore
                        const allEdges = edgesRef.current.get().map(edge =>
                            edge.id === data.id ? { ...edge, label: newLabel } : edge
                        );
                        try {
                            await setDoc(doc(db, "projects", projectId, "zones_graph", zoneId), { edges: allEdges }, { merge: true });
                            setSyncStatus("同步成功");
                            setOperationLogs(prev => [...prev, "邊資料同步成功"]);
                            callback(data);
                        } catch {
                            setSyncStatus("同步失敗");
                            setOperationLogs(prev => [...prev, "邊資料同步失敗"]);
                            callback(data);
                        }
                    },
                    deleteEdge: async (data: DeleteEdgeData, callback: Callback<DeleteEdgeData>) => {
                        setOperationLogs(prev => [...prev, `開始刪除邊: ${data.map((edge) => edge.id).join(", ")}`]);
                        // 先寫入 Firestore
                        const idsToDelete = data.map((edge) => edge.id);
                        const allEdges = edgesRef.current.get().filter(edge => !idsToDelete.includes(edge.id));
                        try {
                            await setDoc(doc(db, "projects", projectId, "zones_graph", zoneId), { edges: allEdges }, { merge: true });
                            setSyncStatus("同步成功");
                            setOperationLogs(prev => [...prev, "邊刪除同步成功"]);
                            callback(data);
                        } catch (e: unknown) {
                            setSyncStatus("同步失敗");
                            const message = e instanceof Error ? e.message : String(e);
                            setOperationLogs(prev => [...prev, `邊刪除同步失敗: ${message}`]);
                            callback(null);
                        }
                    }
                }
            };
            networkRef.current = new Network(containerRef.current, data, options);
            setOperationLogs(prev => [...prev, "網路圖載入完成"]);
        }
    }, [containerRef, db, projectId, zoneId]);

    // 本地 DataSet 事件監聽，將本地變更同步到 Firestore
    useEffect(() => {
        // 用區域變數保存 current，避免 React cleanup ref 問題
        const nodesDS = nodesRef.current;
        const edgesDS = edgesRef.current;

        const handleNodesChange = async () => {
            if (isRemoteUpdate.current) return;
            const allNodes = nodesDS.get();
            try {
                await setDoc(doc(db, "projects", projectId, "zones_graph", zoneId), { nodes: allNodes }, { merge: true });
                setOperationLogs(prev => [...prev, "本地節點變更已同步到 Firestore"]);
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : String(e);
                setOperationLogs(prev => [...prev, `節點同步失敗: ${message}`]);
            }
        };
        const handleEdgesChange = async () => {
            if (isRemoteUpdate.current) return;
            const allEdges = edgesDS.get();
            try {
                await setDoc(doc(db, "projects", projectId, "zones_graph", zoneId), { edges: allEdges }, { merge: true });
                setOperationLogs(prev => [...prev, "本地邊變更已同步到 Firestore"]);
            } catch (e: unknown) {
                const message = e instanceof Error ? e.message : String(e);
                setOperationLogs(prev => [...prev, `邊同步失敗: ${message}`]);
            }
        };
        nodesDS.on("add", handleNodesChange);
        nodesDS.on("remove", handleNodesChange);
        nodesDS.on("update", handleNodesChange);
        edgesDS.on("add", handleEdgesChange);
        edgesDS.on("remove", handleEdgesChange);
        edgesDS.on("update", handleEdgesChange);
        return () => {
            nodesDS.off("add", handleNodesChange);
            nodesDS.off("remove", handleNodesChange);
            nodesDS.off("update", handleNodesChange);
            edgesDS.off("add", handleEdgesChange);
            edgesDS.off("remove", handleEdgesChange);
            edgesDS.off("update", handleEdgesChange);
        };
    }, [db, projectId, zoneId]);

    return (
        <>
            <div ref={containerRef} style={{ height: "400px" }} />
            {syncStatus && <div style={{ marginTop: "8px", color: "green" }}>{syncStatus}</div>}
            <div style={{ marginTop: "8px" }}>
                <h3>操作記錄:</h3>
                <ul>
                    {operationLogs.map((log, index) => <li key={index}>{log}</li>)}
                </ul>
            </div>
        </>
    );
}

export default function ZoneDetailPage() {
    const params = useParams();
    const projectId = params?.project as string; // 確保 projectId 是字串類型
    const zoneId = params?.zone as string;       // 確保 zoneId 是字串類型

    // hooks 一定要無條件呼叫
    const { db } = useFirebase();
    const [projectDoc, loading, error] = useDocument(doc(db, "projects", projectId));

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
        <main className="max-w-3xl mx-auto p-4">
            {/* 新增網路圖區域，傳入 zones 陣列與 projectName */}
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