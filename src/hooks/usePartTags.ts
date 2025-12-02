// src/hooks/usePartTags.ts
import {useCallback, useEffect, useState} from "react";
import {supabase} from "../lib/supabase";
import type {Database} from "../lib/database.types";

type PartTagRow = Database["public"]["Tables"]["part_tags"]["Row"];

export function usePartTags(partId: string | null, orgId?: string | null) {
    const [tags, setTags] = useState<PartTagRow[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // načtení tagů
    useEffect(() => {
        if (!partId || !orgId) {
            setTags([]);
            return;
        }

        const fetchTags = async () => {
            setLoading(true);
            setError(null);

            const {data, error} = await supabase
                .from("part_tags")
                .select("*")
                .eq("org_id", orgId)
                .eq("part_id", partId)
                .order("label", {ascending: true});

            if (error) {
                console.error("[usePartTags] error fetching tags:", error);
                setError(error.message);
                setTags([]);
            } else {
                setTags(data || []);
            }

            setLoading(false);
        };

        fetchTags().catch((err) => {
            console.error("[usePartTags] unexpected error:", err);
            setError("Unexpected error");
            setLoading(false);
        });
    }, [partId, orgId]);

    // přidání tagu
    const addTag = useCallback(
        async (label: string) => {
            if (!partId || !orgId) return;

            const trimmed = label.trim();
            if (!trimmed) return;

            // pokud už tag existuje, nic nedělej
            if (tags.some((t) => t.label.toLowerCase() === trimmed.toLowerCase())) {
                return;
            }

            const {data, error} = await supabase
                .from("part_tags")
                .insert({
                    org_id: orgId,
                    part_id: partId,
                    label: trimmed,
                })
                .select("*")
                .single();

            if (error) {
                // pohlcení unique constraintu
                if (error.message.includes("uq_part_tag")) {
                    return;
                }
                console.error("[usePartTags] error inserting tag:", error);
                setError(error.message);
                return;
            }

            if (data) {
                setTags((prev) => [...prev, data]);
            }
        },
        [orgId, partId, tags]
    );

    // smazání tagu
    const removeTag = useCallback(
        async (tagId: string) => {
            const {error} = await supabase
                .from("part_tags")
                .delete()
                .eq("id", tagId);

            if (error) {
                console.error("[usePartTags] error deleting tag:", error);
                setError(error.message);
                return;
            }

            setTags((prev) => prev.filter((t) => t.id !== tagId));
        },
        []
    );

    return {tags, loading, error, addTag, removeTag};
}
