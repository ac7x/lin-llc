"use client";
import React, { useRef, useCallback, Dispatch, SetStateAction, ReactNode } from "react";
import {
    ReactFlow,
    ReactFlowProvider,
    addEdge,
    MiniMap,
    Controls,
    Background,
    useReactFlow,
    useNodesState,
    useEdgesState,
    Node,
    Edge,
    Connection,
    OnConnectStart,
    OnConnectEnd,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { DeleteButton } from "./DeleteButton";
import { useLog } from "./LogOverlay";
import { useParams } from "next/navigation";
import { useFirebase } from "@/modules/shared/infrastructure/persistence/firebase/FirebaseContext";

// 修正：確保節點 ID 格式一致且簡單
let nodeId = 1;
const getId = () => `${nodeId++}`;

// 型別定義
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

// === FirestoreSync 相關程式碼開始 ===

type FirestoreSyncProps = {
    children: (
        nodes: Node[] | undefined,
        edges: Edge[] | undefined,
        loading: boolean,
        error: unknown,
        setNodes: Dispatch<SetStateAction<Node[] | undefined>>,
        setEdges: Dispatch<SetStateAction<Edge[] | undefined>>,
        addLog: (message: string) => void
    ) => ReactNode;
};

function ensureUniqueStringId<T extends { id?: string | number }>(arr: T[] | undefined, prefix: string): T[] {
    if (!arr) return [];
    const seen = new Set<string>();
    return arr.map((item, idx) => {
        let rawId = typeof item.id === "string" ? item.id : String(item.id ?? idx);
        const prefixRegex = new RegExp(`^(?:${prefix}_)+`);
        rawId = rawId.replace(prefixRegex, '');
        let id = `${prefix}_${rawId}`;
        while (seen.has(id)) {
            id = `${prefix}_${rawId}_${Math.random().toString(36).slice(2, 8)}`;
        }
        seen.add(id);
        return { ...item, id };
    });
}

export function FirestoreSync({ children }: FirestoreSyncProps) {
    const params = useParams();
    const projectId = params?.project as string | undefined;
    const { db, doc, useDocument, updateDoc } = useFirebase();

    // 直接使用 useDocument 回傳的型別
    const [projectDoc, loading, error] = useDocument(
        projectId ? doc(db, "projects", projectId) : undefined
    );

    const [nodes, setNodes] = React.useState<Node[] | undefined>(undefined);
    const [edges, setEdges] = React.useState<Edge[] | undefined>(undefined);
    const { addLog } = useLog();
    const loadedRef = useRef(false);

    React.useEffect(() => {
        if (projectDoc && projectDoc.exists()) {
            // 修正：projectDoc.data() 可能回傳 undefined，需防禦
            const decomposition = projectDoc.data()?.decomposition;
            setNodes(ensureUniqueStringId<Node>(decomposition?.nodes, "node"));
            setEdges(ensureUniqueStringId<Edge>(decomposition?.edges, "edge"));
            if (!loadedRef.current) {
                addLog("從 Firestore 載入節點與邊");
                loadedRef.current = true;
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [projectDoc]);

    const prevNodes = useRef<Node[] | undefined>(undefined);
    const prevEdges = useRef<Edge[] | undefined>(undefined);

    React.useEffect(() => {
        if (!projectId) return;
        if (!nodes || !edges) return;
        if (prevNodes.current === undefined && prevEdges.current === undefined) {
            prevNodes.current = nodes;
            prevEdges.current = edges;
            return;
        }
        if (
            JSON.stringify(nodes) !== JSON.stringify(prevNodes.current) ||
            JSON.stringify(edges) !== JSON.stringify(prevEdges.current)
        ) {
            updateDoc(doc(db, "projects", projectId), {
                decomposition: {
                    nodes,
                    edges,
                },
                updatedAt: new Date(),
            });
            prevNodes.current = nodes;
            prevEdges.current = edges;
            addLog("同步到 Firestore");
        }
    }, [nodes, edges, db, doc, projectId, updateDoc, addLog]);

    return <>{children(nodes, edges, loading, error, setNodes, setEdges, addLog)}</>;
}

// === FirestoreSync 相關程式碼結束 ===

export default function DecompositionPage() {
    return (
        <ReactFlowProvider>
            <FirestoreSync>
                {(nodes, edges, loading, error) => {
                    if (loading) return <div>載入中...</div>;
                    if (error) return <div>錯誤: {String(error)}</div>;
                    if (!nodes || !edges) return <div>無法載入節點或邊</div>;
                    return <Flow nodes={nodes} edges={edges} />;
                }}
            </FirestoreSync>
        </ReactFlowProvider>
    );
}

