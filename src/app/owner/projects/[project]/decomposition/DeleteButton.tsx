import React, { useEffect } from "react";

export function DeleteButton({
    onDelete,
    disabled,
}: {
    onDelete: () => void;
    disabled?: boolean;
}) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (disabled) return;
            if (e.key === "Delete") {
                onDelete();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [onDelete, disabled]);

    return null;
}
