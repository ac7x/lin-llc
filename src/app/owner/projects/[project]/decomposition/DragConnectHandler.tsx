import { useRef, useCallback } from "react";
import { useReactFlow, Node, Edge, OnConnectStart, OnConnectEnd } from "@xyflow/react";

export type DragConnectHandlerProps = {
    setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
    setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
    addLog: (msg: string) => void;
    getId: () => string;
    children: (handlers: {
        onConnectStart: OnConnectStart;
        onConnectEnd: OnConnectEnd;
        onNodeDragStop: (event: React.MouseEvent | React.TouchEvent, node: Node) => void;
        onPaneClick: (event: React.MouseEvent) => void;
        connectingNodeId: React.MutableRefObject<string | null>;
        draggingNodeId: React.MutableRefObject<string | null>;
    }) => React.ReactNode;
};

export function DragConnectHandler({ setNodes, setEdges, addLog, getId, children }: DragConnectHandlerProps) {
    const { screenToFlowPosition } = useReactFlow();
    const connectingNodeId = useRef<string | null>(null);
    const draggingNodeId = useRef<string | null>(null);

    const onPaneClick = useCallback((event: React.MouseEvent) => {
        // 確保點擊的是畫布而不是其他元素
        const targetIsPane =
            event.target &&
            (event.target as HTMLElement).classList.contains("react-flow__pane");

        if (!targetIsPane) return;

        const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });

        const newNode = {
            id: getId(),
            type: "custom",
            position,
            data: { label: "新節點" },
        };

        setNodes((nds) => [...nds, newNode]);
        addLog("新增節點");
    }, [screenToFlowPosition, setNodes, addLog, getId]);

    const onConnectStart: OnConnectStart = useCallback((_, params) => {
        connectingNodeId.current = params.nodeId || null;
    }, []);

    const onConnectEnd: OnConnectEnd = useCallback(
        (event) => {
            const sourceId = connectingNodeId.current;
            if (!sourceId) return;
            const target = event.target as HTMLElement;
            // 拖到空白處才新增節點
            if (target && target.classList.contains("react-flow__pane")) {
                const { clientX, clientY } =
                    "changedTouches" in event ? event.changedTouches[0] : event;
                const position = screenToFlowPosition({ x: clientX, y: clientY });
                const newNodeId = getId();
                const newNode: Node = {
                    id: newNodeId,
                    type: "custom",
                    position,
                    data: { label: "新節點" },
                };
                setNodes((nds) => [...nds, newNode]);
                setEdges((eds) => [
                    ...eds,
                    { id: `e${sourceId}-${newNodeId}`, source: sourceId, target: newNodeId },
                ]);
                draggingNodeId.current = newNodeId;
                addLog(`新增節點: ${newNodeId}，來源節點: ${sourceId}`);
            } else if (target && target.closest(".react-flow__node")) {
                // 拖到現有節點，只連線
                const targetNode = target.closest(".react-flow__node");
                const targetNodeId = targetNode?.getAttribute("data-id");
                if (targetNodeId && targetNodeId !== sourceId) {
                    setEdges((eds) => [
                        ...eds,
                        {
                            id: `e${sourceId}-${targetNodeId}`,
                            source: sourceId,
                            target: targetNodeId
                        },
                    ]);
                    addLog(`連線: ${sourceId} → ${targetNodeId}`);
                }
            }
            connectingNodeId.current = null;
        },
        [screenToFlowPosition, setNodes, setEdges, addLog, getId]
    );

    const onNodeDragStop = useCallback(
        (_event: React.MouseEvent | React.TouchEvent, node: Node) => {
            if (draggingNodeId.current && node.id === draggingNodeId.current) {
                draggingNodeId.current = null;
            }
        },
        []
    );

    return (
        <>
            {children({
                onConnectStart,
                onConnectEnd,
                onNodeDragStop,
                onPaneClick,
                connectingNodeId,
                draggingNodeId,
            })}
        </>
    );
}
