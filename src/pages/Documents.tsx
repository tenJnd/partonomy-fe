import React, {useMemo, useRef, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {AlertCircle, Upload} from 'lucide-react';
import {useAuth} from '../contexts/AuthContext';
import {supabase} from '../lib/supabase';
import DeleteDocumentModal from '../components/DeleteDocumentModal';
import {useParts} from '../hooks/useParts';
import {useDocumentUpload} from '../hooks/useDocumentUpload';
import type {SortField} from '../components/documents/DocumentsTable';
import DocumentsTable from '../components/documents/DocumentsTable';
import {useOrgBilling} from "../hooks/useOrgBilling";
import {useOrgUsage} from "../hooks/useOrgUsage";
import {getUsageLimitInfo, isInactiveStatus} from "../utils/billing";
import {formatTierLabel} from "../utils/tiers.ts";
import type { PartWithDocument } from "../hooks/useParts";
import { useProjects } from "../hooks/useProjects";

type StatusFilter = 'all' | 'processed' | 'processing' | 'error';
type TimeFilter = 'all' | '7d' | '30d' | '90d';
type ComplexityFilter = 'all' | 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
type FitFilter = 'all' | 'GOOD' | 'PARTIAL' | 'COOPERATION' | 'LOW' | 'UNKNOWN';

const Documents: React.FC = () => {
    const {currentOrg, user} = useAuth();
    const navigate = useNavigate();

    const {
        parts,
        loading,
        loadingMore,
        hasMore,
        loadMore,
        setParts,
    } = useParts(currentOrg, 50);

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

    const [sortField, setSortField] = useState<SortField>('last_updated');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const fileInputRef = useRef<HTMLInputElement>(null);

    const {billing} = useOrgBilling();
    const {usage} = useOrgUsage(currentOrg?.org_id);

    const canUseProjects = !!billing?.tier?.can_use_projects;  // 👈 feature flag
    const { projects } = useProjects();                            // 👈 načtení projektů orgu

    // state pro "Add to project"
    const [addToProjectOpen, setAddToProjectOpen] = useState(false);
    const [partToAdd, setPartToAdd] = useState<PartWithDocument | null>(null);
    const [selectedProjectId, setSelectedProjectId] = useState<string>("");
    const [addToProjectError, setAddToProjectError] = useState<string | null>(null);
    const [addToProjectLoading, setAddToProjectLoading] = useState(false);

    // usage + limit info
    const {jobsUsed, maxJobs, isOverLimit} = getUsageLimitInfo(
        billing ?? null,
        usage ?? null
    );

    // kdy blokujeme upload globálně
    const uploadsBlocked =
        !currentOrg ||
        isInactiveStatus(billing?.status) ||
        isOverLimit;

    const handleUploadClick = () => {
        if (uploadsBlocked) {
            setUploadError(
                maxJobs
                    ? `You have reached the limit of your plan (${jobsUsed}/${maxJobs} jobs). Upgrade your plan to upload more documents.`
                    : "Uploads are currently disabled for this organization."
            );
            return;
        }

        fileInputRef.current?.click();
    };


    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;

        if (uploadsBlocked) {
            setUploadError(
                maxJobs
                    ? `You have reached the limit of your plan (${jobsUsed}/${maxJobs} jobs). Upgrade your plan to upload more documents.`
                    : "Uploads are currently disabled for this organization."
            );
            // reset input, jinak by tam soubory zůstaly
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        await uploadFiles(Array.from(files));

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };


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

        if (uploadsBlocked) {
            setUploadError(
                maxJobs
                    ? `You have reached the limit of your plan (${jobsUsed}/${maxJobs} jobs). Upgrade your plan to upload more documents.`
                    : "Uploads are currently disabled for this organization."
            );
            return;
        }

        await uploadFiles(Array.from(files));
    };


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

    const openDeleteModal = (part: PartWithDocument) => {
        setDocToDelete(part.document);
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

            setParts((prev) => prev.filter((p) => p.document?.id !== docToDelete.id));
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

    const handleOpenAddToProject = (part: PartWithDocument) => {
        if (!canUseProjects) {
            return;
        }
        setPartToAdd(part);
        setSelectedProjectId("");
        setAddToProjectError(null);
        setAddToProjectOpen(true);
    };

    const handleConfirmAddToProject = async () => {
        if (!currentOrg || !user || !partToAdd) {
            setAddToProjectError("Missing context to add part to project.");
            return;
        }

        if (!selectedProjectId) {
            setAddToProjectError("Please select a project.");
            return;
        }

        try {
            setAddToProjectLoading(true);
            setAddToProjectError(null);

            const { error } = await supabase
                .from("project_parts")
                .insert({
                    org_id: currentOrg.org_id,
                    project_id: selectedProjectId,
                    part_id: partToAdd.id,
                    added_by_user_id: user.id,
                });

            if (error) {
                // pokud máš unique constraint, může přijít 23505 – klidně ji ber jako "ok"
                // @ts-ignore
                if (error.code === "23505") {
                    // part už v projektu je – nebudeme to brát jako fail
                } else {
                    console.error("[Documents] addToProject error:", error);
                    setAddToProjectError(error.message || "Failed to add part to project.");
                    return;
                }
            }

            // success
            setAddToProjectOpen(false);
            setPartToAdd(null);
            setSelectedProjectId("");
        } catch (err: any) {
            console.error("[Documents] unexpected addToProject error:", err);
            setAddToProjectError(err.message || "Failed to add part to project.");
        } finally {
            setAddToProjectLoading(false);
        }
    };

    // Distinct values for company and class filters
    const {uniqueCompanies, uniqueClasses} = useMemo(() => {
        const companySet = new Set<string>();
        const classSet = new Set<string>();

        for (const part of parts) {
            if (part.company_name) {
                companySet.add(part.company_name);
            }
            if (part.primary_class) {
                classSet.add(part.primary_class);
            }
        }

        const companies = Array.from(companySet).sort((a, b) =>
            a.localeCompare(b, undefined, {sensitivity: 'base'}),
        );
        const classes = Array.from(classSet).sort((a, b) =>
            a.localeCompare(b, undefined, {sensitivity: 'base'}),
        );

        return {uniqueCompanies: companies, uniqueClasses: classes};
    }, [parts]);

    // FILTERING + SORTING
    const filteredSortedParts = useMemo(() => {
        let result = [...parts];

        // Status filter
        if (statusFilter !== 'all') {
            result = result.filter((part) => {
                const s = part.document?.last_status;
                if (!s) return false;

                if (statusFilter === 'processed') {
                    return s === 'success';
                }
                if (statusFilter === 'processing') {
                    return s === 'processing' || s === 'queued';
                }
                if (statusFilter === 'error') {
                    return s === 'failed';
                }
                return true;
            });
        }

        // Time filter (based on last_updated)
        if (timeFilter !== 'all') {
            const now = new Date();
            const days =
                timeFilter === '7d' ? 7 : timeFilter === '30d' ? 30 : timeFilter === '90d' ? 90 : 0;

            if (days > 0) {
                const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
                result = result.filter((part) => {
                    const updated = part.last_updated ? new Date(part.last_updated) : null;
                    return updated ? updated >= cutoff : false;
                });
            }
        }

        // Complexity filter
        if (complexityFilter !== 'all') {
            result = result.filter(
                (part) => part.overall_complexity?.toUpperCase() === complexityFilter,
            );
        }

        // Fit filter
        if (fitFilter !== 'all') {
            result = result.filter(
                (part) => part.fit_level?.toUpperCase() === fitFilter,
            );
        }

        // Company filter
        if (companyFilter !== 'all') {
            result = result.filter((part) => part.company_name === companyFilter);
        }

        // Class filter
        if (classFilter !== 'all') {
            result = result.filter((part) => part.primary_class === classFilter);
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
                case 'last_updated':
                    aVal = a.last_updated ? new Date(a.last_updated).getTime() : 0;
                    bVal = b.last_updated ? new Date(b.last_updated).getTime() : 0;
                    break;
                case 'last_status':
                    aVal = statusOrder(a.document?.last_status);
                    bVal = statusOrder(b.document?.last_status);
                    break;
                case 'file_name':
                    aVal = (a.document?.file_name || '').toString().toLowerCase();
                    bVal = (b.document?.file_name || '').toString().toLowerCase();
                    break;
                case 'company_name':
                    aVal = (a.company_name || '').toString().toLowerCase();
                    bVal = (b.company_name || '').toString().toLowerCase();
                    break;
                case 'primary_class':
                    aVal = (a.primary_class || '').toString().toLowerCase();
                    bVal = (b.primary_class || '').toString().toLowerCase();
                    break;
                case 'overall_complexity':
                    aVal = (a.overall_complexity || '').toString().toLowerCase();
                    bVal = (b.overall_complexity || '').toString().toLowerCase();
                    break;
                case 'fit_level':
                    aVal = (a.fit_level || '').toString().toLowerCase();
                    bVal = (b.fit_level || '').toString().toLowerCase();
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
        parts,
        statusFilter,
        timeFilter,
        complexityFilter,
        fitFilter,
        companyFilter,
        classFilter,
        sortField,
        sortDirection,
    ]);

    const handleRowClick = (documentId: string, partId: string) => {
        navigate(`/documents/${documentId}?partId=${partId}`);
    };

    return (
        <div
            className="min-h-screen relative bg-gradient-to-br from-slate-50 via-white to-slate-50"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {isDragging && (
                <div
                    className="pointer-events-none fixed inset-0 flex items-center justify-center z-50 bg-blue-600/5 backdrop-blur-sm">
                    <div
                        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl shadow-xl text-base font-semibold flex items-center gap-3">
                        <Upload className="w-5 h-5" strokeWidth={2}/>
                        Drop files to upload
                    </div>
                </div>
            )}

            <div className="p-6 mx-auto" style={{maxWidth: '1800px'}}>
                <div className="flex items-center justify-between mb-6">
                    {/*<h1 className="text-2xl font-semibold text-gray-900">Documents</h1>*/}
                    <button
                        onClick={handleUploadClick}
                        disabled={uploading || uploadsBlocked}
                        className={`ml-auto flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-all active:scale-[0.98] disabled:cursor-not-allowed ${
                            uploadsBlocked
                                ? "bg-gray-300 text-gray-600"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                        }`}
                    >
                        <Upload className="w-4 h-4" strokeWidth={1.5}/>
                        <span className="text-sm font-medium">
                        {uploading ? "Uploading..." : "Upload Documents"}
                      </span>
                    </button>
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".pdf,.dwg,.dxf"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {uploadError && (
                    <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" strokeWidth={1.5}/>
                        <p className="text-sm text-rose-700">{uploadError}</p>
                    </div>
                )}

                {uploading && filteredSortedParts.length > 0 && (
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

                {(isOverLimit && maxJobs != null) && (
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" strokeWidth={1.5}/>
                        <div>
                            <p className="text-sm font-semibold text-amber-800">
                                You’ve reached the limit of
                                your {billing?.tier ? formatTierLabel(billing.tier.code) : "current"} plan.
                            </p>
                            <p className="text-xs text-amber-700 mt-1">
                                Processed {jobsUsed} / {maxJobs} jobs in this billing period.
                                To upload more documents, upgrade your plan in Billing.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-3 mb-6 flex-wrap">
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

                    <select
                        value={complexityFilter}
                        onChange={(e) => setComplexityFilter(e.target.value as ComplexityFilter)}
                        className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-xs"
                    >
                        <option value="all">All Complexity</option>
                        <option value="LOW">Low</option>
                        <option value="MEDIUM">Medium</option>
                        <option value="HIGH">High</option>
                        <option value="EXTREME">Extreme</option>
                    </select>

                    <select
                        value={fitFilter}
                        onChange={(e) => setFitFilter(e.target.value as FitFilter)}
                        className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-xs"
                    >
                        <option value="all">All Fit</option>
                        <option value="GOOD">Good</option>
                        <option value="PARTIAL">Partial</option>
                        <option value="COOPERATION">Cooperation</option>
                        <option value="LOW">Low</option>
                        <option value="UNKNOWN">Unknown</option>
                    </select>

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

                <DocumentsTable
                    parts={filteredSortedParts}
                    loading={loading && parts.length === 0}
                    uploading={uploading}
                    uploadProgress={uploadProgress}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSortChange={handleSortChange}
                    onUploadClick={handleUploadClick}
                    onRerun={handleRerunDocument}
                    onDownload={handleDownloadDocument}
                    onDelete={openDeleteModal}
                    onRowClick={handleRowClick}
                    canUseProjects={canUseProjects}
                    onAddToProject={handleOpenAddToProject}
                />

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

            {/* Add to project modal */}
        {addToProjectOpen && partToAdd && (
            <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">
                        Add part to project
                    </h2>

                    <div className="mb-4 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                        <div className="font-medium text-gray-800">
                            {partToAdd.drawing_title ||
                                partToAdd.document?.file_name ||
                                "Part"}
                        </div>
                        <div className="text-[11px] text-gray-500">
                            {partToAdd.company_name && (
                                <>
                                    {partToAdd.company_name}
                                    {" • "}
                                </>
                            )}
                            {partToAdd.document?.file_name}
                            {partToAdd.page != null && ` (page ${partToAdd.page})`}
                        </div>
                    </div>

                    {addToProjectError && (
                        <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-rose-600 mt-0.5" strokeWidth={1.5} />
                            <p className="text-xs text-rose-700">{addToProjectError}</p>
                        </div>
                    )}

                    {projects.length === 0 ? (
                        <div className="text-sm text-gray-700">
                            You don&apos;t have any projects yet.{" "}
                            <button
                                type="button"
                                onClick={() => {
                                    setAddToProjectOpen(false);
                                    setPartToAdd(null);
                                    navigate("/projects");
                                }}
                                className="text-blue-600 hover:underline font-medium"
                            >
                                Go to Projects
                            </button>{" "}
                            to create your first project.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">
                                    Project
                                </label>
                                <select
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                                >
                                    <option value="">Select project...</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id as string}>
                                            {p.name}
                                            {p.customer_name ? ` – ${p.customer_name}` : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            onClick={() => {
                                setAddToProjectOpen(false);
                                setPartToAdd(null);
                                setSelectedProjectId("");
                                setAddToProjectError(null);
                            }}
                            className="px-4 py-2 text-xs rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                            disabled={addToProjectLoading}
                        >
                            Cancel
                        </button>
                        {projects.length > 0 && (
                            <button
                                type="button"
                                onClick={handleConfirmAddToProject}
                                disabled={addToProjectLoading}
                                className="px-4 py-2 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-60"
                            >
                                {addToProjectLoading ? "Adding..." : "Add to project"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )}

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