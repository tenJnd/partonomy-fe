import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';

type CurrentOrg = {
  org_id: string;
} | null;

export interface PartWithDocument {
  id: string;
  page: number | null;
  drawing_title: string | null;
  part_number: string | null;
  drawing_number: string | null;
  company_name: string | null;
  material: string | null;
  primary_class: string | null;
  secondary_class: string | null;
  envelope_text: string | null;
  overall_complexity: string | null;
  fit_level: string | null;
  created_at: string;
  last_updated: string;
  workflow_status: string | null;
  priority: string | null
  document: {
    id: string;
    file_name: string;
    last_status: string | null;
    created_at: string;
  } | null;
  isProcessingPlaceholder?: boolean;
  revision_changed: boolean | null;
}

// Helper – z jednoho řádku z document_parts udělá PartWithDocument
function mapDocumentPartsRowToPartWithDocument(item: any): PartWithDocument | null {
  if (!item) return null;

  const partData = Array.isArray(item.parts) ? item.parts[0] : item.parts;
  const docData = Array.isArray(item.documents) ? item.documents[0] : item.documents;

  if (!partData) return null;

  return {
    id: partData.id,
    page: partData.page ?? null,
    drawing_title: partData.drawing_title ?? null,
    part_number: partData.part_number ?? null,
    drawing_number: partData.drawing_number ?? null,
    company_name: partData.company_name ?? null,
    material: partData.material ?? null,
    primary_class: partData.primary_class ?? null,
    secondary_class: partData.secondary_class ?? null,
    envelope_text: partData.envelope_text ?? null,
    overall_complexity: partData.overall_complexity ?? null,
    fit_level: partData.fit_level ?? null,
    created_at: partData.created_at,
    last_updated: partData.last_updated,
    workflow_status: partData.workflow_status,
    priority: partData.priority,
    revision_changed: partData.revision_changed ?? null,
    document: docData
      ? {
          id: docData.id,
          file_name: docData.file_name,
          last_status: docData.last_status,
          created_at: docData.created_at,
        }
      : null,
  };
}

export function useParts(currentOrg: CurrentOrg, pageSize: number = 50) {
  const [parts, setParts] = useState<PartWithDocument[]>([]);
  const [processingDocs, setProcessingDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    const orgId = currentOrg?.org_id;

    setParts([]);
    setProcessingDocs([]);
    setHasMore(true);

    if (!orgId) {
      setLoading(false);
      return;
    }

    let isCancelled = false;

    const fetchInitial = async () => {
      setLoading(true);

      // 1) První dávka parts + documents
      const { data: partsData, error: partsError } = await supabase
      .from("document_parts")
      .select(
        `
          part_id,
          document_id,
          parts (*),
          documents (
            id,
            file_name,
            last_status,
            created_at
          )
        `
      )
      .eq("parts.org_id", orgId)
      .order("parts(last_updated)", { ascending: false })
      .range(0, pageSize - 1);


      // 2) Dokumenty, které jsou queued / processing / error a ještě nemají parts
      const { data: processingData, error: processingError } = await supabase
        .from('documents')
        .select('id, file_name, last_status, created_at')
        .eq('org_id', orgId)
        .in('last_status', ['queued', 'processing', 'error']) // ⬅ sjednoceno na "error"
        .order('created_at', { ascending: false });

      if (isCancelled) return;

      if (!partsError && partsData) {
        const parsedParts: PartWithDocument[] = (partsData || [])
          .map(mapDocumentPartsRowToPartWithDocument)
          .filter((p): p is PartWithDocument => !!p);

        setParts(parsedParts);
        setHasMore(partsData.length === pageSize);
      }

      if (!processingError && processingData) {
        const partsDocIds = new Set(
          (partsData || []).map((item: any) => item.document_id),
        );
        const docsWithoutParts = (processingData || []).filter(
          (doc) => !partsDocIds.has(doc.id),
        );
        setProcessingDocs(docsWithoutParts);
      }

      setLoading(false);
    };

    fetchInitial();

    // Realtime: parts
    const partsChannel = supabase
      .channel('parts-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'parts',
          filter: `org_id=eq.${orgId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const { data: newPartData } = await supabase
              .from('document_parts')
              .select(`
                part_id,
                document_id,
                parts (*),
                documents (*)
              `)
              .eq('part_id', (payload.new as any).id)
              .single();

            const newPart = mapDocumentPartsRowToPartWithDocument(newPartData);
            if (newPart) {
              setParts((prev) => {
                if (prev.some((p) => p.id === newPart.id)) return prev;
                return [newPart, ...prev];
              });

              // už není jen placeholder → vyhoď ho z processingDocs
              setProcessingDocs((prev) =>
                prev.filter((d) => d.id !== (newPartData as any).document_id),
              );
            }
          } else if (payload.eventType === 'UPDATE') {
            setParts((prev) =>
              prev.map((part) =>
                part.id === (payload.new as any).id
                  ? {
                      ...part,
                      ...(payload.new as any),
                    }
                  : part,
              ),
            );
          } else if (payload.eventType === 'DELETE') {
            setParts((prev) => prev.filter((part) => part.id !== (payload.old as any).id));
          }
        },
      )
      .subscribe();

    // Realtime: documents (status + doplnění parts po success)
    const docsChannel = supabase
      .channel('documents-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'documents',
          filter: `org_id=eq.${orgId}`,
        },
        async (payload) => {
          if (payload.eventType === 'INSERT') {
            const newDoc = payload.new as any;
            if (['queued', 'processing', 'error'].includes(newDoc.last_status)) {
              setProcessingDocs((prev) => {
                if (prev.some((d) => d.id === newDoc.id)) return prev;
                return [newDoc, ...prev];
              });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedDoc = payload.new as any;

            // správa processingDocs
            if (['queued', 'processing', 'error'].includes(updatedDoc.last_status)) {
              setProcessingDocs((prev) => {
                const existing = prev.find((d) => d.id === updatedDoc.id);
                if (existing) {
                  return prev.map((d) => (d.id === updatedDoc.id ? updatedDoc : d));
                }
                return [updatedDoc, ...prev];
              });
            } else {
              setProcessingDocs((prev) => prev.filter((d) => d.id !== updatedDoc.id));
            }

            // update statusu v existujících parts
            setParts((prev) =>
              prev.map((part) => {
                if (part.document?.id === updatedDoc.id && part.document) {
                  return {
                    ...part,
                    document: {
                      ...part.document,
                      last_status: updatedDoc.last_status,
                    },
                  };
                }
                return part;
              }),
            );

            // ⬇⬇ DŮLEŽITÉ: jakmile se dokument přepne na success, dotáhni parts
            if (updatedDoc.last_status === 'success') {
              const { data: docPartsData, error: docPartsError } = await supabase
                .from('document_parts')
                .select(`
                  part_id,
                  document_id,
                  parts (*),
                  documents (*)
                `)
                .eq('document_id', updatedDoc.id);

              if (!docPartsError && docPartsData) {
                const newParts = (docPartsData || [])
                  .map(mapDocumentPartsRowToPartWithDocument)
                  .filter((p): p is PartWithDocument => !!p);

                if (newParts.length > 0) {
                  setParts((prev) => {
                    const existingById = new Map(prev.map((p) => [p.id, p]));
                    for (const p of newParts) {
                      existingById.set(p.id, {
                        ...(existingById.get(p.id) || {}),
                        ...p,
                      });
                    }
                    return Array.from(existingById.values()).sort((a, b) =>
                      (b.last_updated || '').localeCompare(a.last_updated || ''),
                    );
                  });

                  // dokument už má parts → placeholder pryč
                  setProcessingDocs((prev) =>
                    prev.filter((d) => d.id !== updatedDoc.id),
                  );
                }
              }
            }
          } else if (payload.eventType === 'DELETE') {
            setProcessingDocs((prev) => prev.filter((d) => d.id !== (payload.old as any).id));
            setParts((prev) =>
              prev.filter((p) => p.document?.id !== (payload.old as any).id),
            );
          }
        },
      )
      .subscribe();

    return () => {
      isCancelled = true;
      supabase.removeChannel(partsChannel);
      supabase.removeChannel(docsChannel);
    };
  }, [currentOrg?.org_id, pageSize]);

  const loadMore = async () => {
    const orgId = currentOrg?.org_id;
    if (!orgId) return;
    if (loadingMore) return;
    if (!hasMore) return;

    setLoadingMore(true);

    const from = parts.length;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('document_parts')
      .select(`
        part_id,
        document_id,
        parts (*),
        documents (*)
      `)
      .eq('parts.org_id', orgId)
      .order('parts(last_updated)', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('[useParts] Error loading more parts:', error);
      setLoadingMore(false);
      setHasMore(false);
      return;
    }

    const newParts = (data || [])
      .map(mapDocumentPartsRowToPartWithDocument)
      .filter((p): p is PartWithDocument => !!p);

    setParts((prev) => {
      const existingIds = new Set(prev.map((p) => p.id));
      const toAdd = newParts.filter((p) => !existingIds.has(p.id));
      return [...prev, ...toAdd];
    });

    setHasMore(newParts.length === pageSize);
    setLoadingMore(false);
  };

  const combinedData = useMemo(() => {
    const placeholders: PartWithDocument[] = processingDocs.map((doc) => ({
      id: `processing-${doc.id}`,
      page: null,
      drawing_title: null,
      part_number: null,
      drawing_number: null,
      company_name: null,
      material: null,
      primary_class: null,
      secondary_class: null,
      envelope_text: null,
      overall_complexity: null,
      fit_level: null,
      created_at: doc.created_at,
      last_updated: doc.created_at,
      workflow_status: null,
      priority: null,
      revision_changed: null,
      document: {
        id: doc.id,
        file_name: doc.file_name,
        last_status: doc.last_status,
        created_at: doc.created_at,
      },
      isProcessingPlaceholder: true,
    }));

    return [...placeholders, ...parts];
  }, [processingDocs, parts]);

  return {
    parts: combinedData,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    setParts,
  };
}
