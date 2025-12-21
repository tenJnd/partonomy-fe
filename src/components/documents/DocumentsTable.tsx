// src/components/documents/DocumentsTable.tsx
import React from "react";
import {Lock, Star, StarOff} from "lucide-react";
import {useTranslation} from "react-i18next";

import DocumentsDesktopTable from "./DocumentsDesktopTable";
import DocumentsCards from "./DocumentsCards";
import type {DocumentsTableProps} from "./documentsTable.types";
import {PriorityEnum, WorkflowStatusEnum} from "../../lib/database.types";
import {PRIORITY_LABELS, STATUS_LABELS} from "../../utils/tagsFormatting";

const DocumentsTable: React.FC<DocumentsTableProps> = (props) => {
    const {t} = useTranslation();

    const {
        parts,
        loading,
        uploading,
        selectedPartIds,
        onToggleSelect,
        onToggleSelectAll,
        canSetStatus = false,
        canSetPriority = false,
        canUseFavorite = false,
        canUseProjects = false,
        onBulkSetStatus,
        onBulkSetPriority,
        onBulkToggleFavorite,
        onBulkAddToProject,
    } = props;

    const selectionEnabled = !!selectedPartIds && !!onToggleSelect;

    const hasBulkStatus = canSetStatus && !!onBulkSetStatus;
    const hasBulkPriority = canSetPriority && !!onBulkSetPriority;
    const hasBulkFavorite = canUseFavorite && !!onBulkToggleFavorite;
    const hasBulkProjects = canUseProjects && !!onBulkAddToProject;

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

    if (loading) {
        // necháme loading řešit v DesktopTable (máš tam spinner), tady jen wrapper
        return <DocumentsDesktopTable {...props} />;
    }

    if (parts.length === 0 && !uploading) {
        return <DocumentsDesktopTable {...props} />; // máš tam empty state
    }

    return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            {/* 🔥 Bulk bar (společná pro mobile i desktop) */}
            {selectionEnabled && selectedIdsOnPage.length > 0 && (
                <div
                        className="sticky top-0 z-20 flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-slate-50">
                        <div className="flex items-center gap-3">
                            {/* "Select All" Checkbox pro Mobile i Desktop */}
                            {hasBulkActions ? (
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    onChange={() => onToggleSelectAll(partsIdsOnPage)}
                                    checked={
                                        partsIdsOnPage.length > 0 &&
                                        partsIdsOnPage.every((id) => selectedPartIds.has(id))
                                    }
                                />
                            ) : (
                                <Lock className="w-3.5 h-3.5 text-gray-400" strokeWidth={1.5} />
                            )}

                            <span className="text-xs text-gray-700">
                                <span className="font-semibold">{selectedIdsOnPage.length}</span>{" "}
                                {t("documents.bulk.selected")}
                            </span>
                        </div>

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

                        {/* když bulk není povolen, tak checkboxy jsou zamčené – to řeší row renderery */}
                        {!hasBulkActions && (
                            <div className="inline-flex items-center gap-1 text-xs text-gray-400">
                                <Lock className="w-3.5 h-3.5" strokeWidth={1.5}/>
                                {t("documents.bulk.locked")}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Mobile cards */}
            <div className="block md:hidden">
                <DocumentsCards {...props} />
            </div>

            {/* Desktop table */}
            <div className="hidden md:block">
                <DocumentsDesktopTable {...props} />
            </div>
        </div>
    );
};

export default DocumentsTable;
