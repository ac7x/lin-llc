"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
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
    OnConnectStart,
    OnConnectStartParams,
    useReactFlow,
    Handle,
    Position,
} from '@xyflow/react';
import { useFirebase } from "@/modules/shared/infrastructure/persistence/firebase/FirebaseContext";
import '@xyflow/react/dist/style.css';

const CustomNode = ({ data, selected, colorMode }: any) => (
    <div
        style={{
            background: colorMode === "dark" ? "#223047" : "#2a6c97",
            border: selected
                ? "2.5px solid #fbbf24"
                : colorMode === "dark"
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
        {/* 加入 handle，讓 custom node 可以連線 */}
        <Handle type="target" position={Position.Top} />
        {data.label}
        <Handle type="source" position={Position.Bottom} />
    </div>
);

let nodeId = 1;
const getId = () => `node_${nodeId++}`;

// 產生唯一 edge id
const getEdgeId = (source: string, target: string) =>
    `edge_${source}_${target}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

function DecompositionFlow(props: any) {
    const { db, doc, useDocument, updateDoc } = useFirebase();
    const params = useParams();
    const projectId = params?.project as string;
    const [projectDoc, loading, error] = useDocument(doc(db, "projects", projectId));
    const [rfNodes, setNodes] = useState<any[]>([]);
    const [rfEdges, setEdges] = useState<any[]>([]);
    const [colorMode, setColorMode] = useState<"light" | "dark">("light");
    const [selectedNodes, setSelectedNodes] = useState<any[]>([]);
    const [selectedEdges, setSelectedEdges] = useState<any[]>([]);
    const [connectingNodeId, setConnectingNodeId] = useState<string | null>(null);

    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const { screenToFlowPosition } = useReactFlow();

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
            setNodes(Array.isArray(d?.nodes) ? d.nodes : []);
            setEdges(Array.isArray(d?.edges) ? d.edges : []);
        }
    }, [projectDoc]);

    const nodeTypes = { custom: CustomNode };

    const syncDecomposition = async (nodes: any[], edges: any[]) => {
        if (!projectId) return;
        try {
            await updateDoc(doc(db, "projects", projectId), { decomposition: { nodes, edges } });
        } catch { }
    };

    const onNodesChange = useCallback((changes: any) =>
        setNodes(nds => {
            const newNodes = applyNodeChanges(changes, nds);
            syncDecomposition(newNodes, rfEdges);
            return newNodes;
        }), [rfEdges]);
    const onEdgesChange = useCallback((changes: any) =>
        setEdges(eds => {
            const newEdges = applyEdgeChanges(changes, eds);
            syncDecomposition(rfNodes, newEdges);
            return newEdges;
        }), [rfNodes]);
    const onConnect = useCallback((connection: any) =>
        setEdges(eds => {
            const newEdges = addEdge(connection, eds);
            syncDecomposition(rfNodes, newEdges);
            return newEdges;
        }), [rfNodes]);

    // onConnectStart: 記錄開始連線的節點 id
    const onConnectStart: OnConnectStart = useCallback((_, params: OnConnectStartParams) => {
        setConnectingNodeId(params.nodeId || null);
    }, []);

    // onConnectEnd: 在畫布空白處放開時新增節點並連線
    const onConnectEnd = useCallback((event: MouseEvent | TouchEvent, connectionState: any) => {
        if (!connectingNodeId || !reactFlowWrapper.current) return;

        // 只有拖到空白處才新增節點
        if (connectionState?.isValid) {
            setConnectingNodeId(null);
            return;
        }

        const { clientX, clientY } =
            'changedTouches' in event ? event.changedTouches[0] : event;
        const position = screenToFlowPosition({
            x: clientX,
            y: clientY,
        });

        const newNodeId = getId();
        const newNode = {
            id: newNodeId,
            type: "custom",
            position,
            data: { label: `新節點` },
        };
        // 使用 getEdgeId 產生唯一 edge id
        const newEdge = {
            id: getEdgeId(connectingNodeId, newNodeId),
            source: connectingNodeId,
            target: newNodeId,
        };

        setNodes(nds => {
            const nodes = [...nds, newNode];
            setEdges(eds => {
                // 避免重複 id
                const edges = [...eds, newEdge];
                syncDecomposition(nodes, edges);
                return edges;
            });
            syncDecomposition(nodes, rfEdges);
            return nodes;
        });

        setConnectingNodeId(null);
    }, [connectingNodeId, screenToFlowPosition, rfEdges]);

    const onSelectionChange = ({ nodes, edges }: { nodes: any[]; edges: any[] }) => {
        setSelectedNodes(nodes || []);
        setSelectedEdges(edges || []);
    };

    // Delete鍵刪除
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Delete" || e.key === "Backspace") {
                if (selectedNodes.length === 0 && selectedEdges.length === 0) return;
                setNodes(prevNodes => {
                    const newNodes = prevNodes.filter(n => !selectedNodes.some(sn => sn.id === n.id));
                    setEdges(prevEdges => {
                        const newEdges = prevEdges
                            .filter(e =>
                                !selectedEdges.some(se => se.id === e.id) &&
                                !selectedNodes.some(sn => sn.id === e.source || sn.id === e.target)
                            );
                        syncDecomposition(newNodes, newEdges);
                        return newEdges;
                    });
                    syncDecomposition(newNodes, rfEdges);
                    return newNodes;
                });
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selectedNodes, selectedEdges, rfEdges]);

    // 保證 rfEdges 中每個 edge 的 id 唯一
    const uniqueEdges = React.useMemo(() => {
        const seen = new Set<string>();
        return rfEdges.map(e => {
            let id = e.id;
            // 若 id 已重複或不存在則產生新 id
            if (!id || seen.has(id)) {
                id = getEdgeId(e.source, e.target);
            }
            seen.add(id);
            return { ...e, id };
        });
    }, [rfEdges]);

    return (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
            <div className="flex items-center justify-between px-4 pt-4 mb-2">
                <div className="text-xl font-bold">
                    {(projectDoc && projectDoc.data && projectDoc.data())?.projectName || projectId}
                </div>
            </div>
            {rfNodes.length === 0 && rfEdges.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-gray-400 text-lg">尚無分解資料</div>
            ) : (
                <div style={{ flex: 1 }} ref={reactFlowWrapper}>
                    <ReactFlow
                        nodes={rfNodes}
                        edges={uniqueEdges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onConnectStart={onConnectStart}
                        onConnectEnd={onConnectEnd}
                        fitView
                        nodeTypes={nodeTypes}
                        colorMode={colorMode}
                        proOptions={{ hideAttribution: true }}
                        onSelectionChange={onSelectionChange}
                    >
                        <MiniMap />
                        <Controls />
                        <Background />
                    </ReactFlow>
                </div>
            )}
        </div>
    );
}

export default function DecompositionPage() {
    return (
        <ReactFlowProvider>
            <DecompositionFlow />
        </ReactFlowProvider>
    );
}
