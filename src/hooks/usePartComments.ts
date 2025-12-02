// src/hooks/usePartComments.ts
import {useCallback, useEffect, useState} from "react";
import {supabase} from "../lib/supabase";
import {useAuth} from "../contexts/AuthContext";
import type {Database} from "../lib/database.types";

type PartComment = Database["public"]["Tables"]["part_comments"]["Row"];

interface UsePartCommentsResult {
    comments: PartComment[];
    loading: boolean;
    error: string | null;
    addComment: (body: string) => Promise<void>;
}

export function usePartComments(
    partId: string | null,
    orgId: string | undefined
): UsePartCommentsResult {
    const {user} = useAuth();
    const [comments, setComments] = useState<PartComment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchComments = useCallback(async () => {
        if (!partId || !orgId) {
            setComments([]);
            return;
        }

        setLoading(true);
        setError(null);

        const {data, error} = await supabase
            .from("part_comments")
            .select("*")
            .eq("org_id", orgId)
            .eq("part_id", partId)
            .order("created_at", {ascending: true});

        if (error) {
            console.error("Error fetching part comments:", error);
            setError(error.message);
            setComments([]);
        } else {
            // 🔹 VŽDY přepíšeme celé pole, žádné přidávání k existujícím
            setComments((data ?? []) as PartComment[]);
        }

        setLoading(false);
    }, [partId, orgId]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const addComment = useCallback(
        async (body: string) => {
            if (!user || !partId || !orgId) return;
            const trimmed = body.trim();
            if (!trimmed) return;

            const {error} = await supabase.from("part_comments").insert({
                org_id: orgId,
                part_id: partId,
                user_id: user.id,
                author_name:
                    (user.user_metadata && user.user_metadata.full_name) ||
                    user.email ||
                    "User",
                body: trimmed,
            });

            if (error) {
                console.error("Error adding comment:", error);
                setError(error.message);
                return;
            }

            // 🔹 Po insertu prostě refetchneme – žádné lokální pushování,
            // tím eliminujeme všechny duplicitní kombinace.
            await fetchComments();
        },
        [user, partId, orgId, fetchComments]
    );

    return {comments, loading, error, addComment};
}
