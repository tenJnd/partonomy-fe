import React from "react";
import {Maximize2, RotateCw, ZoomIn, ZoomOut} from "lucide-react";
import type {Database} from "../../../lib/database.types";

type Part = Database["public"]["Tables"]["parts"]["Row"];

export const RenderHeader = React.memo(function RenderHeader(props: {
    t: any;
    selectedPart: Part | undefined;
    partRenderUrl: string | null;
    zoom: number;
    onZoomOut: () => void;
    onZoomIn: () => void;
    onReset: () => void;
    onFullscreen: () => void;
}) {
    const {t, selectedPart, partRenderUrl, zoom, onZoomOut, onZoomIn, onReset, onFullscreen} = props;

    if (!selectedPart?.report_json && !partRenderUrl) return null;

    const reportJson = (selectedPart?.report_json as any) || {};
    const overview = reportJson.overview;
    const drawingInfo = reportJson.drawing_info;

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
                {(overview?.part_type || drawingInfo?.part_type_desc) && (
                    <div className="text-gray-900 font-semibold leading-snug truncate">
                        {overview?.part_type || drawingInfo?.part_type_desc}
                    </div>
                )}
                {overview?.taxonomy?.application_hint && (
                    <div className="text-gray-500 text-xs mt-0.5">{overview.taxonomy.application_hint}</div>
                )}
            </div>

            {partRenderUrl && (
                <div
                    className="flex items-center justify-between sm:justify-end gap-2 bg-slate-50 rounded-lg p-1.5 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onZoomOut}
                            disabled={zoom <= 25}
                            className="p-2 bg-white hover:bg-gray-100 disabled:bg-slate-50 disabled:text-gray-300 rounded-md transition-colors shadow-sm"
                            title={t("documents.detail.actions.zoomOut")}
                        >
                            <ZoomOut className="w-4 h-4" strokeWidth={2}/>
                        </button>

                        <span className="text-sm font-medium text-gray-700 min-w-[4rem] text-center">{zoom}%</span>

                        <button
                            onClick={onZoomIn}
                            disabled={zoom >= 300}
                            className="p-2 bg-white hover:bg-gray-100 disabled:bg-slate-50 disabled:text-gray-300 rounded-md transition-colors shadow-sm"
                            title={t("documents.detail.actions.zoomIn")}
                        >
                            <ZoomIn className="w-4 h-4" strokeWidth={2}/>
                        </button>

                        <button
                            onClick={onReset}
                            className="p-2 bg-white hover:bg-gray-100 rounded-md transition-colors shadow-sm"
                            title={t("documents.detail.actions.resetZoom")}
                        >
                            <RotateCw className="w-4 h-4" strokeWidth={2}/>
                        </button>
                    </div>

                    <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block"/>

                    <button
                        onClick={onFullscreen}
                        className="p-2 bg-white hover:bg-gray-100 rounded-md transition-colors shadow-sm flex-shrink-0"
                        title={t("documents.detail.actions.fullscreen")}
                    >
                        <Maximize2 className="w-4 h-4" strokeWidth={2}/>
                    </button>
                </div>
            )}
        </div>
    );
});
