import {useCallback, useState} from "react";
import {supabase} from "../lib/supabase";
import {useAuth} from "../contexts/AuthContext";
import {PartWithDocument} from "./useParts";
import {PriorityEnum, WorkflowStatusEnum} from "../lib/database.types";

export function useDocumentActions(
    setParts: React.Dispatch<React.SetStateAction<PartWithDocument[]>>,
    favoritePartIds: Set<string>,
    setFavoritePartIds: React.Dispatch<React.SetStateAction<Set<string>>>
) {
    const {currentOrg, user} = useAuth();
    const [error, setError] = useState<string | null>(null);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [docToDelete, setDocToDelete] = useState<{ id: string; file_name?: string | null } | null>(null);
    const [removeModalOpen, setRemoveModalOpen] = useState(false);
    const [partToRemove, setPartToRemove] = useState<PartWithDocument | null>(null);
    const [addToProjectOpen, setAddToProjectOpen] = useState(false);
    const [bulkProjectPartIds, setBulkProjectPartIds] = useState<string[] | null>(null);
    const [partToAdd, setPartToAdd] = useState<PartWithDocument | null>(null);

    const handleToggleFavorite = useCallback(async (part: PartWithDocument) => {
        if (!currentOrg || !user) return;
        const isFav = favoritePartIds.has(part.id);
        try {
            if (isFav) {
                await supabase.from("part_favorites").delete().eq("org_id", currentOrg.org_id).eq("user_id", user.id).eq("part_id", part.id);
                setFavoritePartIds(prev => {
                    const n = new Set(prev);
                    n.delete(part.id);
                    return n;
                });
            } else {
                await supabase.from("part_favorites").insert({
                    org_id: currentOrg.org_id,
                    user_id: user.id,
                    part_id: part.id
                });
                setFavoritePartIds(prev => new Set(prev).add(part.id));
            }
        } catch (err: any) {
            setError(err.message);
        }
    }, [currentOrg, user, favoritePartIds, setFavoritePartIds]);

    const handleWorkflowStatusChange = useCallback(async (part: PartWithDocument, value: WorkflowStatusEnum) => {
        if (!currentOrg) return;
        setParts(prev => prev.map(p => p.id === part.id ? {...p, workflow_status: value} : p));
        await supabase.from("parts").update({workflow_status: value}).eq("id", part.id).eq("org_id", currentOrg.org_id);
    }, [currentOrg, setParts]);

    const handlePriorityChange = useCallback(async (part: PartWithDocument, value: PriorityEnum) => {
        if (!currentOrg) return;
        setParts(prev => prev.map(p => p.id === part.id ? {...p, priority: value} : p));
        await supabase.from("parts").update({priority: value}).eq("id", part.id).eq("org_id", currentOrg.org_id);
    }, [currentOrg, setParts]);

    const handleBulkSetStatus = useCallback(async (partIds: string[], value: WorkflowStatusEnum) => {
        if (!currentOrg) return;
        setParts(prev => prev.map(p => partIds.includes(p.id) ? {...p, workflow_status: value} : p));
        await supabase.from("parts").update({workflow_status: value}).in("id", partIds).eq("org_id", currentOrg.org_id);
    }, [currentOrg, setParts]);

    const handleBulkSetPriority = useCallback(async (partIds: string[], value: PriorityEnum) => {
        if (!currentOrg) return;
        setParts(prev => prev.map(p => partIds.includes(p.id) ? {...p, priority: value} : p));
        await supabase.from("parts").update({priority: value}).in("id", partIds).eq("org_id", currentOrg.org_id);
    }, [currentOrg, setParts]);

    const handleBulkToggleFavorite = useCallback(async (partIds: string[], favorite: boolean) => {
        if (!currentOrg || !user) return;
        try {
            if (favorite) {
                // Odfiltrujeme ID, která už v oblíbených jsou, abychom se vyhnuli chybám při insertu
                const newIdsToInsert = partIds.filter(id => !favoritePartIds.has(id));

                if (newIdsToInsert.length > 0) {
                    const rows = newIdsToInsert.map(id => ({
                        org_id: currentOrg.org_id,
                        user_id: user.id,
                        part_id: id
                    }));

                    const {error} = await supabase
                        .from("part_favorites")
                        .insert(rows);

                    if (error) throw error;
                }

                setFavoritePartIds(prev => {
                    const n = new Set(prev);
                    partIds.forEach(id => n.add(id));
                    return n;
                });
            } else {
                const {error} = await supabase
                    .from("part_favorites")
                    .delete()
                    .eq("org_id", currentOrg.org_id)
                    .eq("user_id", user.id)
                    .in("part_id", partIds);

                if (error) throw error;

                setFavoritePartIds(prev => {
                    const n = new Set(prev);
                    partIds.forEach(id => n.delete(id));
                    return n;
                });
            }
        } catch (err: any) {
            console.error("Bulk favorite error:", err);
            setError(err.message);
        }
    }, [currentOrg, user, setFavoritePartIds]);

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

    return {
        error, setError,
        deleteModalOpen, setDeleteModalOpen, docToDelete, setDocToDelete,
        removeModalOpen, setRemoveModalOpen, partToRemove, setPartToRemove,
        addToProjectOpen, setAddToProjectOpen, bulkProjectPartIds, setBulkProjectPartIds, partToAdd, setPartToAdd,
        handleToggleFavorite, handleWorkflowStatusChange, handlePriorityChange,
        handleBulkSetStatus, handleBulkSetPriority, handleBulkToggleFavorite,
        handleOpenAddToProject, handleOpenBulkAddToProject
    };
}