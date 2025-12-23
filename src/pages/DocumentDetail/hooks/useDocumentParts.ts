import {useEffect, useState} from "react";
import {supabase} from "../../../lib/supabase";
import type {Database} from "../../../lib/database.types";

type Document = Database["public"]["Tables"]["documents"]["Row"];
type Part = Database["public"]["Tables"]["parts"]["Row"];

export function useDocumentParts(args: {
    documentId: string | undefined;
    orgId: string | null | undefined;
    partIdFromUrl: string | null;
    t: any;
}) {
    const {documentId, orgId, partIdFromUrl, t} = args;

    const [document, setDocument] = useState<Document | null>(null);
    const [parts, setParts] = useState<Part[]>([]);
    const [selectedPartId, setSelectedPartId] = useState<string | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!documentId || !orgId) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const {data: docData, error: docError} = await supabase
                    .from("documents")
                    .select("*")
                    .eq("id", documentId)
                    .eq("org_id", orgId)
                    .single();

                if (docError) throw new Error(docError.message);
                if (!docData) throw new Error("Document not found");

                setDocument(docData);

                const {data: partsData, error: partsError} = await supabase
                    .from("document_parts")
                    .select(
                        `
              part_id,
              parts (*)
            `
                    )
                    .eq("document_id", documentId);

                if (partsError) {
                    console.error("Error fetching parts:", partsError);
                } else if (partsData) {
                    const fetchedParts = partsData
                        .map((dp) => dp.parts as unknown as Part | null)
                        .filter((p): p is Part => p !== null);

                    setParts(fetchedParts);

                    if (partIdFromUrl && fetchedParts.some((p) => p.id === partIdFromUrl)) {
                        setSelectedPartId(partIdFromUrl);
                    } else if (fetchedParts.length > 0) {
                        setSelectedPartId(fetchedParts[0].id);
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : t("documents.detail.errors.failedToLoad"));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [documentId, orgId, partIdFromUrl, t]);

    return {
        document,
        parts,
        setParts,
        selectedPartId,
        setSelectedPartId,
        loading,
        error,
    };
}
