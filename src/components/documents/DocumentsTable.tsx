import React from 'react';
import {
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Download,
    FileText,
    Loader2,
    MoreVertical,
    RefreshCw,
    Trash2
} from 'lucide-react';
import type {SortField} from '../../pages/Documents';

interface DocumentsTableProps {
    documents: any[];
    thumbnailUrls: Record<string, string>;
    loading: boolean;
    uploading: boolean;
    uploadProgress: number;
    sortField: SortField;
    sortDirection: 'asc' | 'desc';
    onSortChange: (field: SortField) => void;
    onUploadClick: () => void;
    onRerun: (docId: string) => void;
    onDownload: (doc: any) => void;
    onDelete: (doc: any) => void;
    onRowClick: (id: string) => void;
}

const DocumentsTable: React.FC<DocumentsTableProps> = ({
                                                           documents,
                                                           thumbnailUrls,
                                                           loading,
                                                           uploading,
                                                           // uploadProgress,
                                                           sortField,
                                                           sortDirection,
                                                           onSortChange,
                                                           onUploadClick,
                                                           onRerun,
                                                           onDownload,
                                                           onDelete,
                                                           onRowClick,
                                                       }) => {
    const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

    // Helper for sortable column headers
    const SortableHeader: React.FC<{
        field: SortField;
        children: React.ReactNode;
        className?: string;
    }> = ({field, children, className = ''}) => {
        const isActive = sortField === field;
        return (
            <th
                onClick={() => onSortChange(field)}
                className={`px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-slate-50 transition-colors select-none ${className}`}
            >
                <div className="flex items-center gap-1.5">
                    {children}
                    {isActive ? (
                        sortDirection === 'asc' ? (
                            <ChevronUp className="w-4 h-4 text-blue-600" strokeWidth={2}/>
                        ) : (
                            <ChevronDown className="w-4 h-4 text-blue-600" strokeWidth={2}/>
                        )
                    ) : (
                        <div className="w-4 h-4 opacity-0 group-hover:opacity-30">
                            <ChevronDown className="w-4 h-4" strokeWidth={2}/>
                        </div>
                    )}
                </div>
            </th>
        );
    };

    // Status badge configuration
    const getStatusConfig = (status: string | null) => {
        switch (status) {
            case 'success':
                return {
                    icon: CheckCircle2,
                    label: 'Processed',
                    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    iconColor: 'text-emerald-600',
                };
            case 'processing':
            case 'queued':
                return {
                    icon: Loader2,
                    label: 'Processing',
                    className: 'bg-blue-50 text-blue-700 border-blue-200',
                    iconColor: 'text-blue-600',
                    animate: true,
                };
            case 'failed':
                return {
                    icon: AlertCircle,
                    label: 'Error',
                    className: 'bg-rose-50 text-rose-700 border-rose-200',
                    iconColor: 'text-rose-600',
                };
            default:
                return {
                    icon: FileText,
                    label: 'Unknown',
                    className: 'bg-gray-50 text-gray-600 border-gray-200',
                    iconColor: 'text-gray-500',
                };
        }
    };

    // Complexity badge configuration
    const getComplexityConfig = (complexity: string | null) => {
        const val = complexity?.toUpperCase();
        switch (val) {
            case 'HIGH':
            case 'EXTREME':
                return {
                    label: val,
                    className: 'bg-rose-50 text-rose-800 border-rose-300 font-semibold',
                };
            case 'MEDIUM':
                return {
                    label: 'MEDIUM',
                    className: 'bg-amber-50 text-amber-800 border-amber-300 font-medium',
                };
            case 'LOW':
                return {
                    label: 'LOW',
                    className: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-medium',
                };
            default:
                return null;
        }
    };

    // Fit level badge configuration
    const getFitConfig = (fit: string | null) => {
        const val = fit?.toUpperCase();
        switch (val) {
            case 'GOOD':
                return {
                    label: 'GOOD',
                    className: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-medium',
                };
            case 'PARTIAL':
                return {
                    label: 'PARTIAL',
                    className: 'bg-blue-50 text-blue-800 border-blue-300 font-medium',
                };
            case 'COOPERATION':
                return {
                    label: 'COOP',
                    className: 'bg-purple-50 text-purple-800 border-purple-300 font-medium',
                };
            case 'LOW':
                return {
                    label: 'LOW',
                    className: 'bg-amber-50 text-amber-800 border-amber-300 font-medium',
                };
            case 'UNKNOWN':
                return {
                    label: 'UNKNOWN',
                    className: 'bg-gray-50 text-gray-600 border-gray-300',
                };
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div
                    className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-medium text-slate-600">Loading documents...</p>
            </div>
        );
    }

    if (documents.length === 0 && !uploading) {
        return (
            <div
                className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <FileText className="w-16 h-16 text-gray-300 mb-4" strokeWidth={1.5}/>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
                <p className="text-sm text-gray-600 mb-6">
                    Upload your first technical drawing to start analyzing
                </p>
                <button
                    onClick={onUploadClick}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all"
                >
                    <FileText className="w-4 h-4" strokeWidth={2}/>
                    Upload Documents
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                    <colgroup>
                        <col style={{width: '64px'}}/>
                        {/* Thumbnail */}
                        <col style={{width: '20%'}}/>
                        {/* File Name */}
                        <col style={{width: '15%'}}/>
                        {/* Company */}
                        <col style={{width: '10%'}}/>
                        {/* Class */}
                        <col style={{width: '10%'}}/>
                        {/* Envelope */}
                        <col style={{width: '10%'}}/>
                        {/* Complexity */}
                        <col style={{width: '10%'}}/>
                        {/* Fit */}
                        <col style={{width: '64px'}}/>
                        {/* Status */}
                        <col style={{width: '100px'}}/>
                        {/* Date */}
                        <col style={{width: '48px'}}/>
                        {/* Actions */}
                    </colgroup>
                    <thead className="bg-slate-50 border-b border-gray-200">
                    <tr>
                        <th className="px-3 py-3"></th>
                        <SortableHeader field="file_name">File Name</SortableHeader>
                        <SortableHeader field="company_name">Company</SortableHeader>
                        <SortableHeader field="part_class">Class</SortableHeader>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Envelope
                        </th>
                        <SortableHeader field="part_complexity">Complexity</SortableHeader>
                        <SortableHeader field="part_fit_level">Fit</SortableHeader>
                        <SortableHeader field="last_status" className="text-center">Status</SortableHeader>
                        <SortableHeader field="created_at">Date</SortableHeader>
                        <th className="px-3 py-3"></th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {documents.map((doc) => {
                        const statusConfig = getStatusConfig(doc.last_status);
                        const complexityConfig = getComplexityConfig(doc.part_complexity);
                        const fitConfig = getFitConfig(doc.part_fit_level);
                        const StatusIcon = statusConfig.icon;
                        const thumbnailUrl = thumbnailUrls[doc.id];

                        return (
                            <tr
                                key={doc.id}
                                onClick={() => onRowClick(doc.id)}
                                className="hover:bg-blue-50/30 cursor-pointer transition-colors group"
                            >
                                {/* Thumbnail */}
                                <td className="px-3 py-3">
                                    <div
                                        className="w-12 h-12 rounded-md overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                                        {thumbnailUrl ? (
                                            <img
                                                src={thumbnailUrl}
                                                alt={doc.file_name || 'Document'}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center">
                                                <FileText className="w-5 h-5 text-slate-400" strokeWidth={1.5}/>
                                            </div>
                                        )}
                                    </div>
                                </td>

                                {/* File Name */}
                                <td className="px-3 py-3">
                                    <div
                                        className="font-medium text-xs text-gray-900 truncate group-hover:text-blue-700 transition-colors"
                                        title={doc.file_name || 'Unnamed'}>
                                        {doc.file_name || 'Unnamed'}
                                    </div>
                                </td>

                                {/* Company */}
                                <td className="px-3 py-3">
                                    <div className="text-xs text-gray-700 truncate" title={doc.company_name || ''}>
                                        {doc.company_name || '—'}
                                    </div>
                                </td>


                                {/* Class */}
                                <td className="px-3 py-3">
                                    {doc.part_class ? (
                                        <span
                                            className="inline-flex px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-md text-xs font-medium whitespace-nowrap"
                                            title={doc.part_class}>
                        <span className="truncate max-w-[80px]">{doc.part_class}</span>
                      </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">—</span>
                                    )}
                                </td>

                                {/* Envelope */}
                                <td className="px-3 py-3">
                                    <div className="text-xs text-gray-600 font-mono truncate"
                                         title={doc.part_envelope_text || ''}>
                                        {doc.part_envelope_text || '—'}
                                    </div>
                                </td>

                                {/* Complexity */}
                                <td className="px-3 py-3">
                                    {complexityConfig ? (
                                        <span
                                            className={`inline-flex px-2 py-0.5 rounded-md border text-xs whitespace-nowrap ${complexityConfig.className}`}>
                        {complexityConfig.label}
                      </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">—</span>
                                    )}
                                </td>

                                {/* Fit */}
                                <td className="px-3 py-3">
                                    {fitConfig ? (
                                        <span
                                            className={`inline-flex px-2 py-0.5 rounded-md border text-xs whitespace-nowrap ${fitConfig.className}`}>
                        {fitConfig.label}
                      </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">—</span>
                                    )}
                                </td>

                                {/* Status - ONLY ICON without background */}
                                <td className="px-3 py-3">
                                    <div className="flex justify-center">
                                        <StatusIcon
                                            className={`w-5 h-5 ${statusConfig.iconColor} ${statusConfig.animate ? 'animate-spin' : ''}`}
                                            strokeWidth={2}
                                            // title={statusConfig.label}
                                        />
                                    </div>
                                </td>

                                {/* Date */}
                                <td className="px-3 py-3">
                                    <div className="text-xs text-gray-600 whitespace-nowrap">
                                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'}
                                    </div>
                                </td>

                                {/* Actions menu */}
                                <td className="px-3 py-3">
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === doc.id ? null : doc.id);
                                            }}
                                            className="p-1.5 hover:bg-slate-100 rounded-md transition-colors"
                                        >
                                            <MoreVertical className="w-4 h-4 text-gray-400 group-hover:text-gray-600"
                                                          strokeWidth={1.5}/>
                                        </button>

                                        {openMenuId === doc.id && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-10"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(null);
                                                    }}
                                                />
                                                <div
                                                    className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-20 overflow-hidden">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDownload(doc);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-2"
                                                    >
                                                        <Download className="w-4 h-4" strokeWidth={1.5}/>
                                                        Download
                                                    </button>
                                                    {doc.last_status === 'failed' && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onRerun(doc.id);
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex items-center gap-2"
                                                        >
                                                            <RefreshCw className="w-4 h-4" strokeWidth={1.5}/>
                                                            Re-run Analysis
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDelete(doc);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="w-full px-4 py-2 text-left text-sm text-rose-700 hover:bg-rose-50 transition-colors flex items-center gap-2 border-t border-gray-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" strokeWidth={1.5}/>
                                                        Delete
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DocumentsTable;