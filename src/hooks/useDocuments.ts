// import {useEffect, useState} from 'react';
// import {supabase} from '../lib/supabase';
//
// type CurrentOrg = {
//     org_id: string;
// } | null;
//
// export function useDocuments(currentOrg: CurrentOrg, pageSize: number = 50) {
//     const [documents, setDocuments] = useState<any[]>([]);
//     const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
//     const [loading, setLoading] = useState(false);      // první load
//     const [loadingMore, setLoadingMore] = useState(false); // další stránky
//     const [hasMore, setHasMore] = useState(true);
//
//     useEffect(() => {
//         const orgId = currentOrg?.org_id;
//
//         // reset při změně organizace
//         setDocuments([]);
//         setThumbnailUrls({});
//         setHasMore(true);
//
//         if (!orgId) {
//             setLoading(false);
//             return;
//         }
//
//         let isCancelled = false;
//
//         const fetchInitial = async () => {
//             setLoading(true);
//
//             const {data, error} = await supabase
//                 .from('documents')
//                 .select('*')
//                 .eq('org_id', orgId)
//                 .order('created_at', {ascending: false})
//                 .range(0, pageSize - 1);
//
//             if (isCancelled) return;
//
//             if (error) {
//                 console.error('[useDocuments] Error fetching documents:', error);
//                 setDocuments([]);
//                 setThumbnailUrls({});
//                 setHasMore(false);
//             } else {
//                 const docs = data || [];
//                 setDocuments(docs);
//
//                 // thumbnails pro první stránku
//                 if (docs.length > 0) {
//                     const urls: Record<string, string> = {};
//                     await Promise.all(
//                         docs.map(async (doc) => {
//                             if (doc.thumbnail_storage_key && doc.thumbnail_bucket) {
//                                 const {data: signedData} = await supabase.storage
//                                     .from(doc.thumbnail_bucket)
//                                     .createSignedUrl(doc.thumbnail_storage_key, 3600);
//
//                                 if (signedData?.signedUrl) {
//                                     urls[doc.id] = signedData.signedUrl;
//                                 }
//                             }
//                         }),
//                     );
//                     if (!isCancelled) {
//                         setThumbnailUrls(urls);
//                     }
//                 } else {
//                     setThumbnailUrls({});
//                 }
//
//                 setHasMore(docs.length === pageSize);
//             }
//
//             setLoading(false);
//         };
//
//         fetchInitial();
//
//         const channel = supabase
//             .channel('documents-changes')
//             .on(
//                 'postgres_changes',
//                 {
//                     event: '*',
//                     schema: 'public',
//                     table: 'documents',
//                     filter: `org_id=eq.${orgId}`,
//                 },
//                 async (payload) => {
//                     if (payload.eventType === 'INSERT') {
//                         const newDoc = payload.new as any;
//                         setDocuments((prev) => {
//                             // pokud už je v seznamu (stránkování), nepřidávej duplicitně
//                             if (prev.some((d) => d.id === newDoc.id)) return prev;
//                             return [newDoc, ...prev];
//                         });
//                     } else if (payload.eventType === 'UPDATE') {
//                         const newDoc = payload.new as any;
//                         setDocuments((prev) =>
//                             prev.map((doc) => (doc.id === newDoc.id ? newDoc : doc)),
//                         );
//
//                         if (newDoc.thumbnail_storage_key && newDoc.thumbnail_bucket) {
//                             const {data: signedData} = await supabase.storage
//                                 .from(newDoc.thumbnail_bucket)
//                                 .createSignedUrl(newDoc.thumbnail_storage_key, 3600);
//                             if (signedData?.signedUrl) {
//                                 setThumbnailUrls((prev) => ({
//                                     ...prev,
//                                     [newDoc.id]: signedData.signedUrl,
//                                 }));
//                             }
//                         }
//                     } else if (payload.eventType === 'DELETE') {
//                         setDocuments((prev) => prev.filter((doc) => doc.id !== payload.old.id));
//                         setThumbnailUrls((prev) => {
//                             const next = {...prev};
//                             delete next[payload.old.id];
//                             return next;
//                         });
//                     }
//                 },
//             )
//             .subscribe();
//
//         return () => {
//             isCancelled = true;
//             supabase.removeChannel(channel);
//         };
//     }, [currentOrg?.org_id, pageSize]);
//
//     const loadMore = async () => {
//         const orgId = currentOrg?.org_id;
//         if (!orgId) return;
//         if (loadingMore) return;
//         if (!hasMore) return;
//
//         setLoadingMore(true);
//
//         const from = documents.length;
//         const to = from + pageSize - 1;
//
//         const {data, error} = await supabase
//             .from('documents')
//             .select('*')
//             .eq('org_id', orgId)
//             .order('created_at', {ascending: false})
//             .range(from, to);
//
//         if (error) {
//             console.error('[useDocuments] Error loading more documents:', error);
//             setLoadingMore(false);
//             setHasMore(false);
//             return;
//         }
//
//         const newDocs = data || [];
//
//         // přidáme nové dokumenty bez duplikátů
//         setDocuments((prev) => {
//             const existingIds = new Set(prev.map((d) => d.id));
//             const toAdd = newDocs.filter((d) => !existingIds.has(d.id));
//             return [...prev, ...toAdd];
//         });
//
//         // thumbnails jen pro nově přidané
//         if (newDocs.length > 0) {
//             const urls: Record<string, string> = {};
//             await Promise.all(
//                 newDocs.map(async (doc) => {
//                     if (doc.thumbnail_storage_key && doc.thumbnail_bucket) {
//                         const {data: signedData} = await supabase.storage
//                             .from(doc.thumbnail_bucket)
//                             .createSignedUrl(doc.thumbnail_storage_key, 3600);
//
//                         if (signedData?.signedUrl) {
//                             urls[doc.id] = signedData.signedUrl;
//                         }
//                     }
//                 }),
//             );
//             setThumbnailUrls((prev) => ({
//                 ...prev,
//                 ...urls,
//             }));
//         }
//
//         setHasMore(newDocs.length === pageSize);
//         setLoadingMore(false);
//     };
//
//     return {
//         documents,
//         thumbnailUrls,
//         loading,
//         loadingMore,
//         hasMore,
//         loadMore,
//         setDocuments,
//         setThumbnailUrls,
//     };
// }
