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

// Jedno místo, kde nastavíš šířky sloupců
const COLUMN_WIDTHS = {
    file_name: 'w-[300px] max-w-[320px]',
    company_name: 'w-[140px] max-w-[140px]',
    part_class: 'w-[60px] max-w-[60px]',
    envelope: 'w-[100px] max-w-[100px]',
    part_complexity: 'w-[60px] max-w-[60px]',
    part_fit_level: 'w-[80px] max-w-[80px]',
    created_at: 'w-[60px] max-w-[60px]',
    status: 'w-[20px] max-w-[20px]',
    menu: 'w-[20px] max-w-[20px]',
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
    const [rowMenuOpenId, setRowMenuOpenId] = useState<string | null>(null);

    const renderSortableHeader = (label: string, field: SortField) => {
        const isActive = sortField === field;

        return (
            <th className="px-3 py-2 font-semibold text-[11px] text-gray-500">
                <button
                    type="button"
                    onClick={() => onSortChange(field)}
                    className="flex items-center gap-1 group select-none w-full text-left"
                >
                    <span className="truncate">{label}</span>
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
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
            {/* table-auto + šířky řešíme uvnitř buněk, ne přes table layout */}
            <table className="min-w-full text-left text-sm table-auto">
                <thead className="bg-gray-50 text-[11px] tracking-wide text-gray-500">
                <tr>
                    {renderSortableHeader('Document', 'file_name')}
                    {renderSortableHeader('Company', 'company_name')}
                    {renderSortableHeader('Class', 'part_class')}
                    <th className="px-3 py-2 font-semibold text-[11px] text-gray-500">
                        <span className="truncate">Envelope</span>
                    </th>
                    {renderSortableHeader('Complexity', 'part_complexity')}
                    {renderSortableHeader('Fit', 'part_fit_level')}
                    {renderSortableHeader('Created', 'created_at')}
                    {renderSortableHeader('Status', 'last_status')}
                    <th className="px-3 py-2 font-semibold text-[11px] text-right text-gray-500">
                        {/* Menu */}
                    </th>
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

                    const envelopeText = doc.part_envelope_text || '';
                    const companyName = doc.company_name || '';
                    const partClass = doc.part_class || '';
                    const complexity = doc.part_complexity || '';
                    const fitLevel = doc.part_fit_level || '';
                    const fileName = doc.file_name || '';

                    return (
                        <tr
                            key={doc.id}
                            className="group cursor-pointer hover:bg-gray-50"
                            onClick={() => onRowClick(doc.id)}
                        >
                            {/* Document */}
                            <td className={`px-3 py-3 align-middle border-l-4 text-xs ${statusConfig.borderColor}`}>
                                <div
                                    className={`flex items-center gap-3 min-w-0 ${COLUMN_WIDTHS.file_name}`}
                                    title={fileName}
                                >
                                    {thumbnailUrl ? (
                                        <img
                                            src={thumbnailUrl}
                                            alt={fileName}
                                            className="w-8 h-8 object-cover rounded flex-shrink-0"
                                        />
                                    ) : (
                                        <FileText
                                            className="w-8 h-8 text-blue-500 flex-shrink-0"
                                            strokeWidth={1.5}
                                        />
                                    )}
                                    <span className="truncate block text-gray-900 font-medium">
                      {fileName}
                    </span>
                                </div>
                            </td>

                            {/* Company */}
                            <td className="px-3 py-3 align-middle text-gray-600 text-xs">
                                <div
                                    className={`${COLUMN_WIDTHS.company_name} truncate`}
                                    title={companyName}
                                >
                                    {companyName}
                                </div>
                            </td>

                            {/* Class */}
                            <td className="px-3 py-3 align-middle text-gray-600 text-xs">
                                <div className={`${COLUMN_WIDTHS.part_class} truncate`} title={partClass}>
                                    {partClass}
                                </div>
                            </td>

                            {/* Envelope */}
                            <td className="px-3 py-3 align-middle text-gray-600 text-xs">
                                <div
                                    className={`${COLUMN_WIDTHS.envelope} truncate`}
                                    title={envelopeText}
                                >
                                    {envelopeText}
                                </div>
                            </td>

                            {/* Complexity */}
                            <td className="px-3 py-3 align-middle text-gray-600 text-xs">
                                <div
                                    className={`${COLUMN_WIDTHS.part_complexity} truncate`}
                                    title={complexity}
                                >
                                    {complexity}
                                </div>
                            </td>

                            {/* Fit */}
                            <td className="px-3 py-3 align-middle text-gray-600 text-xs">
                                <div
                                    className={`${COLUMN_WIDTHS.part_fit_level} truncate`}
                                    title={fitLevel}
                                >
                                    {fitLevel}
                                </div>
                            </td>

                            {/* Created */}
                            <td className="px-3 py-3 align-middle text-gray-500 text-xs">
                                <div className={`${COLUMN_WIDTHS.created_at} whitespace-nowrap`}>
                                    {formatDate(doc.created_at)}
                                </div>
                            </td>

                            {/* Status */}
                            <td className="px-3 py-3 align-middle text-center">
                                <div className={COLUMN_WIDTHS.status} title={statusConfig.label}>
                                    <StatusIcon
                                        className={`w-4 h-4 inline-block ${statusConfig.iconColor}`}
                                        strokeWidth={2}
                                    />
                                </div>
                            </td>

                            {/* Menu */}
                            <td
                                className="px-3 py-3 align-middle text-right"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className={COLUMN_WIDTHS.menu}>{RowMenu}</div>
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
