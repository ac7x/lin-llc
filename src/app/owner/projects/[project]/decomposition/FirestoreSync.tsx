import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { doc } from "firebase/firestore";
import { useFirebase } from "@/modules/shared/infrastructure/persistence/firebase/FirebaseContext";
import { useDocument } from "react-firebase-hooks/firestore";
import { Node, Edge } from "@xyflow/react";

function ensureUniqueStringId(arr: any[] | undefined, prefix: string): any[] {
    if (!arr) return [];
    const seen = new Set<string>();
    return arr.map((item, idx) => {
        let id = typeof item.id === "string" ? item.id : String(item.id ?? idx);
        // 保證唯一
        while (seen.has(id)) {
            id = `${id}_${Math.random().toString(36).slice(2, 8)}`;
        }
        seen.add(id);
        return { ...item, id };
    });
}

export function FirestoreSync({
    children,
}: {
    children: (nodes: Node[] | undefined, edges: Edge[] | undefined, loading: boolean, error: any) => React.ReactNode;
}) {
    const params = useParams();
    const projectId = params?.project as string;
    const { db } = useFirebase();
    const [projectDoc, loading, error] = useDocument(
        projectId ? doc(db, "projects", projectId) : undefined
    );

    let nodes: Node[] | undefined = undefined;
    let edges: Edge[] | undefined = undefined;
    if (projectDoc?.exists()) {
        const decomposition = projectDoc.data().decomposition;
        nodes = ensureUniqueStringId(decomposition?.nodes, "node");
        edges = ensureUniqueStringId(decomposition?.edges, "edge");
    }

    return <>{children(nodes, edges, loading, error)}</>;
}
