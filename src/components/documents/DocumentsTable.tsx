// src/components/documents/DocumentsTable.tsx
import React from "react";
import {
    AlertCircle,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Download,
    FileText,
    Loader2,
    Lock,
    MoreVertical,
    RefreshCw,
    Star,
    StarOff,
    Trash2
} from "lucide-react";
import type {PartWithDocument} from "../../hooks/useParts";
import type {PriorityEnum, WorkflowStatusEnum} from "../../lib/database.types";
import {getPriorityClasses, getStatusClasses, PRIORITY_LABELS, STATUS_LABELS,} from "../../utils/partWorkflow";

export type SortField =
    | "file_name"
    | "company_name"
    | "primary_class"
    | "overall_complexity"
    | "fit_level"
    | "last_status"
    | "last_updated";

type WorkflowStatus = WorkflowStatusEnum | null;
type Priority = PriorityEnum | null;

interface DocumentsTableProps {
    parts: PartWithDocument[];
    loading: boolean;
    uploading: boolean;
    uploadProgress: number;
    sortField: SortField;
    sortDirection: "asc" | "desc";
    onSortChange: (field: SortField) => void;
    onUploadClick: () => void;
    onRerun: (docId: string) => void;
    onDownload: (doc: any) => void;
    onDelete: (row: PartWithDocument) => void;
    onRowClick: (documentId: string, partId: string) => void;

    // 💫 NOVÉ – tier & actions
    canUseProjects?: boolean;
    canUseFavorite?: boolean;
    canSetStatus?: boolean;
    canSetPriority?: boolean;

    deleteLabel?: string;
    onAddToProject?: (part: PartWithDocument) => void;
    favoritePartIds?: Set<string>;
    onToggleFavorite?: (part: PartWithDocument) => void;

    onChangeWorkflowStatus?: (
        part: PartWithDocument,
        value: WorkflowStatusEnum
    ) => void;
    onChangePriority?: (part: PartWithDocument, value: PriorityEnum) => void;

    updatingStatusIds?: Set<string>;
    updatingPriorityIds?: Set<string>;
}


const DocumentsTable: React.FC<DocumentsTableProps> = ({
                                                           parts,
                                                           loading,
                                                           uploading,
                                                           sortField,
                                                           sortDirection,
                                                           onSortChange,
                                                           onUploadClick,
                                                           onRerun,
                                                           onDownload,
                                                           onDelete,
                                                           onRowClick,
                                                           canUseFavorite = false,
                                                           canSetStatus = false,
                                                           canSetPriority = false,
                                                           favoritePartIds,
                                                           onToggleFavorite,
                                                           onChangeWorkflowStatus,
                                                           onChangePriority,
                                                           updatingStatusIds,
                                                           updatingPriorityIds,
                                                       }) => {
    const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

    const SortableHeader: React.FC<{
        field: SortField;
        children: React.ReactNode;
        className?: string;
    }> = ({field, children, className = ""}) => {
        const isActive = sortField === field;
        return (
            <th
                onClick={() => onSortChange(field)}
                className={`px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-slate-50 transition-colors select-none ${className}`}
            >
                <div className="flex items-center gap-1.5">
                    {children}
                    {isActive ? (
                        sortDirection === "asc" ? (
                            <ChevronUp
                                className="w-4 h-4 text-blue-600"
                                strokeWidth={2}
                            />
                        ) : (
                            <ChevronDown
                                className="w-4 h-4 text-blue-600"
                                strokeWidth={2}
                            />
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

    const getStatusConfig = (status: string | null) => {
        switch (status) {
            case "success":
                return {
                    icon: CheckCircle2,
                    label: "Processed",
                    className:
                        "bg-emerald-50 text-emerald-700 border-emerald-200",
                    iconColor: "text-emerald-600",
                };
            case "processing":
            case "queued":
                return {
                    icon: Loader2,
                    label: "Processing",
                    className: "bg-blue-50 text-blue-700 border-blue-200",
                    iconColor: "text-blue-600",
                    animate: true,
                };
            case "failed":
            case "error":
                return {
                    icon: AlertCircle,
                    label: "Error",
                    className: "bg-rose-50 text-rose-700 border-rose-200",
                    iconColor: "text-rose-600",
                };
            default:
                return {
                    icon: FileText,
                    label: "Unknown",
                    className: "bg-gray-50 text-gray-600 border-gray-200",
                    iconColor: "text-gray-500",
                };
        }
    };

    const getComplexityConfig = (complexity: string | null) => {
        const val = complexity?.toUpperCase();
        switch (val) {
            case "HIGH":
            case "EXTREME":
                return {
                    label: val,
                    className:
                        "bg-rose-50 text-rose-800 border-rose-300 font-semibold",
                };
            case "MEDIUM":
                return {
                    label: "MEDIUM",
                    className:
                        "bg-amber-50 text-amber-800 border-amber-300 font-medium",
                };
            case "LOW":
                return {
                    label: "LOW",
                    className:
                        "bg-emerald-50 text-emerald-800 border-emerald-300 font-medium",
                };
            default:
                return null;
        }
    };

    const getFitConfig = (fit: string | null) => {
        const val = fit?.toUpperCase();
        switch (val) {
            case "GOOD":
                return {
                    label: "GOOD",
                    className:
                        "bg-emerald-50 text-emerald-800 border-emerald-300 font-medium",
                };
            case "PARTIAL":
                return {
                    label: "PARTIAL",
                    className:
                        "bg-blue-50 text-blue-800 border-blue-300 font-medium",
                };
            case "COOPERATION":
                return {
                    label: "COOP",
                    className:
                        "bg-purple-50 text-purple-800 border-purple-300 font-medium",
                };
            case "LOW":
                return {
                    label: "LOW",
                    className:
                        "bg-amber-50 text-amber-800 border-amber-300 font-medium",
                };
            case "UNKNOWN":
                return {
                    label: "UNKNOWN",
                    className: "bg-gray-50 text-gray-600 border-gray-300",
                };
            default:
                return null;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(date);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"/>
                <p className="text-sm font-medium text-slate-600">
                    Loading parts...
                </p>
            </div>
        );
    }

    if (parts.length === 0 && !uploading) {
        return (
            <div
                className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <FileText
                    className="w-16 h-16 text-gray-300 mb-4"
                    strokeWidth={1.5}
                />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No parts yet
                </h3>
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
                        <col style={{width: "24%"}}/>
                        {" "} {/* Document (file + page + company + favourite) */}
                        <col style={{width: "8%"}}/>
                        {/* Class */}
                        <col style={{width: "10%"}}/>
                        {/* Material */}
                        <col style={{width: "10%"}}/>
                        {/* Envelope */}
                        <col style={{width: "8%"}}/>
                        {/* Complexity */}
                        <col style={{width: "8%"}}/>
                        {/* Fit */}
                        <col style={{width: "8%"}}/>
                        {/* Workflow */}
                        <col style={{width: "7%"}}/>
                        {/* Priority */}
                        <col style={{width: "10%"}}/>
                        {/* Modified */}
                        <col style={{width: "48px"}}/>
                        {/* Doc Status */}
                        <col style={{width: "48px"}}/>
                        {/* Actions */}
                    </colgroup>
                    <thead className="bg-slate-50 border-b border-gray-200">
                    <tr>
                        <SortableHeader field="file_name">
                            Document
                        </SortableHeader>
                        <SortableHeader field="primary_class">
                            Class
                        </SortableHeader>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Material
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            Envelope
                        </th>
                        <SortableHeader field="overall_complexity">
                            Complexity
                        </SortableHeader>
                        <SortableHeader field="fit_level">
                            Fit
                        </SortableHeader>

                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-1.5">
                                Work Status
                                {!canSetStatus && (
                                    <Lock className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5}/>
                                )}
                            </div>
                        </th>
                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-1.5">
                                Priority
                                {!canSetPriority && (
                                    <Lock className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5}/>
                                )}
                            </div>
                        </th>
                        <SortableHeader field="last_updated">
                            Modified
                        </SortableHeader>
                        <SortableHeader
                            field="last_status"
                            className="text-center"
                        >
                            Status
                        </SortableHeader>
                        <th className="px-3 py-3"/>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                    {parts.map((part) => {
                        const statusConfig = getStatusConfig(
                            part.document?.last_status || null
                        );
                        const StatusIcon = statusConfig.icon;
                        const complexityConfig = getComplexityConfig(
                            part.overall_complexity
                        );
                        const fitConfig = getFitConfig(part.fit_level);

                        const isPlaceholder =
                            part.isProcessingPlaceholder === true;

                        const isFavorite =
                            favoritePartIds?.has(part.id) ?? false;

                        const statusValue =
                            (part.workflow_status as WorkflowStatus) ?? null;
                        const priorityValue =
                            (part.priority as Priority) ?? null;

                        const statusDisabled =
                            isPlaceholder ||
                            !canSetStatus ||
                            !onChangeWorkflowStatus ||
                            updatingStatusIds?.has(part.id);
                        const priorityDisabled =
                            isPlaceholder ||
                            !canSetPriority ||
                            !onChangePriority ||
                            updatingPriorityIds?.has(part.id);

                        const favoriteDisabled =
                            isPlaceholder ||
                            !canUseFavorite ||
                            !onToggleFavorite;

                        return (
                            <tr
                                key={part.id}
                                onClick={() =>
                                    !isPlaceholder &&
                                    part.document &&
                                    onRowClick(part.document.id, part.id)
                                }
                                className={`transition-colors ${
                                    isPlaceholder
                                        ? "bg-blue-50/30 cursor-default"
                                        : "hover:bg-blue-50/50 cursor-pointer"
                                }`}
                            >
                                {/* Document (favourite + file + page/company) */}
                                <td className="px-3 py-3">
                                    <div className="flex items-start gap-3">
                                        {/* Favourite toggle */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (favoriteDisabled)
                                                    return;
                                                onToggleFavorite?.(part);
                                            }}
                                            disabled={favoriteDisabled}
                                            className={`mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full border text-xs transition
                                                    ${
                                                isFavorite
                                                    ? "bg-amber-50 border-amber-300 text-amber-700"
                                                    : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50"
                                            }
                                                    ${
                                                !canUseFavorite
                                                    ? "opacity-60 cursor-not-allowed"
                                                    : ""
                                            }
                                                `}
                                        >
                                            {isFavorite ? (
                                                <Star
                                                    className="w-3.5 h-3.5 fill-current"
                                                    strokeWidth={1.5}
                                                />
                                            ) : (
                                                <StarOff
                                                    className="w-3.5 h-3.5"
                                                    strokeWidth={1.5}
                                                />
                                            )}
                                        </button>

                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <FileText
                                                className={`w-4 h-4 flex-shrink-0 ${
                                                    isPlaceholder
                                                        ? "text-blue-400"
                                                        : "text-gray-400"
                                                }`}
                                            />
                                            <div className="flex flex-col min-w-0">
                                                    <span
                                                        className={`text-sm font-medium truncate ${
                                                            isPlaceholder
                                                                ? "text-blue-900"
                                                                : "text-gray-900"
                                                        }`}
                                                    >
                                                        {part.document
                                                                ?.file_name ||
                                                            "Unknown"}
                                                    </span>
                                                <span className="text-xs text-gray-500 truncate">
                                                        {isPlaceholder ? (
                                                            <span className="italic">
                                                                Processing…
                                                            </span>
                                                        ) : (
                                                            <>
                                                                {part.page !==
                                                                null ? (
                                                                    <>
                                                                        Page{" "}
                                                                        {
                                                                            part.page
                                                                        }
                                                                        {part.company_name &&
                                                                            " • "}
                                                                    </>
                                                                ) : null}
                                                                {part.company_name ??
                                                                    (!part.page
                                                                        ? "—"
                                                                        : "")}
                                                            </>
                                                        )}
                                                    </span>
                                            </div>
                                        </div>
                                    </div>
                                </td>

                                {/* Class */}
                                <td className="px-3 py-3">
                                        <span className="text-sm text-gray-500 truncate block">
                                            {isPlaceholder
                                                ? "-"
                                                : part.primary_class || "-"}
                                        </span>
                                </td>

                                {/* Material */}
                                <td className="px-3 py-3">
                                        <span className="text-sm text-gray-500 truncate block">
                                            {isPlaceholder
                                                ? "-"
                                                : part.material || "-"}
                                        </span>
                                </td>

                                {/* Envelope */}
                                <td className="px-3 py-3">
                                        <span className="text-sm text-gray-500 truncate block">
                                            {isPlaceholder
                                                ? "-"
                                                : part.envelope_text || "-"}
                                        </span>
                                </td>

                                {/* Complexity */}
                                <td className="px-3 py-3">
                                    {isPlaceholder ? (
                                        <span className="text-sm text-gray-400">
                                                -
                                            </span>
                                    ) : complexityConfig ? (
                                        <span
                                            className={`inline-flex items-center px-2 py-1 rounded text-xs border ${complexityConfig.className}`}
                                        >
                                                {complexityConfig.label}
                                            </span>
                                    ) : (
                                        <span className="text-sm text-gray-400">
                                                -
                                            </span>
                                    )}
                                </td>

                                {/* Fit */}
                                <td className="px-3 py-3">
                                    {isPlaceholder ? (
                                        <span className="text-sm text-gray-400">
                                                -
                                            </span>
                                    ) : fitConfig ? (
                                        <span
                                            className={`inline-flex items-center px-2 py-1 rounded text-xs border ${fitConfig.className}`}
                                        >
                                                {fitConfig.label}
                                            </span>
                                    ) : (
                                        <span className="text-sm text-gray-400">
                                                -
                                            </span>
                                    )}
                                </td>

                                {/* Workflow status */}
                                <td className="px-3 py-3">
                                    {isPlaceholder ? (
                                        <span className="text-xs text-gray-400">-</span>
                                    ) : canSetStatus && onChangeWorkflowStatus ? (
                                        <div
                                            className="relative inline-block w-full"
                                            onClick={(e) => e.stopPropagation()} // 👉 NEPUSTIT KLIK NA <tr>
                                        >
                                            <select
                                                value={statusValue ?? ""}
                                                onChange={(e) =>
                                                    onChangeWorkflowStatus(
                                                        part,
                                                        e.target.value as WorkflowStatusEnum
                                                    )
                                                }
                                                disabled={statusDisabled}
                                                className={`pl-2 pr-7 h-8 w-full rounded-lg text-xs appearance-none bg-clip-padding border ${
                                                    statusDisabled
                                                        ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                                                        : `${getStatusClasses(statusValue)} cursor-pointer`
                                                }`}
                                            >
                                                {!statusValue && <option value="">—</option>}
                                                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                                    <option key={value} value={value}>
                                                        {label}
                                                    </option>
                                                ))}
                                            </select>

                                            <ChevronDown
                                                className="w-3.5 h-3.5 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                                strokeWidth={1.5}
                                            />
                                        </div>
                                    ) : statusValue ? (
                                        <span
                                            className={`inline-flex items-center px-2 py-1 rounded text-xs border ${getStatusClasses(
                                                statusValue
                                            )}`}
                                        >
            {STATUS_LABELS[statusValue as WorkflowStatusEnum]}
        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">-</span>
                                    )}
                                </td>

                                {/* Priority */}
                                <td className="px-3 py-3">
                                    {isPlaceholder ? (
                                        <span className="text-xs text-gray-400">-</span>
                                    ) : canSetPriority && onChangePriority ? (
                                        <div
                                            className="relative inline-block w-full"
                                            onClick={(e) => e.stopPropagation()} // 👉 zamezí otevření detailu
                                        >
                                            <select
                                                value={priorityValue ?? ""}
                                                onChange={(e) =>
                                                    onChangePriority(
                                                        part,
                                                        e.target.value as PriorityEnum
                                                    )
                                                }
                                                disabled={priorityDisabled}
                                                className={`pl-2 pr-7 h-8 w-full rounded-lg text-xs appearance-none bg-clip-padding border ${
                                                    priorityDisabled
                                                        ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                                                        : `${getPriorityClasses(priorityValue)} cursor-pointer`
                                                }`}
                                            >
                                                {!priorityValue && <option value="">—</option>}
                                                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                                                    <option key={value} value={value}>
                                                        {label}
                                                    </option>
                                                ))}
                                            </select>

                                            <ChevronDown
                                                className="w-3.5 h-3.5 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
                                                strokeWidth={1.5}
                                            />
                                        </div>
                                    ) : priorityValue ? (
                                        <span
                                            className={`inline-flex items-center px-2 py-1 rounded text-xs border ${getPriorityClasses(
                                                priorityValue
                                            )}`}
                                        >
            {PRIORITY_LABELS[priorityValue as PriorityEnum]}
        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">-</span>
                                    )}
                                </td>

                                {/* Modified */}
                                <td className="px-3 py-3">
                                        <span className="text-xs text-gray-500">
                                            {isPlaceholder
                                                ? "-"
                                                : part.last_updated
                                                    ? formatDate(part.last_updated)
                                                    : "-"}
                                        </span>
                                </td>

                                {/* Doc processing status */}
                                <td className="px-3 py-3">
                                    <div className="flex justify-center">
                                        <StatusIcon
                                            className={`w-5 h-5 ${statusConfig.iconColor} ${
                                                statusConfig.animate
                                                    ? "animate-spin"
                                                    : ""
                                            }`}
                                            strokeWidth={1.5}
                                        />
                                    </div>
                                </td>

                                {/* Actions */}
                                <td className="px-3 py-3">
                                    {!isPlaceholder && (
                                        <div className="relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(
                                                        openMenuId ===
                                                        part.id
                                                            ? null
                                                            : part.id
                                                    );
                                                }}
                                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <MoreVertical
                                                    className="w-4 h-4 text-gray-500"
                                                    strokeWidth={1.5}
                                                />
                                            </button>

                                            {openMenuId === part.id &&
                                                part.document && (
                                                    <div
                                                        className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                                        <button
                                                            onClick={(
                                                                e
                                                            ) => {
                                                                e.stopPropagation();
                                                                onRerun(
                                                                    part
                                                                        .document!
                                                                        .id
                                                                );
                                                                setOpenMenuId(
                                                                    null
                                                                );
                                                            }}
                                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                                                        >
                                                            <RefreshCw
                                                                className="w-4 h-4"
                                                                strokeWidth={
                                                                    1.5
                                                                }
                                                            />
                                                            Rerun
                                                        </button>
                                                        <button
                                                            onClick={(
                                                                e
                                                            ) => {
                                                                e.stopPropagation();
                                                                onDownload(
                                                                    part.document
                                                                );
                                                                setOpenMenuId(
                                                                    null
                                                                );
                                                            }}
                                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                                                        >
                                                            <Download
                                                                className="w-4 h-4"
                                                                strokeWidth={
                                                                    1.5
                                                                }
                                                            />
                                                            Download
                                                        </button>
                                                        <button
                                                            onClick={(
                                                                e
                                                            ) => {
                                                                e.stopPropagation();
                                                                onDelete(
                                                                    part
                                                                );
                                                                setOpenMenuId(
                                                                    null
                                                                );
                                                            }}
                                                            className="flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 w-full text-left transition-colors"
                                                        >
                                                            <Trash2
                                                                className="w-4 h-4"
                                                                strokeWidth={
                                                                    1.5
                                                                }
                                                            />
                                                            Delete
                                                        </button>
                                                    </div>
                                                )}
                                        </div>
                                    )}
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
