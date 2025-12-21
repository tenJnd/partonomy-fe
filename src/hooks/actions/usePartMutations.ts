// src/hooks/actions/usePartMutations.ts
import {useCallback} from "react";
import {supabase} from "../../lib/supabase";
import {useAuth} from "../../contexts/AuthContext";
import type {PriorityEnum, WorkflowStatusEnum} from "../../lib/database.types";

type WithId = { id: string };

export function usePartMutations<T extends WithId>(
    setParts: React.Dispatch<React.SetStateAction<T[]>>
) {
    const {currentOrg} = useAuth();

    const updatePart = useCallback(
        async (partId: string, patch: Record<string, any>) => {
            if (!currentOrg) return {error: new Error("Missing org") as any};

            // optimistic update + snapshot for rollback
            let prevSnapshot: T | null = null;
            setParts((prev) =>
                prev.map((p) => {
                    if (p.id !== partId) return p;
                    prevSnapshot = p;
                    return {...(p as any), ...(patch as any)};
                })
            );

            const {error} = await supabase
                .from("parts")
                .update(patch)
                .eq("id", partId)
                .eq("org_id", currentOrg.org_id);

            if (error) {
                if (prevSnapshot) {
                    setParts((prev) => prev.map((p) => (p.id === partId ? (prevSnapshot as T) : p)));
                }
                return {error};
            }

            return {error: null};
        },
        [currentOrg, setParts]
    );

    const updateWorkflowStatus = useCallback(
        async (partId: string, value: WorkflowStatusEnum) => {
            return updatePart(partId, {workflow_status: value});
        },
        [updatePart]
    );

    const updatePriority = useCallback(
        async (partId: string, value: PriorityEnum) => {
            return updatePart(partId, {priority: value});
        },
        [updatePart]
    );

    const bulkUpdateWorkflowStatus = useCallback(
        async (partIds: string[], value: WorkflowStatusEnum) => {
            if (!currentOrg) return {error: new Error("Missing org") as any};

            // optimistic
            setParts((prev) =>
                prev.map((p) => (partIds.includes(p.id) ? ({...(p as any), workflow_status: value} as T) : p))
            );

            const {error} = await supabase
                .from("parts")
                .update({workflow_status: value})
                .in("id", partIds)
                .eq("org_id", currentOrg.org_id);

            if (error) return {error};
            return {error: null};
        },
        [currentOrg, setParts]
    );

    const bulkUpdatePriority = useCallback(
        async (partIds: string[], value: PriorityEnum) => {
            if (!currentOrg) return {error: new Error("Missing org") as any};

            setParts((prev) =>
                prev.map((p) => (partIds.includes(p.id) ? ({...(p as any), priority: value} as T) : p))
            );

            const {error} = await supabase
                .from("parts")
                .update({priority: value})
                .in("id", partIds)
                .eq("org_id", currentOrg.org_id);

            if (error) return {error};
            return {error: null};
        },
        [currentOrg, setParts]
    );

    return {
        updateWorkflowStatus,
        updatePriority,
        bulkUpdateWorkflowStatus,
        bulkUpdatePriority,
    };
}
