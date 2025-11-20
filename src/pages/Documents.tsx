import React, {useState, useRef, useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {CheckCircle, FileText, Grid3x3, List, Loader, Search, Upload, XCircle, AlertCircle} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';
import {supabase} from '../lib/supabase';
import {uploadDocument, validateFile} from '../lib/storageHelpers';

type ViewMode = 'grid' | 'list';

const Documents: React.FC = () => {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadError, setUploadError] = useState('');
    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [thumbnailUrls, setThumbnailUrls] = useState<Record<string, string>>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();
    const {currentOrg, user} = useAuth();

    // Fetch documents from Supabase with real-time updates
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
                // Fetch signed URLs for thumbnails
                if (data) {
                    const urls: Record<string, string> = {};
                    await Promise.all(
                        data.map(async (doc) => {
                            if (doc.thumbnail_storage_key && doc.thumbnail_bucket) {
                                const {data: signedData} = await supabase.storage
                                    .from(doc.thumbnail_bucket)
                                    .createSignedUrl(doc.thumbnail_storage_key, 3600); // 1 hour expiry
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

        // Subscribe to real-time changes
        const channel = supabase
            .channel('documents-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'documents',
                    filter: `org_id=eq.${currentOrg.org_id}`
                },
                async (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setDocuments(prev => [payload.new as any, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        const newDoc = payload.new as any;
                        setDocuments(prev =>
                            prev.map(doc => doc.id === newDoc.id ? newDoc : doc)
                        );
                        // Update thumbnail URL if thumbnail changed
                        if (newDoc.thumbnail_storage_key && newDoc.thumbnail_bucket) {
                            const {data: signedData} = await supabase.storage
                                .from(newDoc.thumbnail_bucket)
                                .createSignedUrl(newDoc.thumbnail_storage_key, 3600);
                            if (signedData?.signedUrl) {
                                setThumbnailUrls(prev => ({...prev, [newDoc.id]: signedData.signedUrl}));
                            }
                        }
                    } else if (payload.eventType === 'DELETE') {
                        setDocuments(prev => prev.filter(doc => doc.id !== payload.old.id));
                        setThumbnailUrls(prev => {
                            const newUrls = {...prev};
                            delete newUrls[payload.old.id];
                            return newUrls;
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
                    borderColor: 'border-l-gray-400'
                };
            case 'processing':
                return {
                    label: 'Processing',
                    icon: Loader,
                    className: 'bg-blue-50 text-blue-700 border-blue-200',
                    borderColor: 'border-l-blue-500'
                };
            case 'success':
                return {
                    label: 'Completed',
                    icon: CheckCircle,
                    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    borderColor: 'border-l-emerald-500'
                };
            case 'failed':
                return {
                    label: 'Failed',
                    icon: XCircle,
                    className: 'bg-rose-50 text-rose-700 border-rose-200',
                    borderColor: 'border-l-rose-500'
                };
            default:
                return {
                    label: 'Unknown',
                    icon: AlertCircle,
                    className: 'bg-gray-50 text-gray-700 border-gray-200',
                    borderColor: 'border-l-gray-400'
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

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !currentOrg || !user) return;

        // Reset states
        setUploadError('');
        setUploadProgress(0);

        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
            setUploadError(validationError.message);
            return;
        }

        setUploading(true);

        try {
            // Check if document with same file_name already exists
            const {data: existingDoc} = await supabase
                .from('documents')
                .select('id')
                .eq('org_id', currentOrg.org_id)
                .eq('file_name', file.name)
                .maybeSingle();

            setUploadProgress(10);

            const documentId = existingDoc?.id || crypto.randomUUID();

            // Upload file to storage
            const {key, error: uploadError} = await uploadDocument(
                file,
                currentOrg.org_id,
                documentId
            );

            if (uploadError || !key) {
                throw uploadError || new Error('Upload failed');
            }

            setUploadProgress(60);

            if (existingDoc) {
                // Update existing document
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
                    throw new Error(updateError.message);
                }
            } else {
                // Create new document
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
                    throw new Error(insertError.message);
                }
            }

            setUploadProgress(100);

            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }

            // Real-time subscription will update the list automatically
            setTimeout(() => {
                setUploading(false);
                setUploadProgress(0);
            }, 500);

        } catch (err) {
            setUploadError(err instanceof Error ? err.message : 'Upload failed');
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } finally {
            // Don't reset uploading here - we do it in the success timeout
        }
    };


    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-semibold text-gray-900">Documents</h1>
                <button
                    onClick={handleUploadClick}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg shadow-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed">
                    <Upload className="w-4 h-4" strokeWidth={1.5}/>
                    <span className="text-sm font-medium">
                        {uploading ? 'Uploading...' : 'Upload Document'}
                    </span>
                </button>
            </div>

            {/* Hidden File Input */}
            <input
                ref={fileInputRef}
                type="file"
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
                        <span className="text-sm font-medium text-blue-900">Uploading document...</span>
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
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                            strokeWidth={1.5}/>
                    <input
                        type="text"
                        placeholder="Search documents..."
                        className="w-full h-[38px] pl-10 pr-4 bg-white border border-gray-200 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-sm"
                    />
                </div>
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
                    <p className="text-sm text-gray-500 mb-6">Upload your first document to get started</p>
                    <button
                        onClick={handleUploadClick}
                        disabled={uploading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg shadow-sm transition-all disabled:cursor-not-allowed">
                        <Upload className="w-4 h-4" strokeWidth={1.5}/>
                        <span className="text-sm font-medium">
                            {uploading ? 'Uploading...' : 'Upload Document'}
                        </span>
                    </button>
                </div>
            ) : (
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
                    {displayDocuments.map(doc => {
                    const statusConfig = getStatusConfig(doc.last_status);
                    const StatusIcon = statusConfig.icon;

                    const thumbnailUrl = thumbnailUrls[doc.id];

                    return viewMode === 'grid' ? (
                        // Grid View
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
                                    <FileText className="w-10 h-10 text-blue-500 flex-shrink-0" strokeWidth={1.5}/>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-medium text-gray-900 truncate mb-1">{doc.file_name}</h3>
                                    <div
                                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${statusConfig.className}`}>
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
                        // List View
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
                                    <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" strokeWidth={1.5}/>
                                )}
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base font-medium text-gray-900 truncate">{doc.file_name}</h3>
                                </div>
                                <div className="hidden sm:flex items-center gap-4 text-sm text-gray-500">
                                    <span>Uploaded: {formatDate(doc.created_at)}</span>
                                </div>
                                <div
                                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium ${statusConfig.className}`}>
                                    <StatusIcon className="w-3 h-3" strokeWidth={2}/>
                                    {statusConfig.label}
                                </div>
                            </div>
                        </div>
                    );
                })}
                </div>
            )}
        </div>
    );
};

export default Documents;
