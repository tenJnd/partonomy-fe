import React, {useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {AlertCircle, Upload} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';
import {supabase} from '../lib/supabase';
import DeleteDocumentModal from '../components/DeleteDocumentModal';
import {useDocuments} from '../hooks/useDocuments';
import {useDocumentUpload} from '../hooks/useDocumentUpload';
import DocumentsTable from '../components/documents/DocumentsTable';

type StatusFilter = 'all' | 'processed' | 'processing' | 'error';
type TimeFilter = 'all' | '7d' | '30d' | '90d';

export type SortField =
    | 'file_name'
    | 'company_name'
    | 'part_class'
    | 'part_complexity'
    | 'part_fit_level'
    | 'created_at'
    | 'last_status';

type SortDirection = 'asc' | 'desc';

type ComplexityFilter = 'all' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
type FitFilter = 'all' | 'GOOD' | 'PARTIAL' | 'COOPERATION' | 'LOW' | 'UNKNOWN';

const Documents: React.FC = () => {
    const {currentOrg, user} = useAuth();
    const navigate = useNavigate();

    const {
        documents,
        thumbnailUrls,
        loading,
        loadingMore,
        hasMore,
        loadMore,
        setDocuments,
        setThumbnailUrls,
    } = useDocuments(currentOrg, 50); // 50 záznamů na stránku

    const {
        uploading,
        uploadProgress,
        uploadError,
        setUploadError,
        uploadFiles,
    } = useDocumentUpload(currentOrg, user);

    const [isDragging, setIsDragging] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [docToDelete, setDocToDelete] = useState<any | null>(null);

    const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
    const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
    const [complexityFilter, setComplexityFilter] = useState<ComplexityFilter>('all');
    const [fitFilter, setFitFilter] = useState<FitFilter>('all');
    const [companyFilter, setCompanyFilter] = useState<string>('all');
    const [classFilter, setClassFilter] = useState<string>('all');

    const [sortField, setSortField] = useState<SortField>('created_at');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

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

    // ACTION HANDLERS (menu)

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
        }
    };

    const openDeleteModal = (doc: any) => {
        setDocToDelete(doc);
        setDeleteModalOpen(true);
    };

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
                return;
            }

            // Lokálně smažeme dokument i thumbnail
            setDocuments((prev) => prev.filter((d) => d.id !== docToDelete.id));
            setThumbnailUrls((prev) => {
                const next = {...prev};
                delete next[docToDelete.id];
                return next;
            });
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
        }
    };

    // ŘAZENÍ – změna sortField / sortDirection
    const handleSortChange = (field: SortField) => {
        setSortDirection((prevDir) =>
            field === sortField ? (prevDir === 'asc' ? 'desc' : 'asc') : 'asc',
        );
        setSortField(field);
    };

    const resetFilters = () => {
        setStatusFilter('all');
        setTimeFilter('all');
        setComplexityFilter('all');
        setFitFilter('all');
        setCompanyFilter('all');
        setClassFilter('all');
    };

    // Distinct values pro company a class
    const {uniqueCompanies, uniqueClasses} = useMemo(() => {
        const companySet = new Set<string>();
        const classSet = new Set<string>();

        for (const doc of documents) {
            if (doc.company_name) {
                companySet.add(doc.company_name as string);
            }
            if (doc.part_class) {
                classSet.add(doc.part_class as string);
            }
        }

        const companies = Array.from(companySet).sort((a, b) =>
            a.localeCompare(b, undefined, {sensitivity: 'base'}),
        );
        const classes = Array.from(classSet).sort((a, b) =>
            a.localeCompare(b, undefined, {sensitivity: 'base'}),
        );

        return {uniqueCompanies: companies, uniqueClasses: classes};
    }, [documents]);

    // Derivované: filtrování + řazení
    const filteredSortedDocuments = useMemo(() => {
        let result = [...documents];

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter((doc) => {
                const s = doc.last_status as string | null;
                if (!s) return false;

                if (statusFilter === 'processed') {
                    return s === 'success';
                }
                if (statusFilter === 'processing') {
                    // processing + queued bereme jako "in progress"
                    return s === 'processing' || s === 'queued';
                }
                if (statusFilter === 'error') {
                    return s === 'failed';
                }
                return true;
            });
        }

        // Time filter
        if (timeFilter !== 'all') {
            const now = new Date();
            const days =
                timeFilter === '7d' ? 7 : timeFilter === '30d' ? 30 : timeFilter === '90d' ? 90 : 0;

            if (days > 0) {
                const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
                result = result.filter((doc) => {
                    const created = doc.created_at ? new Date(doc.created_at) : null;
                    return created ? created >= cutoff : false;
                });
            }
        }

        // Complexity filter
        if (complexityFilter !== 'all') {
            result = result.filter(
                (doc) => (doc.part_complexity as string | null) === complexityFilter,
            );
        }

        // Fit filter
        if (fitFilter !== 'all') {
            result = result.filter(
                (doc) => (doc.part_fit_level as string | null) === fitFilter,
            );
        }

        // Company filter (dynamický)
        if (companyFilter !== 'all') {
            result = result.filter(
                (doc) => (doc.company_name as string | null) === companyFilter,
            );
        }

        // Class filter (dynamický)
        if (classFilter !== 'all') {
            result = result.filter(
                (doc) => (doc.part_class as string | null) === classFilter,
            );
        }

        // Sorting
        const direction = sortDirection === 'asc' ? 1 : -1;

        const statusOrder = (status: string | null | undefined) => {
            switch (status) {
                case 'success':
                    return 1;
                case 'processing':
                    return 2;
                case 'queued':
                    return 3;
                case 'failed':
                    return 4;
                default:
                    return 5;
            }
        };

        result.sort((a, b) => {
            let aVal: any;
            let bVal: any;

            switch (sortField) {
                case 'created_at':
                    aVal = a.created_at ? new Date(a.created_at).getTime() : 0;
                    bVal = b.created_at ? new Date(b.created_at).getTime() : 0;
                    break;
                case 'last_status':
                    aVal = statusOrder(a.last_status);
                    bVal = statusOrder(b.last_status);
                    break;
                case 'file_name':
                case 'company_name':
                case 'part_class':
                case 'part_complexity':
                case 'part_fit_level':
                    aVal = (a[sortField] || '').toString().toLowerCase();
                    bVal = (b[sortField] || '').toString().toLowerCase();
                    break;
                default:
                    aVal = 0;
                    bVal = 0;
            }

            if (aVal < bVal) return -1 * direction;
            if (aVal > bVal) return 1 * direction;
            return 0;
        });


        return result;
    }, [
        documents,
        statusFilter,
        timeFilter,
        complexityFilter,
        fitFilter,
        companyFilter,
        classFilter,
        sortField,
        sortDirection,
    ]);

    return (
        <div
      className="min-h-screen relative bg-gradient-to-br from-slate-50 via-white to-slate-50"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="pointer-events-none fixed inset-0 flex items-center justify-center z-50 bg-blue-600/5 backdrop-blur-sm">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl shadow-xl text-base font-semibold flex items-center gap-3">
            <Upload className="w-5 h-5" strokeWidth={2}/>
            Drop files to upload
          </div>
        </div>
      )}

      <div className="p-6 mx-auto" style={{ maxWidth: '1800px' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
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

                {/* Upload Progress Display (globální) */}
                {uploading && filteredSortedDocuments.length > 0 && (
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
                    {/* Status filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                        className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-xs"
                    >
                        <option value="all">All Status</option>
                        <option value="processed">Processed</option>
                        <option value="processing">Processing</option>
                        <option value="error">Error</option>
                    </select>

                    {/* Time filter */}
                    <select
                        value={timeFilter}
                        onChange={(e) => setTimeFilter(e.target.value as TimeFilter)}
                        className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-xs"
                    >
                        <option value="all">All Time</option>
                        <option value="7d">Last 7 days</option>
                        <option value="30d">Last 30 days</option>
                        <option value="90d">Last 90 days</option>
                    </select>

                    {/* Complexity filter */}
                    <select
                        value={complexityFilter}
                        onChange={(e) => setComplexityFilter(e.target.value as ComplexityFilter)}
                        className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-xs"
                    >
                        <option value="all">All Complexity</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="extreme">Extreme</option>
                    </select>

                    {/* Fit filter */}
                    <select
                        value={fitFilter}
                        onChange={(e) => setFitFilter(e.target.value as FitFilter)}
                        className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-xs"
                    >
                        <option value="all">All Fit</option>
                        <option value="good">Good</option>
                        <option value="partial">Partial</option>
                        <option value="cooperation">Cooperation</option>
                        <option value="low">Low</option>
                        <option value="unknown">Unknown</option>
                    </select>

                    {/* Company filter – dynamické hodnoty */}
                    <select
                        value={companyFilter}
                        onChange={(e) => setCompanyFilter(e.target.value)}
                        className="h-[38px] w-[130px] px-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-xs"
                    >
                        <option value="all">All Companies</option>
                        {uniqueCompanies.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>

                    {/* Class filter – dynamické hodnoty */}
                    <select
                        value={classFilter}
                        onChange={(e) => setClassFilter(e.target.value)}
                        className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-xs"
                    >
                        <option value="all">All Classes</option>
                        {uniqueClasses.map((c) => (
                            <option key={c} value={c}>
                                {c}
                            </option>
                        ))}
                    </select>


                    <button
                        onClick={resetFilters}
                        className="h-[38px] px-3 bg-gray-100 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-200 text-sm text-gray-700 text-xs"
                    >
                        Reset filters
                    </button>

                </div>

                {/* Documents Table */}
                <DocumentsTable
                    documents={filteredSortedDocuments}
                    thumbnailUrls={thumbnailUrls}
                    loading={loading && documents.length === 0}
                    uploading={uploading}
                    uploadProgress={uploadProgress}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSortChange={handleSortChange}
                    onUploadClick={handleUploadClick}
                    onRerun={handleRerunDocument}
                    onDownload={handleDownloadDocument}
                    onDelete={openDeleteModal}
                    onRowClick={(id) => navigate(`/documents/${id}`)}
                />

                {/* Load more button */}
                {hasMore && !loading && (
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            {loadingMore ? 'Loading...' : 'Load more'}
                        </button>
                    </div>
                )}
            </div>

            {/* Delete modal */}
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
