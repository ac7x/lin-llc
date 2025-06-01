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
    type NodeProps,
    type OnConnectStartParams,
} from "@xyflow/react";
import { useFirebase } from "@/modules/shared/infrastructure/persistence/firebase/FirebaseContext";
import "@xyflow/react/dist/style.css";
import { LogProvider, LogOverlay, useLog } from "./LogOverlay";

// 定義明確的 NodeData 型別
type NodeData = {
    label: string;
    // 你可以加更多欄位
};

// colorMode 請用 context/hook 判斷（不要當 prop 傳給 nodeTypes）
const CustomNode: React.FC<NodeProps<NodeData>> = ({ data, selected }) => {
    const isDark = typeof window !== "undefined"
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
            {data.label}
            <Handle type="source" position={Position.Bottom} />
        </div>
    );
};

let nodeId = 1;
const getId = () => `node_${nodeId++}`;
const getEdgeId = (source: string, target: string) =>
    `edge_${source}_${target}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function DecompositionFlow() {
    const { db, doc, useDocument, updateDoc } = useFirebase();
    const params = useParams();
    const projectId = params?.project as string;
    const [projectDoc] = useDocument(doc(db, "projects", projectId));
    const [nodes, setNodes] = useState<Node<NodeData>[]>([]);
    const [edges, setEdges] = useState<Edge[]>([]);
    const [selectedNodes, setSelectedNodes] = useState<Node<NodeData>[]>([]);
    const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);
    const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);
    const { addLog, logs } = useLog();
    const reactFlowWrapper = useRef<HTMLDivElement>(null);

    // colorMode 只給 CustomNode 用，不要傳給 nodeTypes
    const [colorMode, setColorMode] = useState<"light" | "dark">("light");
    useEffect(() => {
        const mq = window.matchMedia("(prefers-color-scheme: dark)");
        const update = () => setColorMode(mq.matches ? "dark" : "light");
        update();
        mq.addEventListener("change", update);
        return () => mq.removeEventListener("change", update);
    }, []);

    useEffect(() => {
        if (projectDoc?.exists()) {
            const d = projectDoc.data()?.decomposition;
            // 確保 nodes/edges 的 data 結構正確
            setNodes(Array.isArray(d?.nodes) ? d.nodes : []);
            setEdges(Array.isArray(d?.edges) ? d.edges : []);
        }
    }, [projectDoc]);

    const nodeTypes = { custom: CustomNode };

    const syncDecomposition = useCallback(
        async (
            nodes: Node<NodeData>[],
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
                const newNodes = applyNodeChanges(changes, nds);
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

    // 型別必須完全正確
    const onConnectStart: OnConnectStart = useCallback((_, params: OnConnectStartParams) => {
        setConnectingNodeId(params.nodeId ?? null);
    }, []);

    const onConnectEnd: OnConnectEnd = useCallback(
        (event, connectionState) => {
            if (!connectingNodeId || !reactFlowWrapper.current) return;
            if (connectionState?.isValid) {
                setConnectingNodeId(null);
                return;
            }
            let clientX = 0, clientY = 0;
            if ("clientX" in event && "clientY" in event) {
                clientX = event.clientX;
                clientY = event.clientY;
            } else if ("touches" in event && event.touches.length > 0) {
                clientX = event.touches[0].clientX;
                clientY = event.touches[0].clientY;
            }
            // 你可能需要用 useReactFlow().screenToFlowPosition (這裡請根據你的框架補上)
            const position = { x: clientX, y: clientY };
            const newNodeId = getId();
            const newNode: Node<NodeData> = {
                id: newNodeId,
                type: "custom",
                position,
                data: { label: `新節點` },
            };
            const newEdge: Edge = {
                id: getEdgeId(connectingNodeId, newNodeId),
                source: connectingNodeId,
                target: newNodeId,
            };
            setNodes((nds) => {
                const nodes = [...nds, newNode];
                setEdges((eds) => {
                    const edges = [...eds, newEdge];
                    syncDecomposition(nodes, edges);
                    return edges;
                });
                syncDecomposition(nodes, edges);
                return nodes;
            });
            setConnectingNodeId(null);
        },
        [connectingNodeId, syncDecomposition]
    );

    const onSelectionChange: OnSelectionChangeFunc<Node<NodeData>, Edge> =
        useCallback(
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
                    syncDecomposition(newNodes, edges);
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