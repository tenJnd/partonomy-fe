// src/hooks/actions/useFavoritesSetActions.ts
import {useCallback, useState} from "react";
import {supabase} from "../../lib/supabase";
import {useAuth} from "../../contexts/AuthContext";

export function useFavoritesSetActions(params: {
    favoritePartIds: Set<string>;
    setFavoritePartIds: React.Dispatch<React.SetStateAction<Set<string>>>;
}) {
    const {currentOrg, user} = useAuth();
    const {favoritePartIds, setFavoritePartIds} = params;

    const [error, setError] = useState<string | null>(null);

    const toggleFavoriteById = useCallback(
        async (partId: string) => {
            if (!currentOrg || !user) return;

            const isFav = favoritePartIds.has(partId);

            try {
                if (isFav) {
                    const {error} = await supabase
                        .from("part_favorites")
                        .delete()
                        .eq("org_id", currentOrg.org_id)
                        .eq("user_id", user.id)
                        .eq("part_id", partId);

                    if (error) throw error;

                    setFavoritePartIds((prev) => {
                        const n = new Set(prev);
                        n.delete(partId);
                        return n;
                    });
                } else {
                    const {error} = await supabase.from("part_favorites").insert({
                        org_id: currentOrg.org_id,
                        user_id: user.id,
                        part_id: partId,
                    });

                    if (error) throw error;

                    setFavoritePartIds((prev) => new Set(prev).add(partId));
                }
            } catch (err: any) {
                setError(err.message);
            }
        },
        [currentOrg, user, favoritePartIds, setFavoritePartIds]
    );

    const bulkSetFavorite = useCallback(
        async (partIds: string[], favorite: boolean) => {
            if (!currentOrg || !user) return;

            try {
                if (favorite) {
                    const newIdsToInsert = partIds.filter((id) => !favoritePartIds.has(id));

                    if (newIdsToInsert.length > 0) {
                        const rows = newIdsToInsert.map((id) => ({
                            org_id: currentOrg.org_id,
                            user_id: user.id,
                            part_id: id,
                        }));

                        const {error} = await supabase.from("part_favorites").insert(rows);
                        if (error) throw error;
                    }

                    setFavoritePartIds((prev) => {
                        const n = new Set(prev);
                        partIds.forEach((id) => n.add(id));
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

                    setFavoritePartIds((prev) => {
                        const n = new Set(prev);
                        partIds.forEach((id) => n.delete(id));
                        return n;
                    });
                }
            } catch (err: any) {
                setError(err.message);
            }
        },
        [currentOrg, user, favoritePartIds, setFavoritePartIds]
    );

    return {
        error,
        setError,
        toggleFavoriteById,
        bulkSetFavorite,
    };
}
