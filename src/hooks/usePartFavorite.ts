// src/hooks/usePartFavorite.ts
import {useCallback, useEffect, useState} from "react";
import {supabase} from "../lib/supabase";
import type {Database} from "../lib/database.types";

type PartFavoriteRow = Database["public"]["Tables"]["part_favorites"]["Row"];

export function usePartFavorite(
    partId: string | null,
    orgId: string | null | undefined,
    userId: string | null | undefined
) {
    const [favorite, setFavorite] = useState<PartFavoriteRow | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // je aktuální part pro usera favorite?
    useEffect(() => {
        if (!partId || !orgId || !userId) {
            setFavorite(null);
            return;
        }

        const fetchFavorite = async () => {
            setLoading(true);
            setError(null);

            const {data, error} = await supabase
                .from("part_favorites")
                .select("*")
                .eq("org_id", orgId)
                .eq("part_id", partId)
                .eq("user_id", userId)
                .limit(1)
                .maybeSingle();

            if (error && error.code !== "PGRST116") {
                // PGRST116 = no rows
                console.error("[usePartFavorite] error fetching:", error);
                setError(error.message);
                setFavorite(null);
            } else {
                setFavorite(data ?? null);
            }

            setLoading(false);
        };

        fetchFavorite().catch((err) => {
            console.error("[usePartFavorite] unexpected:", err);
            setError("Unexpected error");
            setLoading(false);
        });
    }, [partId, orgId, userId]);

    const toggleFavorite = useCallback(async () => {
        if (!partId || !orgId || !userId) return;

        setError(null);

        // aktuálně je favorite -> smažeme
        if (favorite) {
            const {error} = await supabase
                .from("part_favorites")
                .delete()
                .eq("id", favorite.id);

            if (error) {
                console.error("[usePartFavorite] error deleting:", error);
                setError(error.message);
                return;
            }

            setFavorite(null);
            return;
        }

        // není favorite -> vložíme
        const {data, error} = await supabase
            .from("part_favorites")
            .insert({
                org_id: orgId,
                part_id: partId,
                user_id: userId,
            })
            .select("*")
            .single();

        if (error) {
            // unique constraint – někdo mezitím zapsal, tak jen refresh
            if (error.message.includes("uq_part_favorites_org_part_user")) {
                const {data: refetched} = await supabase
                    .from("part_favorites")
                    .select("*")
                    .eq("org_id", orgId)
                    .eq("part_id", partId)
                    .eq("user_id", userId)
                    .limit(1)
                    .maybeSingle();
                setFavorite(refetched ?? null);
                return;
            }

            console.error("[usePartFavorite] error inserting:", error);
            setError(error.message);
            return;
        }

        setFavorite(data);
    }, [favorite, orgId, partId, userId]);

    return {
        isFavorite: !!favorite,
        favorite,
        loading,
        error,
        toggleFavorite,
    };
}
