import {useEffect, useState} from 'react';
import {supabase} from '../lib/supabase';

type CurrentOrg = {
    org_id: string;
} | null;

export function useDocuments(currentOrg: CurrentOrg) {
    const [documents, setDocuments] = useState<any[]>([]);
    const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const orgId = currentOrg?.org_id;

        if (!orgId) {
            setDocuments([]);
            setThumbnailUrls({});
            setLoading(false);
            return;
        }

        let isCancelled = false;

        const fetchDocuments = async () => {
            setLoading(true);

            const {data, error} = await supabase
                .from('documents')
                .select('*')
                .eq('org_id', orgId)
                .order('created_at', {ascending: false});

            if (error) {
                console.error('[useDocuments] Error fetching documents:', error);
                if (!isCancelled) {
                    setDocuments([]);
                    setThumbnailUrls({});
                }
            } else if (!isCancelled) {
                setDocuments(data || []);

                if (data && data.length > 0) {
                    const urls: Record<string, string> = {};
                    await Promise.all(
                        data.map(async (doc) => {
                            if (doc.thumbnail_storage_key && doc.thumbnail_bucket) {
                                const {data: signedData} = await supabase.storage
                                    .from(doc.thumbnail_bucket)
                                    .createSignedUrl(doc.thumbnail_storage_key, 3600);

                                if (signedData?.signedUrl) {
                                    urls[doc.id] = signedData.signedUrl;
                                }
                            }
                        }),
                    );
                    if (!isCancelled) {
                        setThumbnailUrls(urls);
                    }
                } else {
                    setThumbnailUrls({});
                }
            }

            if (!isCancelled) {
                setLoading(false);
            }
        };

        fetchDocuments();

        const channel = supabase
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
                        setDocuments((prev) => [payload.new as any, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        const newDoc = payload.new as any;
                        setDocuments((prev) =>
                            prev.map((doc) => (doc.id === newDoc.id ? newDoc : doc)),
                        );

                        if (newDoc.thumbnail_storage_key && newDoc.thumbnail_bucket) {
                            const {data: signedData} = await supabase.storage
                                .from(newDoc.thumbnail_bucket)
                                .createSignedUrl(newDoc.thumbnail_storage_key, 3600);
                            if (signedData?.signedUrl) {
                                setThumbnailUrls((prev) => ({
                                    ...prev,
                                    [newDoc.id]: signedData.signedUrl,
                                }));
                            }
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setDocuments((prev) => prev.filter((doc) => doc.id !== payload.old.id));
                        setThumbnailUrls((prev) => {
                            const next = {...prev};
                            delete next[payload.old.id];
                            return next;
                        });
                    }
                },
            )
            .subscribe();

        return () => {
            isCancelled = true;
            supabase.removeChannel(channel);
        };
    }, [currentOrg?.org_id]);

    return {
        documents,
        thumbnailUrls,
        loading,
        setDocuments,
        setThumbnailUrls,
    };
}
