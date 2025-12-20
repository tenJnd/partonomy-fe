import React from "react";
import {
    ChevronDown,
    ChevronUp,
    Download,
    FileText,
    FolderPlus,
    Lock,
    MoreVertical,
    RefreshCw,
    Star,
    StarOff,
    Trash2,
} from "lucide-react";
import type {PartWithDocument} from "../../hooks/useParts";
import type {PriorityEnum, WorkflowStatusEnum} from "../../lib/database.types";
import {
    getComplexityConfig,
    getFitConfig,
    getPriorityClasses,
    getStatusClasses,
    getStatusConfig,
    PRIORITY_LABELS,
    STATUS_LABELS,
} from "../../utils/tagsFormatting";
import {useTranslation} from "react-i18next";

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

    // tier & actions
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

    // 🔥 NOVÉ – výběr + batch akce
    selectedPartIds?: Set<string>;
    onToggleSelect?: (partId: string) => void;
    onToggleSelectAll?: (partIdsOnPage: string[]) => void;

    onBulkToggleFavorite?: (partIds: string[], favorite: boolean) => void;
    onBulkSetStatus?: (partIds: string[], status: WorkflowStatusEnum) => void;
    onBulkSetPriority?: (partIds: string[], priority: PriorityEnum) => void;
    onBulkAddToProject?: (partIds: string[]) => void;
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
                                                           canUseProjects = false,
                                                           canUseFavorite = false,
                                                           canSetStatus = false,
                                                           canSetPriority = false,
                                                           favoritePartIds,
                                                           onToggleFavorite,
                                                           onChangeWorkflowStatus,
                                                           onChangePriority,
                                                           updatingStatusIds,
                                                           updatingPriorityIds,
                                                           // selection + bulk
                                                           selectedPartIds,
                                                           onToggleSelect,
                                                           onToggleSelectAll,
                                                           onBulkToggleFavorite,
                                                           onBulkSetStatus,
                                                           onBulkSetPriority,
                                                           onBulkAddToProject,
                                                           onAddToProject,
                                                       }) => {
    const {t} = useTranslation();
    const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

    const selectionEnabled = !!selectedPartIds && !!onToggleSelect;
    // 👉 tady přidej:
    const hasBulkStatus = canSetStatus && !!onBulkSetStatus;
    const hasBulkPriority = canSetPriority && !!onBulkSetPriority;
    const hasBulkFavorite = canUseFavorite && !!onBulkToggleFavorite;
    const hasBulkProjects = canUseProjects && !!onBulkAddToProject;

    // je-li false, checkboxy budou zamčené
    const hasBulkActions =
        !!selectedPartIds &&
        !!onToggleSelect &&
        !!onToggleSelectAll &&
        (hasBulkStatus || hasBulkPriority || hasBulkFavorite || hasBulkProjects);

    const partsIdsOnPage = React.useMemo(() => parts.map((p) => p.id), [parts]);

    const selectedIdsOnPage: string[] = React.useMemo(() => {
        if (!selectionEnabled || !selectedPartIds) return [];
        return partsIdsOnPage.filter((id) => selectedPartIds.has(id));
    }, [selectionEnabled, selectedPartIds, partsIdsOnPage]);

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
                    {t("documents.loadingParts")}
                </p>
            </div>
        );
    }

    if (parts.length === 0 && !uploading) {
        return (
            <div
                className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <FileText className="w-16 h-16 text-gray-300 mb-4" strokeWidth={1.5}/>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t("documents.noPartsYet")}
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                    {t("documents.noPartsYetDescription")}
                </p>
                <button
                    onClick={onUploadClick}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-sm transition-all"
                >
                    <FileText className="w-4 h-4" strokeWidth={2}/>
                    {t("documents.uploadDocuments")}
                </button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* 🔥 Bulk bar */}
            {selectionEnabled && selectedIdsOnPage.length > 0 && (
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-slate-50">
          <span className="text-xs text-gray-700">
            <span className="font-semibold">{selectedIdsOnPage.length}</span>{" "}
              {t("documents.bulk.selected")}
          </span>

                    <div className="flex items-center gap-2 flex-wrap justify-end">
                        {/* Favorite */}
                        {onBulkToggleFavorite && canUseFavorite && (
                            <div className="inline-flex rounded-md border border-gray-200 overflow-hidden text-xs">
                                <button
                                    type="button"
                                    onClick={() => onBulkToggleFavorite(selectedIdsOnPage, true)}
                                    className="px-2.5 py-1 inline-flex items-center gap-1 bg-white hover:bg-amber-50 text-amber-700"
                                >
                                    <Star className="w-3.5 h-3.5" strokeWidth={1.5}/>
                                    {t("documents.bulk.fav")}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onBulkToggleFavorite(selectedIdsOnPage, false)}
                                    className="px-2.5 py-1 inline-flex items-center gap-1 bg-white hover:bg-gray-50 text-gray-600 border-l border-gray-200"
                                >
                                    <StarOff className="w-3.5 h-3.5" strokeWidth={1.5}/>
                                    {t("documents.bulk.clear")}
                                </button>
                            </div>
                        )}

                        {/* Status */}
                        {onBulkSetStatus && canSetStatus && (
                            <select
                                defaultValue=""
                                onChange={(e) => {
                                    const value = e.target.value as WorkflowStatusEnum | "";
                                    if (!value) return;
                                    onBulkSetStatus(selectedIdsOnPage, value);
                                    e.target.value = "";
                                }}
                                className="h-8 px-2 bg-white border border-gray-200 rounded-md text-xs shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none"
                            >
                                <option value="">{t("documents.bulk.setStatus")}</option>
                                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Priority */}
                        {onBulkSetPriority && canSetPriority && (
                            <select
                                defaultValue=""
                                onChange={(e) => {
                                    const value = e.target.value as PriorityEnum | "";
                                    if (!value) return;
                                    onBulkSetPriority(selectedIdsOnPage, value);
                                    e.target.value = "";
                                }}
                                className="h-8 px-2 bg-white border border-gray-200 rounded-md text-xs shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none"
                            >
                                <option value="">{t("documents.bulk.setPriority")}</option>
                                {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Add to project */}
                        {onBulkAddToProject && canUseProjects && (
                            <button
                                type="button"
                                onClick={() => onBulkAddToProject(selectedIdsOnPage)}
                                className="h-8 px-3 inline-flex items-center rounded-md border border-gray-200 bg-white text-xs text-gray-700 hover:bg-gray-50 shadow-sm"
                            >
                                {t("documents.bulk.addToProject")}
                            </button>
                        )}
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                    <colgroup>
                        {/* selection sloupec */}
                        {selectionEnabled && <col style={{width: "36px"}}/>}
                        <col style={{width: "24%"}}/>
                        {/* Document */}
                        <col style={{width: "12%"}}/>
                        {/* Class */}
                        <col style={{width: "12%"}}/>
                        {/* Drawing number */}
                        <col style={{width: "10%"}}/>
                        {/* Material */}
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
                        {/* header checkbox */}
                        {selectionEnabled && (
                            <th className="px-3 py-3 text-center align-middle">
                                {hasBulkActions ? (
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={() => {
                                            if (!hasBulkActions || !onToggleSelectAll || !selectedPartIds) return;

                                            const idsOnPage = parts
                                                .filter((p) => !p.isProcessingPlaceholder)
                                                .map((p) => p.id);

                                            onToggleSelectAll(idsOnPage);
                                        }}
                                        checked={
                                            !!selectedPartIds &&
                                            parts
                                                .filter((p) => !p.isProcessingPlaceholder)
                                                .every((p) => selectedPartIds.has(p.id)) &&
                                            parts.length > 0
                                        }
                                    />
                                ) : (
                                    <div className="inline-flex items-center justify-center w-4 h-4 text-gray-300">
                                        <Lock className="w-3 h-3" strokeWidth={1.5}/>
                                    </div>
                                )}
                            </th>
                        )}

                        <SortableHeader field="file_name">
                            {t("documents.columns.document")}
                        </SortableHeader>

                        <SortableHeader field="primary_class">
                            {t("documents.columns.class")}
                        </SortableHeader>

                        <SortableHeader field="primary_class">
                            {t("documents.columns.drawingNumber")}
                        </SortableHeader>

                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            {t("documents.columns.material")}
                        </th>


                        <SortableHeader field="overall_complexity">
                            {t("documents.columns.complexity")}
                        </SortableHeader>

                        <SortableHeader field="fit_level">
                            {t("documents.columns.fit")}
                        </SortableHeader>

                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-1.5">
                                {t("documents.columns.workStatus")}
                                {!canSetStatus && (
                                    <Lock className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5}/>
                                )}
                            </div>
                        </th>

                        <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                            <div className="flex items-center gap-1.5">
                                {t("documents.columns.priority")}
                                {!canSetPriority && (
                                    <Lock className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5}/>
                                )}
                            </div>
                        </th>

                        <SortableHeader field="last_updated">
                            {t("documents.columns.modified")}
                        </SortableHeader>

                        <SortableHeader field="last_status" className="text-center">
                            {t("documents.columns.status")}
                        </SortableHeader>

                        <th className="px-3 py-3"/>
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                    {parts.map((part) => {
                        const statusConfig = getStatusConfig(part.document?.last_status || null);
                        const StatusIcon = statusConfig.icon;
                        const complexityConfig = getComplexityConfig(part.overall_complexity);
                        const fitConfig = getFitConfig(part.fit_level);

                        const isPlaceholder = part.isProcessingPlaceholder === true;

                        const isFavorite = favoritePartIds?.has(part.id) ?? false;

                        const statusValue = (part.workflow_status as WorkflowStatus) ?? null;
                        const priorityValue = (part.priority as Priority) ?? null;

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

                        const favoriteDisabled = isPlaceholder || !canUseFavorite || !onToggleFavorite;

                        return (
                            <tr
                                key={part.id}
                                onClick={() =>
                                    !isPlaceholder && part.document && onRowClick(part.document.id, part.id)
                                }
                                className={`transition-colors ${
                                    isPlaceholder ? "bg-blue-50/30 cursor-default" : "hover:bg-blue-50/50 cursor-pointer"
                                }`}
                            >
                                {/* row checkbox */}
                                {selectionEnabled && (
                                    <td className="px-3 py-3 text-center">
                                        <input
                                            type="checkbox"
                                            className={`w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                                                !hasBulkActions ? "cursor-not-allowed opacity-40" : ""
                                            }`}
                                            disabled={!hasBulkActions || part.isProcessingPlaceholder}
                                            checked={selectedPartIds?.has(part.id) ?? false}
                                            onClick={(e) => e.stopPropagation()}
                                            onChange={() => {
                                                if (!hasBulkActions || !onToggleSelect) return;
                                                onToggleSelect(part.id);
                                            }}
                                        />
                                    </td>
                                )}

                                {/* Document (favourite + file + page/company) */}
                                <td className="px-3 py-3">
                                    <div className="flex items-start gap-3">
                                        {/* Favourite toggle */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (favoriteDisabled) return;
                                                onToggleFavorite?.(part);
                                            }}
                                            disabled={favoriteDisabled}
                                            className={`mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full border text-xs transition
                          ${
                                                isFavorite
                                                    ? "bg-amber-50 border-amber-300 text-amber-700"
                                                    : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50"
                                            }
                          ${!canUseFavorite ? "opacity-60 cursor-not-allowed" : ""}
                        `}
                                        >
                                            {isFavorite ? (
                                                <Star className="w-3.5 h-3.5 fill-current" strokeWidth={1.5}/>
                                            ) : (
                                                <StarOff className="w-3.5 h-3.5" strokeWidth={1.5}/>
                                            )}
                                        </button>

                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <FileText
                                                className={`w-4 h-4 flex-shrink-0 ${
                                                    isPlaceholder ? "text-blue-400" : "text-gray-400"
                                                }`}
                                            />
                                            <div className="flex flex-col min-w-0">
                                              <span
                                                  className={`text-sm font-medium truncate ${
                                                      isPlaceholder ? "text-blue-900" : "text-gray-900"
                                                  }`}
                                              >
                                                {part.document?.file_name || t("documents.unknown")}
                                              </span>

                                                {!isPlaceholder && part.revision_changed && (
                                                    <span className="text-[11px] leading-4 text-amber-700 font-medium">
                                                  {t("documents.newRevision")}
                                                </span>
                                                )}

                                                <span className="text-xs text-gray-500 truncate">
                                                {isPlaceholder ? (
                                                    <span className="italic">{t("documents.processing")}</span>
                                                ) : (
                                                    <>
                                                        {part.page !== null ? (
                                                            <>
                                                                {t("documents.page", {page: part.page})}
                                                                {part.company_name && " • "}
                                                            </>
                                                        ) : null}
                                                        {part.company_name ?? (!part.page ? "—" : "")}
                                                    </>
                                                )}
                                              </span>
                                            </div>

                                        </div>
                                    </div>
                                </td>

                                {/* Class */}
                                <td className="px-3 py-3">
                                    <div className="min-w-0">
                                        <div className="text-sm text-gray-700 truncate">
                                            {isPlaceholder ? "-" : part.primary_class || "-"}
                                        </div>

                                        {!isPlaceholder && part.display_name && (
                                            <div className="text-xs text-gray-500 truncate">
                                                {part.display_name}
                                            </div>
                                        )}
                                    </div>
                                </td>


                                {/* Display name */}
                                <td className="px-3 py-3">
                                    <span className="text-sm text-gray-500 truncate block">
                                        {isPlaceholder ? "-" : part.drawing_number|| "-"}
                                    </span>
                                </td>

                                {/* Material */}
                                <td className="px-3 py-3">
                                    <span className="text-sm text-gray-500 truncate block">
                                      {isPlaceholder ? "-" : part.material || "-"}
                                    </span>
                                </td>


                                {/* Complexity */}
                                <td className="px-3 py-3">
                                    {isPlaceholder ? (
                                        <span className="text-sm text-gray-400">-</span>
                                    ) : complexityConfig ? (
                                        <span
                                            className={`inline-flex items-center px-2 py-1 rounded text-xs border ${complexityConfig.className}`}
                                        >
                                            {complexityConfig.label}
                                        </span>
                                    ) : (
                                        <span className="text-sm text-gray-400">-</span>
                                    )}
                                </td>

                                {/* Fit */}
                                <td className="px-3 py-3">
                                    {isPlaceholder ? (
                                        <span className="text-sm text-gray-400">-</span>
                                    ) : fitConfig ? (
                                        <span
                                            className={`inline-flex items-center px-2 py-1 rounded text-xs border ${fitConfig.className}`}
                                        >
                        {fitConfig.label}
                      </span>
                                    ) : (
                                        <span className="text-sm text-gray-400">-</span>
                                    )}
                                </td>

                                {/* Workflow status */}
                                <td className="px-3 py-3">
                                    {isPlaceholder ? (
                                        <span className="text-xs text-gray-400">-</span>
                                    ) : canSetStatus && onChangeWorkflowStatus ? (
                                        <div
                                            className="relative inline-block w-full"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <select
                                                value={statusValue ?? ""}
                                                onChange={(e) =>
                                                    onChangeWorkflowStatus(part, e.target.value as WorkflowStatusEnum)
                                                }
                                                disabled={statusDisabled}
                                                className={`pl-2 pr-7 h-8 w-full rounded-lg text-xs appearance-none bg-clip-padding border ${
                                                    statusDisabled
                                                        ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                                                        : `${getStatusClasses(statusValue)} cursor-pointer`
                                                }`}
                                            >
                                                {!statusValue && <option value="">{t("common.dash")}</option>}
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
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <select
                                                value={priorityValue ?? ""}
                                                onChange={(e) => onChangePriority(part, e.target.value as PriorityEnum)}
                                                disabled={priorityDisabled}
                                                className={`pl-2 pr-7 h-8 w-full rounded-lg text-xs appearance-none bg-clip-padding border ${
                                                    priorityDisabled
                                                        ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                                                        : `${getPriorityClasses(priorityValue)} cursor-pointer`
                                                }`}
                                            >
                                                {!priorityValue && <option value="">{t("common.dash")}</option>}
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
                      {isPlaceholder ? "-" : part.last_updated ? formatDate(part.last_updated) : "-"}
                    </span>
                                </td>

                                {/* Doc processing status */}
                                <td className="px-3 py-3">
                                    <div className="flex justify-center">
                                        <StatusIcon
                                            className={`w-5 h-5 ${statusConfig.iconColor} ${
                                                statusConfig.animate ? "animate-spin" : ""
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
                                                    setOpenMenuId(openMenuId === part.id ? null : part.id);
                                                }}
                                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                <MoreVertical className="w-4 h-4 text-gray-500" strokeWidth={1.5}/>
                                            </button>

                                            {openMenuId === part.id && part.document && (
                                                <div
                                                    className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onRerun(part.document!.id);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                                                    >
                                                        <RefreshCw className="w-4 h-4" strokeWidth={1.5}/>
                                                        {t("common.rerun")}
                                                    </button>

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDownload(part.document);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                                                    >
                                                        <Download className="w-4 h-4" strokeWidth={1.5}/>
                                                        {t("common.download")}
                                                    </button>

                                                    {/* ⬇️ Add to project */}
                                                    {canUseProjects && onAddToProject && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onAddToProject(part);
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                                                        >
                                                            <FolderPlus className="w-4 h-4" strokeWidth={1.5}/>
                                                            {t("common.addToProject")}
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onDelete(part);
                                                            setOpenMenuId(null);
                                                        }}
                                                        className="flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 w-full text-left transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" strokeWidth={1.5}/>
                                                        {t("common.delete")}
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
