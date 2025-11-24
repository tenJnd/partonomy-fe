import React, {useEffect, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {
    AlertCircle,
    CheckCircle,
    FileText,
    Grid3x3,
    List,
    Loader,
    MoreHorizontal,
    Upload,
    XCircle,
} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';
import {supabase} from '../lib/supabase';
import {uploadDocument, validateFile} from '../lib/storageHelpers';
import DeleteDocumentModal from '../components/DeleteDocumentModal';

type ViewMode = 'grid' | 'list';

const Documents: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState('');
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
    const [isDragging, setIsDragging] = useState(false);
    const [rowMenuOpenId, setRowMenuOpenId] = useState<string | null>(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [docToDelete, setDocToDelete] = useState<any | null>(null);


    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const {currentOrg, user} = useAuth();

    // Fetch documents + realtime
    useEffect(() => {
        if (!currentOrg) return;

        const fetchDocuments = async () => {
            const {data, error} = await supabase
                .from('documents')
                .select('*')
                .eq('org_id', currentOrg.org_id)
                .order('created_at', {ascending: false});

            if (error) {
                console.error('[Documents] Error fetching documents:', error);
            } else {
                setDocuments(data || []);
                // thumbnails
                if (data) {
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
                        })
                    );
                    setThumbnailUrls(urls);
                }
            }
            setLoading(false);
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
                    filter: `org_id=eq.${currentOrg.org_id}`,
                },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setDocuments((prev) => [payload.new as any, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        const newDoc = payload.new as any;
                        setDocuments((prev) =>
                            prev.map((doc) => (doc.id === newDoc.id ? newDoc : doc))
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
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [currentOrg]);

    const displayDocuments = documents;

    const getStatusConfig = (status: string) => {
        switch (status) {
            case 'queued':
                return {
                    label: 'Queued',
                    icon: Loader,
                    className: 'bg-gray-50 text-gray-700 border-gray-200',
                    borderColor: 'border-l-gray-400',
                };
            case 'processing':
                return {
                    label: 'Processing',
                    icon: Loader,
                    className: 'bg-blue-50 text-blue-700 border-blue-200',
                    borderColor: 'border-l-blue-500',
                };
            case 'success':
                return {
                    label: 'Completed',
                    icon: CheckCircle,
                    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    borderColor: 'border-l-emerald-500',
                };
            case 'failed':
                return {
                    label: 'Failed',
                    icon: XCircle,
                    className: 'bg-rose-50 text-rose-700 border-rose-200',
                    borderColor: 'border-l-rose-500',
                };
            default:
                return {
                    label: 'Unknown',
                    icon: AlertCircle,
                    className: 'bg-gray-50 text-gray-700 border-gray-200',
                    borderColor: 'border-l-gray-400',
                };
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMs = now.getTime() - date.getTime();
        const diffInHours = diffInMs / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return `${Math.floor(diffInHours)}h ago`;
        } else if (diffInHours < 168) {
            return `${Math.floor(diffInHours / 24)}d ago`;
        } else {
            return date.toLocaleDateString();
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    // ⬇⬇ ACTION HANDLERS (menu)

    const handleRerunDocument = async (docId: string) => {
        try {
            const {error} = await supabase
                .from('documents')
                .update({
                    last_status: 'queued',
                    last_error: null,
                })
                .eq('id', docId);

            if (error) {
                console.error('[Documents] Error rerunning document:', error);
                setUploadError(error.message || 'Failed to re-run document');
            }
        } catch (err: any) {
            console.error('[Documents] Error rerunning document:', err);
            setUploadError(err.message || 'Failed to re-run document');
        } finally {
            setRowMenuOpenId(null);
        }
    };

    // otevře modal pro delete
    const openDeleteModal = (doc: any) => {
        setDocToDelete(doc);
        setDeleteModalOpen(true);
        setRowMenuOpenId(null);
    };

// samotný delete po potvrzení v modalu
    const handleDeleteDocumentConfirm = async () => {
        if (!docToDelete) return;

        try {
            const {error} = await supabase
                .from('documents')
                .delete()
                .eq('id', docToDelete.id);

            if (error) {
                console.error('[Documents] Error deleting document:', error);
                setUploadError(error.message || 'Failed to delete document');
            }
        } catch (err: any) {
            console.error('[Documents] Error deleting document:', err);
            setUploadError(err.message || 'Failed to delete document');
        } finally {
            setDeleteModalOpen(false);
            setDocToDelete(null);
        }
    };


    const handleDownloadDocument = async (doc: any) => {
        try {
            if (!doc.raw_bucket || !doc.raw_storage_key) {
                setUploadError('Original file is not available for this document.');
                return;
            }

            const {data, error} = await supabase.storage
                .from(doc.raw_bucket)
                .createSignedUrl(doc.raw_storage_key, 60);

            if (error || !data?.signedUrl) {
                console.error('[Documents] Error generating download URL:', error);
                setUploadError('Failed to generate download link.');
                return;
            }

            const link = document.createElement('a');
            link.href = data.signedUrl;
            link.download = doc.file_name || 'document';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err: any) {
            console.error('[Documents] Error downloading document:', err);
            setUploadError(err.message || 'Failed to download document');
        } finally {
            setRowMenuOpenId(null);
        }
    };

    // společná funkce pro upload více souborů
    const uploadFiles = async (files: File[]) => {
        if (!currentOrg || !user || files.length === 0) return;

        setUploadError('');
        setUploadProgress(0);
        setUploading(true);

        let lastError: string | null = null;

        try {
            for (let i = 0; i < files.length; i++) {
                const file = files[i];

                const validationError = validateFile(file);
                if (validationError) {
                    lastError = validationError.message;
                    continue;
                }

                const baseProgress = Math.round((i / files.length) * 100);
                setUploadProgress(baseProgress);

                const {data: existingDoc} = await supabase
                    .from('documents')
                    .select('id')
                    .eq('org_id', currentOrg.org_id)
                    .eq('file_name', file.name)
                    .maybeSingle();

                const documentId = existingDoc?.id || crypto.randomUUID();

                const {key, error: uploadErrorRes} = await uploadDocument(
                    file,
                    currentOrg.org_id,
                    documentId
                );

                if (uploadErrorRes || !key) {
                    lastError = uploadErrorRes?.message || 'Upload failed';
                    continue;
                }

                setUploadProgress(baseProgress + 30);

                if (existingDoc) {
                    const {error: updateError} = await supabase
                        .from('documents')
                        .update({
                            user_id: user.id,
                            raw_storage_key: key,
                            last_status: 'queued',
                            last_error: null,
                            updated_at: new Date().toISOString(),
                        })
                        .eq('id', documentId);

                    if (updateError) {
                        lastError = updateError.message;
                        continue;
                    }
                } else {
                    const {error: insertError} = await supabase
                        .from('documents')
                        .insert({
                            id: documentId,
                            org_id: currentOrg.org_id,
                            user_id: user.id,
                            file_name: file.name,
                            raw_bucket: 'documents-raw',
                            raw_storage_key: key,
                            thumbnail_bucket: 'document-thumbnails',
                            thumbnail_storage_key: null,
                            page_count: null,
                            last_status: 'queued',
                            last_error: null,
                            last_job_id: null,
                            primary_part_id: null,
                            detected_parts_count: null,
                        });

                    if (insertError) {
                        lastError = insertError.message;
                        continue;
                    }
                }

                setUploadProgress(Math.round(((i + 1) / files.length) * 100));
            }
        } finally {
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
            }, 500);

            if (lastError) {
                setUploadError(lastError);
            }
        }
    };

    // input change – více souborů
    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        await uploadFiles(Array.from(files));

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Drag & Drop handlers – NA CELÉ STRÁNCE
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.currentTarget === e.target) {
            setIsDragging(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const files = e.dataTransfer.files;
        if (!files || files.length === 0) return;

        await uploadFiles(Array.from(files));
    };

    return (
        <div
            className="min-h-screen relative"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isDragging && (
                <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-40">
                    <div
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg text-sm font-medium opacity-90">
                        Drop files to upload
                    </div>
                </div>
            )}

            <div
                className={`p-6 max-w-7xl mx-auto transition-all duration-150 ${
                    isDragging ? 'blur-sm pointer-events-none' : ''
                }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
                    <button
                        onClick={handleUploadClick}
                        disabled={uploading}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg shadow-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                    >
                        <Upload className="w-4 h-4" strokeWidth={1.5}/>
                        <span className="text-sm font-medium">
              {uploading ? 'Uploading...' : 'Upload Documents'}
            </span>
                    </button>
                </div>

                {/* Hidden File Input – multiple */}
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.dwg,.dxf"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Upload Error Display */}
                {uploadError && (
                    <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" strokeWidth={1.5}/>
                        <p className="text-sm text-rose-700">{uploadError}</p>
                    </div>
                )}

                {/* Upload Progress Display */}
                {uploading && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-900">
                Uploading documents...
              </span>
                            <span className="text-sm text-blue-700">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{width: `${uploadProgress}%`}}
                            />
                        </div>
                    </div>
                )}

                {/* Filters Bar */}
                <div className="flex items-center gap-3 mb-6 flex-wrap">
                    {/*<div className="relative flex-1 min-w-[200px]">*/}
                    {/*    <Search*/}
                    {/*        className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"*/}
                    {/*        strokeWidth={1.5}*/}
                    {/*    />*/}
                    {/*    <input*/}
                    {/*        type="text"*/}
                    {/*        placeholder="Search documents..."*/}
                    {/*        className="w-full h-[38px] pl-10 pr-4 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-sm"*/}
                    {/*    />*/}
                    {/*</div>*/}
                    <select
                        className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-sm">
                        <option>All Status</option>
                        <option>Processed</option>
                        <option>Processing</option>
                        <option>Error</option>
                    </select>
                    <select
                        className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-sm">
                        <option>All Time</option>
                        <option>Last 7 days</option>
                        <option>Last 30 days</option>
                        <option>Last 90 days</option>
                    </select>
                    <div className="flex border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`px-3 py-2 transition-colors ${
                                viewMode === 'grid'
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                            title="Grid view"
                        >
                            <Grid3x3 className="w-4 h-4" strokeWidth={1.5}/>
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-3 py-2 transition-colors ${
                                viewMode === 'list'
                                    ? 'bg-gray-100 text-gray-900'
                                    : 'bg-white text-gray-500 hover:bg-gray-50'
                            }`}
                            title="List view"
                        >
                            <List className="w-4 h-4" strokeWidth={1.5}/>
                        </button>
                    </div>
                </div>

                {/* Documents List/Grid */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader className="w-8 h-8 text-gray-400 animate-spin" strokeWidth={1.5}/>
                    </div>
                ) : displayDocuments.length === 0 ? (
                    <div className="text-center py-12">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={1.5}/>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Upload your first document to get started
                        </p>
                        <button
                            onClick={handleUploadClick}
                            disabled={uploading}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg shadow-sm transition-all disabled:cursor-not-allowed"
                        >
                            <Upload className="w-4 h-4" strokeWidth={1.5}/>
                            <span className="text-sm font-medium">
                {uploading ? 'Uploading...' : 'Upload Documents'}
              </span>
                        </button>
                    </div>
                ) : (
                    <div
                        className={
                            viewMode === 'grid'
                                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                                : 'space-y-3'
                        }
                    >
                        {displayDocuments.map((doc) => {
                            const statusConfig = getStatusConfig(doc.last_status);
                            const StatusIcon = statusConfig.icon;
                            const thumbnailUrl = thumbnailUrls[doc.id];

                            // ROW MENU BUTTON
                            const RowMenu = (
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setRowMenuOpenId((prev) => (prev === doc.id ? null : doc.id));
                                        }}
                                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                        <MoreHorizontal className="w-4 h-4 text-gray-500"/>
                                    </button>
                                    {rowMenuOpenId === doc.id && (
                                        <>
                                            {/* backdrop – zavře menu, ale nezpůsobí navigate */}
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={(e) => {
                                                    e.stopPropagation();        // ⬅️ důležité
                                                    setRowMenuOpenId(null);
                                                }}
                                            />

                                            {/* samotné menu – taky stopPropagation, aby klik uvnitř neotevřel detail */}
                                            <div
                                                className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleRerunDocument(doc.id);
                                                    }}
                                                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    Re-run Report
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDownloadDocument(doc);
                                                    }}
                                                    className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    Download
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        openDeleteModal(doc);
                                                    }}
                                                    className="w-full text-left px-3 py-1.5 text-sm text-rose-600 hover:bg-rose-50"
                                                >
                                                    Delete file
                                                </button>

                                            </div>
                                        </>
                                    )}

                                </div>
                            );

                            return viewMode === 'grid' ? (
                                <div
                                    key={doc.id}
                                    className={`group bg-white border border-gray-200 ${statusConfig.borderColor} border-l-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer p-4`}
                                    onClick={() => navigate(`/documents/${doc.id}`)}
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        {thumbnailUrl ? (
                                            <img
                                                src={thumbnailUrl}
                                                alt={doc.file_name}
                                                className="w-10 h-10 object-cover rounded flex-shrink-0"
                                            />
                                        ) : (
                                            <FileText
                                                className="w-10 h-10 text-blue-500 flex-shrink-0"
                                                strokeWidth={1.5}
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="text-base font-medium text-gray-900 truncate mb-1">
                                                    {doc.file_name}
                                                </h3>
                                                {RowMenu}
                                            </div>
                                            <div
                                                className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${statusConfig.className}`}
                                            >
                                                <StatusIcon className="w-3 h-3" strokeWidth={2}/>
                                                {statusConfig.label}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1 text-sm text-gray-500">
                                        <div>Uploaded: {formatDate(doc.created_at)}</div>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    key={doc.id}
                                    className={`group bg-white border border-gray-200 ${statusConfig.borderColor} border-l-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer py-3 px-4`}
                                    onClick={() => navigate(`/documents/${doc.id}`)}
                                >
                                    <div className="flex items-center gap-4">
                                        {thumbnailUrl ? (
                                            <img
                                                src={thumbnailUrl}
                                                alt={doc.file_name}
                                                className="w-8 h-8 object-cover rounded flex-shrink-0"
                                            />
                                        ) : (
                                            <FileText
                                                className="w-8 h-8 text-blue-500 flex-shrink-0"
                                                strokeWidth={1.5}
                                            />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-medium text-gray-900 truncate">
                                                {doc.file_name}
                                            </h3>
                                        </div>
                                        <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500">
                                            <span>Uploaded: {formatDate(doc.created_at)}</span>
                                        </div>
                                        <div
                                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${statusConfig.className}`}
                                        >
                                            <StatusIcon className="w-3 h-3" strokeWidth={2}/>
                                            {statusConfig.label}
                                        </div>
                                        {RowMenu}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <DeleteDocumentModal
                open={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setDocToDelete(null);
                }}
                onConfirm={handleDeleteDocumentConfirm}
                documentName={docToDelete?.file_name || ''}
            />
        </div>
    );
};

export default Documents;
