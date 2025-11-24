import React, {useState} from 'react';
import {AlertCircle, CheckCircle, FileText, Loader, MoreHorizontal, Upload, XCircle,} from 'lucide-react';
import type {SortField} from '../../pages/Documents';

type DocumentsTableProps = {
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
    onRowClick: (docId: string) => void;
};

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'queued':
            return {
                label: 'Queued',
                icon: Loader,
                iconColor: 'text-gray-500',
                borderColor: 'border-l-gray-400',
            };
        case 'processing':
            return {
                label: 'Processing',
                icon: Loader,
                iconColor: 'text-blue-500',
                borderColor: 'border-l-blue-500',
            };
        case 'success':
            return {
                label: 'Completed',
                icon: CheckCircle,
                iconColor: 'text-emerald-500',
                borderColor: 'border-l-emerald-500',
            };
        case 'failed':
            return {
                label: 'Failed',
                icon: XCircle,
                iconColor: 'text-rose-500',
                borderColor: 'border-l-rose-500',
            };
        default:
            return {
                label: 'Unknown',
                icon: AlertCircle,
                iconColor: 'text-gray-400',
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

const DocumentsTable: React.FC<DocumentsTableProps> = ({
                                                           documents,
                                                           thumbnailUrls,
                                                           loading,
                                                           uploading,
                                                           uploadProgress,
                                                           sortField,
                                                           sortDirection,
                                                           onSortChange,
                                                           onUploadClick,
                                                           onRerun,
                                                           onDownload,
                                                           onDelete,
                                                           onRowClick,
                                                       }) => {
    const [rowMenuOpenId, setRowMenuOpenId] = useState<string | null>(null);

    const renderSortableHeader = (label: string, field: SortField, extraClasses = '') => {
        const isActive = sortField === field;

        return (
            <th
                className={`px-4 py-2 font-semibold ${extraClasses}`}
            >
                <button
                    type="button"
                    onClick={() => onSortChange(field)}
                    className="flex items-center gap-1 group select-none"
                >
                    <span>{label}</span>
                    {isActive && (
                        <span className="text-[10px] text-gray-500">
              {sortDirection === 'asc' ? '▲' : '▼'}
            </span>
                    )}
                </button>
            </th>
        );
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 text-gray-400 animate-spin" strokeWidth={1.5}/>
            </div>
        );
    }

    if (documents.length === 0) {
        return (
            <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={1.5}/>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
                <p className="text-sm text-gray-500 mb-6">
                    Upload your first document to get started
                </p>
                <button
                    onClick={onUploadClick}
                    disabled={uploading}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg shadow-sm transition-all disabled:cursor-not-allowed"
                >
                    <Upload className="w-4 h-4" strokeWidth={1.5}/>
                    <span className="text-sm font-medium">
            {uploading ? 'Uploading...' : 'Upload Documents'}
          </span>
                </button>

                {uploading && (
                    <div className="mt-4 w-full max-w-md mx-auto text-left">
                        <div className="mb-2 flex items-center justify-between text-xs text-gray-600">
                            <span>Uploading...</span>
                            <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-2">
                            <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{width: `${uploadProgress}%`}}
                            />
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            <table className="min-w-full text-left text-sm table-fixed">
                <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                <tr>
                    {renderSortableHeader('Document', 'file_name', 'w-[280px]')}
                    {renderSortableHeader('Company', 'company_name', 'w-[140px]')}
                    {renderSortableHeader('Class', 'part_class', 'w-[100px]')}
                    {renderSortableHeader('Complexity', 'part_complexity', 'w-[110px]')}
                    {renderSortableHeader('Fit', 'part_fit_level', 'w-[90px]')}
                    {renderSortableHeader('Created', 'created_at', 'w-[100px]')}
                    {renderSortableHeader('Status', 'last_status', 'w-[60px] text-center')}
                    <th className="px-4 py-2 font-semibold w-[40px] text-right"></th>
                </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 text-xs md:text-sm">
                {documents.map((doc) => {
                    const statusConfig = getStatusConfig(doc.last_status);
                    const StatusIcon = statusConfig.icon;
                    const thumbnailUrl = thumbnailUrls[doc.id];

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
                                    {/* backdrop – zavře menu, ale neotevře detail */}
                                    <div
                                        className="fixed inset-0 z-40"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setRowMenuOpenId(null);
                                        }}
                                    />
                                    <div
                                        className="absolute right-0 mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onRerun(doc.id);
                                                setRowMenuOpenId(null);
                                            }}
                                            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            Re-run Report
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDownload(doc);
                                                setRowMenuOpenId(null);
                                            }}
                                            className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            Download
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(doc);
                                                setRowMenuOpenId(null);
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

                    return (
                        <tr
                            key={doc.id}
                            className="group cursor-pointer hover:bg-gray-50"
                            onClick={() => onRowClick(doc.id)}
                        >
                            {/* Document */}
                            <td
                                className={`px-4 py-3 align-middle border-l-4 ${statusConfig.borderColor} w-[250px]`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
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
                                    <span className="truncate block text-gray-900 font-medium">
                      {doc.file_name}
                    </span>
                                </div>
                            </td>

                            {/* Company */}
                            <td className="px-4 py-3 align-middle text-gray-600 truncate w-[120px] text-xs">
                                {doc.company_name || '—'}
                            </td>

                            {/* Class */}
                            <td className="px-4 py-3 align-middle text-gray-600 truncate w-[100px] text-xs">
                                {doc.part_class || '—'}
                            </td>

                            {/* Complexity */}
                            <td className="px-4 py-3 align-middle text-gray-600 w-[110px] text-xs">
                                {doc.part_complexity || '—'}
                            </td>

                            {/* Fit */}
                            <td className="px-4 py-3 align-middle text-gray-600 w-[90px] text-xs">
                                {doc.part_fit_level || '—'}
                            </td>

                            {/* Created */}
                            <td className="px-4 py-3 align-middle text-gray-500 w-[100px] text-xs">
                                {formatDate(doc.created_at)}
                            </td>

                            {/* Status icon */}
                            <td className="px-4 py-3 align-middle text-center w-[60px]">
                                <StatusIcon
                                    className={`w-4 h-4 inline-block ${statusConfig.iconColor}`}
                                    strokeWidth={2}
                                    // title={statusConfig.label}
                                />
                            </td>

                            {/* Menu */}
                            <td
                                className="px-4 py-3 align-middle text-right w-[40px]"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {RowMenu}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>
        </div>
    );
};

export default DocumentsTable;
