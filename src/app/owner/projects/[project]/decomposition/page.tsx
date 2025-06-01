"use client";
import React, { useRef, useCallback } from "react";
import {
    ReactFlow,
    ReactFlowProvider,
    addEdge,
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
import { useParams } from "next/navigation";
import { useFirebase } from "@/modules/shared/infrastructure/persistence/firebase/FirebaseContext";

let nodeId = 1;
const getId = () => `${nodeId++}`;

type FlowProps = {
    nodes?: Node[];
    edges?: Edge[];
    setNodes?: React.Dispatch<React.SetStateAction<Node[] | undefined>>;
    setEdges?: React.Dispatch<React.SetStateAction<Edge[] | undefined>>;
};

function Flow({ nodes: propNodes, edges: propEdges, setNodes, setEdges }: FlowProps) {
    const initialNodes: Node[] = propNodes ?? [];
    const initialEdges: Edge[] = propEdges ?? [];
    const [nodes, setLocalNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setLocalEdges, onEdgesChange] = useEdgesState(initialEdges);
    const { screenToFlowPosition } = useReactFlow();
    const connectingNodeId = useRef<string | null>(null);

    // 若有外部 setNodes/setEdges 傳入則同步
    const setNodesHandler = setNodes || setLocalNodes;
    const setEdgesHandler = setEdges || setLocalEdges;

    const onConnect = useCallback((params: Connection) => {
        setEdgesHandler((eds: Edge[] | undefined) => addEdge(params, eds || []));
    }, [setEdgesHandler]);

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
                data: { label: "New Node" },
            };
            setNodesHandler((nds: Node[] | undefined) => [...(nds || []), newNode]);
            setEdgesHandler((eds: Edge[] | undefined) => [
                ...(eds || []),
                { id: `e${sourceId}-${newNodeId}`, source: sourceId, target: newNodeId },
            ]);
        }
        connectingNodeId.current = null;
    }, [screenToFlowPosition, setNodesHandler, setEdgesHandler]);

    return (
        <div style={{ height: "100vh" }}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onConnectStart={onConnectStart}
                onConnectEnd={onConnectEnd}
                fitView
            />
        </div>
    );
}

function FirestoreSync({
    children,
}: {
    children: (
        nodes: Node[] | undefined,
        edges: Edge[] | undefined,
        loading: boolean,
        error: unknown,
        setNodes: React.Dispatch<React.SetStateAction<Node[] | undefined>>,
        setEdges: React.Dispatch<React.SetStateAction<Edge[] | undefined>>
    ) => React.ReactNode;
}) {
    const params = useParams();
    const projectId = params?.project as string | undefined;
    const { db, doc, useDocument, updateDoc } = useFirebase();
    const [projectDoc, loading, error] = useDocument(
        projectId ? doc(db, "projects", projectId) : undefined
    );
    const [nodes, setNodes] = React.useState<Node[] | undefined>(undefined);
    const [edges, setEdges] = React.useState<Edge[] | undefined>(undefined);
    const loadedRef = useRef(false);

    React.useEffect(() => {
        if (projectDoc && projectDoc.exists()) {
            const decomposition = projectDoc.data()?.decomposition;
            setNodes(decomposition?.nodes || []);
            setEdges(decomposition?.edges || []);
            loadedRef.current = true;
        }
    }, [projectDoc]);

    const prevNodes = useRef<Node[] | undefined>(undefined);
    const prevEdges = useRef<Edge[] | undefined>(undefined);

    React.useEffect(() => {
        if (!projectId) return;
        if (!nodes || !edges) return;
        if (!loadedRef.current) return;
        if (
            JSON.stringify(nodes) !== JSON.stringify(prevNodes.current) ||
            JSON.stringify(edges) !== JSON.stringify(prevEdges.current)
        ) {
            updateDoc(doc(db, "projects", projectId), {
                decomposition: { nodes, edges },
                updatedAt: new Date(),
            });
            prevNodes.current = nodes;
            prevEdges.current = edges;
        }
    }, [nodes, edges, db, doc, projectId, updateDoc]);

    return <>{children(nodes, edges, loading, error, setNodes, setEdges)}</>;
}

export default function DecompositionPage() {
    return (
        <ReactFlowProvider>
            <FirestoreSync>
                {(nodes, edges, loading, error, setNodes, setEdges) => {
                    if (loading) return <div>Loading...</div>;
                    if (error) return <div>Error: {String(error)}</div>;
                    if (!nodes || !edges) return <div>Unable to load nodes or edges</div>;
                    return <Flow nodes={nodes} edges={edges} setNodes={setNodes} setEdges={setEdges} />;
                }}
            </FirestoreSync>
        </ReactFlowProvider>
    );
}