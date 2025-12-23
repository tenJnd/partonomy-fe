import React from "react";
import {Link} from "react-router-dom";
import {ArrowLeft, ChevronDown, Download} from "lucide-react";
import {PartActionsBar} from "../../../components/PartActionsBar";
import {exportJsonToExcel} from "../../../utils/exportJsonToExcel";
import {exportJsonToText} from "../../../utils/exportJsonToText";
import {exportJson} from "../../../utils/exportJson";
import type {Database, PriorityEnum, WorkflowStatusEnum} from "../../../lib/database.types";

type Document = Database["public"]["Tables"]["documents"]["Row"];
type Part = Database["public"]["Tables"]["parts"]["Row"];

export const DocumentHeader: React.FC<{
    t: any;
    lang: string;
    document: Document;
    partsCount: number;
    backTo: string;

    selectedPart: Part | undefined;
    selectedPartReport: any | undefined;

    canSetFavourite: boolean;
    canSetStatus: boolean;
    canSetPriority: boolean;

    workflowStatus: WorkflowStatusEnum | null;
    priority: PriorityEnum | null;

    detailActions: {
        isFavorite: boolean;
        toggleFavorite: () => Promise<void> | void;
        favoriteLoading: boolean;
        onChangeWorkflowStatus: (v: any) => Promise<void> | void;
        updatingStatus: boolean;
        onChangePriority: (v: any) => Promise<void> | void;
        updatingPriority: boolean;
    };

    isExportMenuOpen: boolean;
    setIsExportMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
}> = (props) => {
    const {
        t,
        // lang,
        document,
        partsCount,
        backTo,
        selectedPart,
        selectedPartReport,
        canSetFavourite,
        canSetStatus,
        canSetPriority,
        workflowStatus,
        priority,
        detailActions,
        isExportMenuOpen,
        setIsExportMenuOpen,
    } = props;

    return (
        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="flex items-start gap-3 min-w-0">
                <Link to={backTo} className="p-2 hover:bg-gray-100 rounded-lg transition-colors group flex-shrink-0">
                    <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:-translate-x-1 transition-transform"
                               strokeWidth={2}/>
                </Link>

                <div className="min-w-0">
                    <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{document.file_name}</h1>
                    <p className="text-sm text-gray-600">{t("documents.detail.partsDetected", {count: partsCount})}</p>
                </div>
            </div>

            <div className="w-full sm:w-auto">
                <div className="flex flex-wrap items-end gap-2 sm:gap-4 justify-start sm:justify-end">
                    {selectedPart && (
                        <PartActionsBar
                            partId={selectedPart.id}
                            canUseFavorite={canSetFavourite}
                            canSetStatus={canSetStatus}
                            canSetPriority={canSetPriority}
                            isFavorite={detailActions.isFavorite}
                            onToggleFavorite={detailActions.toggleFavorite}
                            favoriteLoading={detailActions.favoriteLoading}
                            workflowStatus={workflowStatus}
                            onChangeWorkflowStatus={detailActions.onChangeWorkflowStatus}
                            updatingStatus={detailActions.updatingStatus}
                            priority={priority}
                            onChangePriority={detailActions.onChangePriority}
                            updatingPriority={detailActions.updatingPriority}
                        />
                    )}

                    {selectedPartReport && (
                        <div className="relative flex-shrink-0">
                            <button
                                type="button"
                                onClick={() => setIsExportMenuOpen((prev) => !prev)}
                                className="inline-flex items-center gap-2 px-3 sm:px-4 h-9 text-sm font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm transition-colors"
                            >
                                <Download className="w-4 h-4" strokeWidth={2}/>
                                <span className="hidden sm:inline">{t("documents.detail.export")}</span>
                                <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                            </button>

                            {isExportMenuOpen && (
                                <div
                                    className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            exportJsonToExcel(selectedPartReport, selectedPart?.part_number || selectedPart?.display_name || "part_report");
                                            setIsExportMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                    >
                                        {t("documents.detail.exportToXlsx")}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            exportJsonToText(selectedPartReport, selectedPart?.part_number || selectedPart?.display_name || "part_report");
                                            setIsExportMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                    >
                                        {t("documents.detail.exportToTxt")}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            exportJson(selectedPartReport, selectedPart?.part_number || selectedPart?.display_name || "part_report");
                                            setIsExportMenuOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                    >
                                        {t("documents.detail.exportToJson")}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
