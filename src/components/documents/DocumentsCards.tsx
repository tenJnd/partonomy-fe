// src/components/documents/DocumentsCards.tsx
import React from "react";
import {Download, FileText, FolderPlus, MoreVertical, RefreshCw, Star, StarOff, Trash2,} from "lucide-react";
import {useTranslation} from "react-i18next";

import type {DocumentsTableProps} from "./documentsTable.types";
import {
    getComplexityConfig,
    getFitConfig,
    getPriorityClasses,
    getStatusClasses,
    getStatusConfig,
    PRIORITY_LABELS,
    STATUS_LABELS,
} from "../../utils/tagsFormatting";
import type {PriorityEnum, WorkflowStatusEnum} from "../../lib/database.types";

const DocumentsCards: React.FC<DocumentsTableProps> = (props) => {
    const {
        parts,
        onRowClick,
        onRerun,
        onDownload,
        onDelete,
        onAddToProject,

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

        selectedPartIds,
        onToggleSelect,
        onToggleSelectAll,
        onBulkSetStatus,
        onBulkSetPriority,
        onBulkToggleFavorite,
        onBulkAddToProject,

        capabilities,
    } = props;

    const {t} = useTranslation();
    const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

    // Capabilities fallback (for safety / backwards compatibility)
    const caps = React.useMemo(() => {
        if (capabilities) return capabilities;

        const selection = !!selectedPartIds && !!onToggleSelect;

        const editStatus = canSetStatus && !!onChangeWorkflowStatus;
        const editPriority = canSetPriority && !!onChangePriority;
        const favorite = canUseFavorite && !!onToggleFavorite;
        const projects = canUseProjects && !!onAddToProject;

        const bulkStatus = canSetStatus && !!onBulkSetStatus;
        const bulkPriority = canSetPriority && !!onBulkSetPriority;
        const bulkFavorite = canUseFavorite && !!onBulkToggleFavorite;
        const bulkProjects = canUseProjects && !!onBulkAddToProject;

        const bulkActions =
            selection &&
            !!onToggleSelectAll &&
            (bulkStatus || bulkPriority || bulkFavorite || bulkProjects);

        return {
            selection,

            editStatus,
            editPriority,
            favorite,
            projects,

            bulkStatus,
            bulkPriority,
            bulkFavorite,
            bulkProjects,

            bulkActions,
        };
    }, [
        capabilities,
        selectedPartIds,
        onToggleSelect,
        onToggleSelectAll,
        canSetStatus,
        canSetPriority,
        canUseFavorite,
        canUseProjects,
        onChangeWorkflowStatus,
        onChangePriority,
        onToggleFavorite,
        onAddToProject,
        onBulkSetStatus,
        onBulkSetPriority,
        onBulkToggleFavorite,
        onBulkAddToProject,
    ]);

    const selectionEnabled = caps.selection;

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

    return (
        <div className="p-3 space-y-2">
            {parts.map((part) => {
                const isPlaceholder = part.isProcessingPlaceholder === true;

                const statusConfig = getStatusConfig(part.document?.last_status || null);
                const StatusIcon = statusConfig.icon;

                const complexityConfig = getComplexityConfig(part.overall_complexity);
                const fitConfig = getFitConfig(part.fit_level);

                const isFavorite = favoritePartIds?.has(part.id) ?? false;

                const statusValue = (part.workflow_status as WorkflowStatusEnum | null) ?? null;
                const priorityValue = (part.priority as PriorityEnum | null) ?? null;

                // ✅ Unified disabled flags (capability-driven)
                const statusDisabled =
                    isPlaceholder || !caps.editStatus || updatingStatusIds?.has(part.id);

                const priorityDisabled =
                    isPlaceholder || !caps.editPriority || updatingPriorityIds?.has(part.id);

                const favoriteDisabled = isPlaceholder || !caps.favorite;

                return (
                    <div
                        key={part.id}
                        className={`rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition ${
                            isPlaceholder ? "bg-blue-50/30" : "active:scale-[0.99]"
                        }`}
                        onClick={() => {
                            if (!isPlaceholder && part.document) onRowClick(part.document.id, part.id);
                        }}
                    >
                        <div className="flex items-start gap-3">
                            {/* checkbox – jen když má bulk smysl */}
                            {selectionEnabled && caps.bulkActions && (
                                <div className="pt-1">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={selectedPartIds?.has(part.id) ?? false}
                                        disabled={part.isProcessingPlaceholder}
                                        onClick={(e) => e.stopPropagation()}
                                        onChange={() => onToggleSelect?.(part.id)}
                                    />
                                </div>
                            )}

                            <div className="min-w-0 flex-1">
                                {/* top row: file + status icon + fav */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0"/>
                                            <div className="text-sm font-semibold text-gray-900 truncate">
                                                {part.document?.file_name || t("documents.unknown")}
                                            </div>
                                        </div>

                                        {!isPlaceholder && part.revision_changed && (
                                            <div className="mt-1 text-[11px] leading-4 text-amber-700 font-medium">
                                                {t("documents.newRevision")}
                                            </div>
                                        )}

                                        <div className="mt-1 text-xs text-gray-500 truncate">
                                            {isPlaceholder ? (
                                                <span className="italic">{t("documents.processing")}</span>
                                            ) : (
                                                <>
                                                    {part.company_name ?? "—"}
                                                    {part.page != null ? ` • ${t("documents.page", {page: part.page})}` : ""}
                                                </>
                                            )}
                                        </div>

                                        {/* modified small */}
                                        {!isPlaceholder && part.last_updated && (
                                            <div className="mt-1 text-[10px] text-gray-400">
                                                {t("documents.columns.modified")}: {formatDate(part.last_updated)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        {/* doc status icon */}
                                        <StatusIcon
                                            className={`w-5 h-5 ${statusConfig.iconColor} ${
                                                statusConfig.animate ? "animate-spin" : ""
                                            }`}
                                            strokeWidth={1.5}
                                        />

                                        {/* favourite */}
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (favoriteDisabled) return;
                                                onToggleFavorite?.(part);
                                            }}
                                            disabled={favoriteDisabled}
                                            className={`inline-flex items-center justify-center w-8 h-8 rounded-full border text-xs transition
                        ${
                                                isFavorite
                                                    ? "bg-amber-50 border-amber-300 text-amber-700"
                                                    : "bg-white border-gray-200 text-gray-400 hover:bg-gray-50"
                                            } ${!caps.favorite ? "opacity-60 cursor-not-allowed" : ""}`}
                                        >
                                            {isFavorite ? (
                                                <Star className="w-4 h-4 fill-current" strokeWidth={1.5}/>
                                            ) : (
                                                <StarOff className="w-4 h-4" strokeWidth={1.5}/>
                                            )}
                                        </button>

                                        {/* actions menu */}
                                        {!isPlaceholder && (
                                            <div className="relative">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(openMenuId === part.id ? null : part.id);
                                                    }}
                                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                >
                                                    <MoreVertical className="w-4 h-4 text-gray-500" strokeWidth={1.5}/>
                                                </button>

                                                {openMenuId === part.id && part.document && (
                                                    <div
                                                        className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onRerun(part.document!.id);
                                                                setOpenMenuId(null);
                                                            }}
                                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
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
                                                            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                                                        >
                                                            <Download className="w-4 h-4" strokeWidth={1.5}/>
                                                            {t("common.download")}
                                                        </button>

                                                        {/* ✅ use caps.projects */}
                                                        {caps.projects && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onAddToProject?.(part);
                                                                    setOpenMenuId(null);
                                                                }}
                                                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
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
                                                            className="flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 w-full text-left"
                                                        >
                                                            <Trash2 className="w-4 h-4" strokeWidth={1.5}/>
                                                            {t("common.delete")}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* meta grid */}
                                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                    <div className="min-w-0">
                                        <div className="text-[10px] uppercase text-gray-400">
                                            {t("documents.columns.class")}
                                        </div>
                                        <div className="text-gray-800 truncate">
                                            {isPlaceholder ? "-" : part.primary_class || "-"}
                                        </div>
                                        {"display_name" in part && (part as any).display_name ? (
                                            <div className="text-gray-500 truncate">{(part as any).display_name}</div>
                                        ) : null}
                                    </div>

                                    <div className="min-w-0">
                                        <div className="text-[10px] uppercase text-gray-400">
                                            {t("documents.columns.material")}
                                        </div>
                                        <div className="text-gray-800 truncate">
                                            {isPlaceholder ? "-" : part.material || "-"}
                                        </div>
                                    </div>

                                    <div className="min-w-0">
                                        <div className="text-[10px] uppercase text-gray-400">
                                            {t("documents.columns.complexity")}
                                        </div>
                                        {isPlaceholder ? (
                                            <div className="text-gray-400">-</div>
                                        ) : complexityConfig ? (
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded text-xs border ${complexityConfig.className}`}
                                            >
                        {complexityConfig.label}
                      </span>
                                        ) : (
                                            <div className="text-gray-400">-</div>
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <div className="text-[10px] uppercase text-gray-400">
                                            {t("documents.columns.fit")}
                                        </div>
                                        {isPlaceholder ? (
                                            <div className="text-gray-400">-</div>
                                        ) : fitConfig ? (
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded text-xs border ${fitConfig.className}`}
                                            >
                        {fitConfig.label}
                      </span>
                                        ) : (
                                            <div className="text-gray-400">-</div>
                                        )}
                                    </div>
                                </div>

                                {/* status / priority controls */}
                                <div className="mt-3 flex items-center gap-2">
                                    {/* workflow */}
                                    <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                                        {isPlaceholder ? (
                                            <div className="text-xs text-gray-400">-</div>
                                        ) : caps.editStatus ? (
                                            <select
                                                value={statusValue ?? ""}
                                                onChange={(e) =>
                                                    onChangeWorkflowStatus?.(part, e.target.value as WorkflowStatusEnum)
                                                }
                                                disabled={statusDisabled}
                                                className={`pl-2 pr-2 h-8 w-full rounded-lg text-xs border ${
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
                                        ) : statusValue ? (
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded text-xs border ${getStatusClasses(
                                                    statusValue
                                                )}`}
                                            >
                        {STATUS_LABELS[statusValue as WorkflowStatusEnum]}
                      </span>
                                        ) : (
                                            <div className="text-xs text-gray-400">-</div>
                                        )}
                                    </div>

                                    {/* priority */}
                                    <div className="flex-1" onClick={(e) => e.stopPropagation()}>
                                        {isPlaceholder ? (
                                            <div className="text-xs text-gray-400">-</div>
                                        ) : caps.editPriority ? (
                                            <select
                                                value={priorityValue ?? ""}
                                                onChange={(e) =>
                                                    onChangePriority?.(part, e.target.value as PriorityEnum)
                                                }
                                                disabled={priorityDisabled}
                                                className={`pl-2 pr-2 h-8 w-full rounded-lg text-xs border ${
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
                                        ) : priorityValue ? (
                                            <span
                                                className={`inline-flex items-center px-2 py-1 rounded text-xs border ${getPriorityClasses(
                                                    priorityValue
                                                )}`}
                                            >
                        {PRIORITY_LABELS[priorityValue as PriorityEnum]}
                      </span>
                                        ) : (
                                            <div className="text-xs text-gray-400">-</div>
                                        )}
                                    </div>
                                </div>

                                {/* Optional: show tiny locks if user can’t edit (pure UX nicety) */}
                                {/*{!isPlaceholder && (!caps.editStatus || !caps.editPriority) && (*/}
                                {/*    <div className="mt-2 flex items-center gap-3 text-[10px] text-gray-400">*/}
                                {/*        {!caps.editStatus && (*/}
                                {/*            <span className="inline-flex items-center gap-1">*/}
                                {/*                <Lock className="w-3 h-3" strokeWidth={1.5}/>*/}
                                {/*                                        {t("documents.columns.workStatus")}*/}
                                {/*              </span>*/}
                                {/*        )}*/}
                                {/*        {!caps.editPriority && (*/}
                                {/*            <span className="inline-flex items-center gap-1">*/}
                                {/*                <Lock className="w-3 h-3" strokeWidth={1.5}/>*/}
                                {/*                                        {t("documents.columns.priority")}*/}
                                {/*              </span>*/}
                                {/*        )}*/}
                                {/*    </div>*/}
                                {/*)}*/}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default DocumentsCards;
