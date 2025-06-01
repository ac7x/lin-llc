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
    type OnConnectStartParams,
    useReactFlow,
    useNodesState,
    useEdgesState
} from "reactflow";
import { useFirebase } from "@/modules/shared/infrastructure/persistence/firebase/FirebaseContext";
import "reactflow/dist/style.css";
import { LogProvider, LogOverlay, useLog } from "./LogOverlay";
import { DeleteButton } from "./DeleteButton";

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

// 修正：確保節點 ID 格式一致且簡單
let nodeId = 1;
const getId = () => `${nodeId++}`;

// 型別定義
// === Flow 元件 ===
type FlowProps = {
    nodes?: Node[];
    edges?: Edge[];
};

function Flow({ nodes: propNodes, edges: propEdges }: FlowProps) {
    const initialNodes: Node[] = propNodes ?? [];
    const initialEdges: Edge[] = propEdges ?? [];

    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

    const { screenToFlowPosition } = useReactFlow();
    const connectingNodeId = useRef<string | null>(null);
    const draggingNodeId = useRef<string | null>(null);

    const { addLog } = useLog();

    const onConnect = useCallback((params: Connection) => {
        setEdges(eds => addEdge(params, eds));
        addLog(`新增邊: ${params.source} -> ${params.target}`);
    }, [setEdges, addLog]);

    const onConnectStart: OnConnectStart = useCallback((_, params) => {
        connectingNodeId.current = params.nodeId || null;
    }, []);

    const onConnectEnd: OnConnectEnd = useCallback((event) => {
        const sourceId = connectingNodeId.current;
        if (!sourceId) return;
        const targetIsPane =
            event.target &&
            (event.target as HTMLElement).classList.contains("react-flow__pane");
        if (targetIsPane) {
            const { clientX, clientY } =
                "changedTouches" in event ? event.changedTouches[0] : event;
            const position = screenToFlowPosition({ x: clientX, y: clientY });
            const newNodeId = getId();
            const newNode: Node = {
                id: newNodeId,
                position,
                data: { label: "新節點" },
            };
            setNodes(nds => [...nds, newNode]);
            setEdges(eds => [
                ...eds,
                { id: `e${sourceId}-${newNodeId}`, source: sourceId, target: newNodeId },
            ]);
            draggingNodeId.current = newNodeId;
            addLog(`新增節點: ${newNodeId}，來源節點: ${sourceId}`);
        }
        connectingNodeId.current = null;
    }, [screenToFlowPosition, setNodes, setEdges, addLog]);

    const onNodeDragStop = useCallback(
        (_event: React.MouseEvent | React.TouchEvent, node: Node) => {
            if (draggingNodeId.current && node.id === draggingNodeId.current) {
                draggingNodeId.current = null;
            }
        },
        []
    );

    const [selectedNodeIds, setSelectedNodeIds] = React.useState<string[]>([]);
    const [selectedEdgeIds, setSelectedEdgeIds] = React.useState<string[]>([]);

    const onSelectionChange = useCallback(({ nodes, edges }: { nodes: Node[]; edges: Edge[] }) => {
        setSelectedNodeIds(nodes.map(n => n.id));
        setSelectedEdgeIds(edges.map(e => e.id));
    }, []);

    const handleDelete = useCallback(() => {
        setNodes(nds => nds.filter(n => !selectedNodeIds.includes(n.id)));
        setEdges(eds => eds.filter(e => !selectedEdgeIds.includes(e.id)));
        setSelectedNodeIds([]);
        setSelectedEdgeIds([]);
        addLog(`刪除節點: ${selectedNodeIds.join(", ")}`);
        addLog(`刪除邊: ${selectedEdgeIds.join(", ")}`);
    }, [selectedNodeIds, selectedEdgeIds, setNodes, setEdges, addLog]);

    return (
        <div style={{ height: "100vh" }}>
            <DeleteButton
                onDelete={handleDelete}
                disabled={selectedNodeIds.length === 0 && selectedEdgeIds.length === 0}
            />
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onConnectStart={onConnectStart}
                onConnectEnd={onConnectEnd}
                onNodeDragStop={onNodeDragStop}
                onSelectionChange={onSelectionChange}
                fitView
            >
                <MiniMap />
                <Controls />
                <Background />
            </ReactFlow>
        </div>
    );
}

function Sidebar() {
    // 拖曳開始時，設置 dataTransfer type
    const onDragStart = (event: React.DragEvent) => {
        event.dataTransfer.setData("application/reactflow", "custom");
        event.dataTransfer.effectAllowed = "move";
    };
    return (
        <div className="p-4 border-r bg-gray-50 dark:bg-gray-900" style={{ minWidth: 120 }}>
            <div
                className="bg-blue-500 text-white px-3 py-2 rounded cursor-move select-none text-center"
                draggable
                onDragStart={onDragStart}
                style={{ marginBottom: 12 }}
            >
                拖曳新增節點
            </div>
        </div>
    );
}

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
    const reactFlowInstance = useReactFlow();

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

    // 新增 onDrop/onDragOver 實作
    const onDrop = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        const type = event.dataTransfer.getData("application/reactflow");
        if (!type) return;
        const bounds = reactFlowWrapper.current?.getBoundingClientRect();
        if (!bounds) return;
        const position = reactFlowInstance.project({
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
        });
        const newNode = {
            id: `node_${Date.now()}`,
            type: "custom",
            position,
            data: { label: "新節點" },
        };
        setNodes((nds) => {
            const newNodes = [...nds, newNode];
            syncDecomposition(newNodes, edges);
            addLog(`拖曳新增節點: ${newNode.id}`);
            return newNodes;
        });
    }, [reactFlowInstance, setNodes, syncDecomposition, edges, addLog]);

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    }, []);

    return (
        <div style={{ height: "100vh", display: "flex", flexDirection: "row" }}>
            <Sidebar />
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
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
                    <div
                        style={{ flex: 1 }}
                        ref={reactFlowWrapper}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                    >
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