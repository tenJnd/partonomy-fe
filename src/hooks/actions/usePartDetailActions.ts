// src/hooks/actions/usePartDetailActions.ts
import {useCallback, useMemo, useState} from "react";
import type {Database, PriorityEnum, WorkflowStatusEnum} from "../../lib/database.types";
import {usePartMutations} from "./usePartMutations";
import {usePartFavorite} from "./usePartFavorite";

type Part = Database["public"]["Tables"]["parts"]["Row"];

export function usePartDetailActions(params: {
    selectedPartId: string | null;
    setParts: React.Dispatch<React.SetStateAction<Part[]>>;
    orgId: string | null;
    userId: string | null;
    canSetStatus: boolean;
    canSetPriority: boolean;
}) {
    const {selectedPartId, setParts, orgId, userId, canSetStatus, canSetPriority} = params;

    const [error, setError] = useState<string | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [updatingPriority, setUpdatingPriority] = useState(false);

    const mut = usePartMutations<Part>(setParts);

    const fav = usePartFavorite(selectedPartId ?? null, orgId ?? null, userId ?? null);

    const onChangeWorkflowStatus = useCallback(
        async (value: WorkflowStatusEnum) => {
            if (!selectedPartId) return;
            if (!canSetStatus) return;

            setUpdatingStatus(true);
            const {error} = await mut.updateWorkflowStatus(selectedPartId, value);
            if (error) setError((error as any).message ?? "Failed to update status");
            setUpdatingStatus(false);
        },
        [selectedPartId, canSetStatus, mut]
    );

    const onChangePriority = useCallback(
        async (value: PriorityEnum) => {
            if (!selectedPartId) return;
            if (!canSetPriority) return;

            setUpdatingPriority(true);
            const {error} = await mut.updatePriority(selectedPartId, value);
            if (error) setError((error as any).message ?? "Failed to update priority");
            setUpdatingPriority(false);
        },
        [selectedPartId, canSetPriority, mut]
    );

    return useMemo(
        () => ({
            error,
            setError,

            // favorites (single)
            isFavorite: fav.isFavorite,
            favoriteLoading: fav.loading,
            toggleFavorite: fav.toggleFavorite,

            // status/priority
            updatingStatus,
            updatingPriority,
            onChangeWorkflowStatus,
            onChangePriority,
        }),
        [
            error,
            fav.isFavorite,
            fav.loading,
            fav.toggleFavorite,
            updatingStatus,
            updatingPriority,
            onChangeWorkflowStatus,
            onChangePriority,
        ]
    );
}
