// src/hooks/actions/usePartsListActions.ts
import {useCallback, useMemo, useState} from "react";
import type {PriorityEnum, WorkflowStatusEnum} from "../../lib/database.types";
import type {PartWithDocument} from "../useParts";
import {usePartMutations} from "./usePartMutations";
import {useFavoritesSetActions} from "./useFavoritesSetActions";

export function usePartsListActions(params: {
    setParts: React.Dispatch<React.SetStateAction<PartWithDocument[]>>;
    favoritePartIds: Set<string>;
    setFavoritePartIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
    const {setParts, favoritePartIds, setFavoritePartIds} = params;

    // unified error (from favorites + mutations)
    const fav = useFavoritesSetActions({favoritePartIds, setFavoritePartIds});
    const mut = usePartMutations<PartWithDocument>(setParts);

    // UI state (stejné jako ve tvém useDocumentActions)
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [docToDelete, setDocToDelete] = useState<{ id: string; file_name?: string | null } | null>(null);

    const [removeModalOpen, setRemoveModalOpen] = useState(false);
    const [partToRemove, setPartToRemove] = useState<PartWithDocument | null>(null);

    const [addToProjectOpen, setAddToProjectOpen] = useState(false);
    const [bulkProjectPartIds, setBulkProjectPartIds] = useState<string[] | null>(null);
    const [partToAdd, setPartToAdd] = useState<PartWithDocument | null>(null);

    // Handlers (API kompatibilní s UI)
    const handleToggleFavorite = useCallback(
        async (part: PartWithDocument) => {
            await fav.toggleFavoriteById(part.id);
        },
        [fav]
    );

    const handleWorkflowStatusChange = useCallback(
        async (part: PartWithDocument, value: WorkflowStatusEnum) => {
            const {error} = await mut.updateWorkflowStatus(part.id, value);
            if (error) fav.setError((error as any).message ?? "Failed to update status");
        },
        [mut, fav]
    );

    const handlePriorityChange = useCallback(
        async (part: PartWithDocument, value: PriorityEnum) => {
            const {error} = await mut.updatePriority(part.id, value);
            if (error) fav.setError((error as any).message ?? "Failed to update priority");
        },
        [mut, fav]
    );

    const handleBulkSetStatus = useCallback(
        async (partIds: string[], value: WorkflowStatusEnum) => {
            const {error} = await mut.bulkUpdateWorkflowStatus(partIds, value);
            if (error) fav.setError((error as any).message ?? "Failed bulk status update");
        },
        [mut, fav]
    );

    const handleBulkSetPriority = useCallback(
        async (partIds: string[], value: PriorityEnum) => {
            const {error} = await mut.bulkUpdatePriority(partIds, value);
            if (error) fav.setError((error as any).message ?? "Failed bulk priority update");
        },
        [mut, fav]
    );

    const handleBulkToggleFavorite = useCallback(
        async (partIds: string[], favorite: boolean) => {
            await fav.bulkSetFavorite(partIds, favorite);
        },
        [fav]
    );

    const handleOpenAddToProject = useCallback((part: PartWithDocument) => {
        setPartToAdd(part);
        setBulkProjectPartIds(null);
        setAddToProjectOpen(true);
    }, []);

    const handleOpenBulkAddToProject = useCallback((partIds: string[]) => {
        setPartToAdd(null);
        setBulkProjectPartIds(partIds);
        setAddToProjectOpen(true);
    }, []);

    return useMemo(
        () => ({
            // error
            error: fav.error,
            setError: fav.setError,

            // modals/UI state
            deleteModalOpen,
            setDeleteModalOpen,
            docToDelete,
            setDocToDelete,

            removeModalOpen,
            setRemoveModalOpen,
            partToRemove,
            setPartToRemove,

            addToProjectOpen,
            setAddToProjectOpen,
            bulkProjectPartIds,
            setBulkProjectPartIds,
            partToAdd,
            setPartToAdd,

            // handlers
            handleToggleFavorite,
            handleWorkflowStatusChange,
            handlePriorityChange,
            handleBulkSetStatus,
            handleBulkSetPriority,
            handleBulkToggleFavorite,
            handleOpenAddToProject,
            handleOpenBulkAddToProject,
        }),
        [
            fav.error,
            fav.setError,
            deleteModalOpen,
            docToDelete,
            removeModalOpen,
            partToRemove,
            addToProjectOpen,
            bulkProjectPartIds,
            partToAdd,
            handleToggleFavorite,
            handleWorkflowStatusChange,
            handlePriorityChange,
            handleBulkSetStatus,
            handleBulkSetPriority,
            handleBulkToggleFavorite,
            handleOpenAddToProject,
            handleOpenBulkAddToProject,
        ]
    );
}
