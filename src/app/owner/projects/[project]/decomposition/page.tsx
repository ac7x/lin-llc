"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import {
    ReactFlow,
    ReactFlowProvider,
    addEdge,
    applyNodeChanges,
    applyEdgeChanges,
    Background,
    Controls,
    MiniMap,
    Handle,
    Position,
    type Node,
    type Edge,
    type NodeChange,
    type EdgeChange,
    type Connection,
    type OnConnectStart,
    type OnConnectEnd,
    type OnSelectionChangeFunc,
    type OnConnectStartParams
} from "reactflow";
import { useFirebase } from "@/modules/shared/infrastructure/persistence/firebase/FirebaseContext";
import "reactflow/dist/style.css";
import { LogProvider, LogOverlay, useLog } from "./LogOverlay";

// 將原 NodeData 改名為 CustomNodeData，僅保留 data 欄位
interface CustomNodeData {
    label: string;
    width?: number;
    height?: number;
    [key: string]: unknown;
}

// 修改 CustomNode 型別使用 any workaround，避免型別錯誤
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomNode = (props: any) => {
    const { data, selected } = props;
    const nodeData = data as CustomNodeData;
    const isDark =
        typeof window !== "undefined"
            ? window.matchMedia("(prefers-color-scheme: dark)").matches
            : false;
    return (
        <div
            style={{
                background: isDark ? "#223047" : "#2a6c97",
                border: selected
                    ? "2.5px solid #fbbf24"
                    : isDark
                        ? "2px solid #3b82f6"
                        : "2px solid #0d618f",
                color: "#fff",
                fontWeight: 600,
                fontSize: "1rem",
                borderRadius: 8,
                boxShadow: selected
                    ? "0 8px 24px 0 rgba(0,0,0,0.18)"
                    : "0 4px 16px 0 rgba(0,0,0,0.10)",
                padding: "16px 20px",
                minWidth: 100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "box-shadow 0.2s, border 0.2s, background 0.2s",
                position: "relative",
            }}
        >
            <Handle type="target" position={Position.Top} />
            {nodeData.label}
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

// 不加型別註記，讓 TS 自動推斷
const nodeTypes = { custom: CustomNode };

const getEdgeId = (source: string, target: string) =>
    `edge_${source}_${target}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function DecompositionFlow() {
    const { db, doc, useDocument, updateDoc } = useFirebase();
    const params = useParams();
    const projectId = params?.project as string;
    const [projectDoc] = useDocument(doc(db, "projects", projectId));
    const [nodes, setNodes] = useState<Node<CustomNodeData>[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [selectedNodes, setSelectedNodes] = useState<Node<CustomNodeData>[]>([]);
    const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);
    const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
    const { addLog, logs } = useLog();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    // 移除未使用的 colorMode state 與 useEffect

    useEffect(() => {
        if (projectDoc?.exists()) {
            const d = projectDoc.data()?.decomposition;
            setNodes(Array.isArray(d?.nodes) ? (d.nodes as Node<CustomNodeData>[]) : []);
            setEdges(Array.isArray(d?.edges) ? (d.edges as Edge[]) : []);
        }
    }, [projectDoc]);

    const syncDecomposition = useCallback(
        async (
            nodes: Node<CustomNodeData>[],
            edges: Edge[]
        ) => {
            if (!projectId) return;
            try {
                await updateDoc(doc(db, "projects", projectId), { decomposition: { nodes, edges } });
            } catch { }
        },
        [projectId, db, doc, updateDoc]
    );

    const onNodesChange = useCallback(
        (changes: NodeChange[]) =>
            setNodes((nds) => {
                const newNodes = applyNodeChanges(changes, nds) as Node<CustomNodeData>[];
                syncDecomposition(newNodes, edges);
                return newNodes;
            }),
        [edges, syncDecomposition]
    );

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) =>
            setEdges((eds) => {
                const newEdges = applyEdgeChanges(changes, eds);
                syncDecomposition(nodes, newEdges);
                return newEdges;
            }),
        [nodes, syncDecomposition]
    );

    const onConnect = useCallback(
        (connection: Connection) =>
            setEdges((eds) => {
                const newEdges = addEdge(connection, eds);
                syncDecomposition(nodes, newEdges);
                return newEdges;
            }),
        [nodes, syncDecomposition]
    );

    const onConnectStart: OnConnectStart = useCallback((_, params: OnConnectStartParams) => {
        setConnectingNodeId(params.nodeId ?? null);
    }, []);

    // 修正 OnConnectEnd 型別：reactflow v11 只接受一個 event 參數
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const onConnectEnd: OnConnectEnd = useCallback((event) => {
        if (!connectingNodeId || !reactFlowWrapper.current) return;
        // 這裡如需判斷是否有效連線，需用 useReactFlow().getIntersectingNodes 等 API
        setConnectingNodeId(null);
    }, [connectingNodeId]);

    // 修正 OnSelectionChangeFunc 型別：reactflow v11 不是泛型
    const onSelectionChange: OnSelectionChangeFunc = useCallback(
        ({ nodes: selNodes = [], edges: selEdges = [] }) => {
            setSelectedNodes(selNodes);
            setSelectedEdges(selEdges);
        },
        []
    );

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Delete" || e.key === "Backspace") {
                if (selectedNodes.length === 0 && selectedEdges.length === 0) return;
                setNodes((prevNodes) => {
                    const newNodes = prevNodes.filter(
                        (n) => !selectedNodes.some((sn) => sn.id === n.id)
                    );
                    setEdges((prevEdges) => {
                        const newEdges = prevEdges.filter(
                            (e) =>
                                !selectedEdges.some((se) => se.id === e.id) &&
                                !selectedNodes.some((sn) => sn.id === e.source || sn.id === e.target)
                        );
                        syncDecomposition(newNodes, newEdges);
                        if (selectedNodes.length > 0)
                            addLog(
                                `刪除節點: ${selectedNodes
                                    .map((n) => String(n.data?.label ?? n.id))
                                    .join(", ")}`
                            );
                        if (selectedEdges.length > 0)
                            addLog(
                                `刪除連線: ${selectedEdges
                                    .map((e) => `${e.source}→${e.target}`)
                                    .join(", ")}`
                            );
                        return newEdges;
                    });
                    return newNodes;
                });
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedNodes, selectedEdges, edges, syncDecomposition, addLog]);

    const uniqueEdges = React.useMemo(() => {
        const seen = new Set<string>();
        return edges.map((e) => {
            let id = e.id;
            if (!id || seen.has(id)) {
                id = getEdgeId(e.source, e.target);
            }
            seen.add(id);
            return { ...e, id };
        });
    }, [edges]);

    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
            <div className="flex items-center justify-between px-4 pt-4 mb-2">
                <div className="text-xl font-bold">
                    {projectDoc?.data?.()?.projectName || projectId}
                </div>
            </div>
            {nodes.length === 0 && edges.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">
                    尚無分解資料
                </div>
            ) : (
                <div style={{ flex: 1 }} ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={nodes}
                        edges={uniqueEdges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onConnectStart={onConnectStart}
                        onConnectEnd={onConnectEnd}
                        fitView
                        nodeTypes={nodeTypes}
                        proOptions={{ hideAttribution: true }}
                        onSelectionChange={onSelectionChange}
                    >
                        <MiniMap />
                        <Controls />
                        <Background />
                    </ReactFlow>
                    <LogOverlay logs={logs} />
                </div>
            )}
        </div>
    );
}

export default function DecompositionPage() {
    return (
        <LogProvider>
            <ReactFlowProvider>
                <DecompositionFlow />
            </ReactFlowProvider>
        </LogProvider>
    );
}