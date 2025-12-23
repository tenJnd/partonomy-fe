import React from "react";
import {Minimize2, RotateCw, ZoomIn, ZoomOut} from "lucide-react";
import type {Database} from "../../../lib/database.types";

type Part = Database["public"]["Tables"]["parts"]["Row"];

export const FullscreenModal = React.memo(function FullscreenModal(props: {
    t: any;
    isFullscreen: boolean;
    selectedPart: Part | undefined;
    partRenderUrl: string | null;
    zoom: number;
    isDragging: boolean;
    position: { x: number; y: number };
    imageRef: React.RefObject<HTMLImageElement>;
    fullscreenContainerRef: React.RefObject<HTMLDivElement>;
    onExit: () => void;
    onZoomOut: () => void;
    onZoomIn: () => void;
    onReset: () => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
    onWheel: (e: React.WheelEvent) => void;
}) {
    const {
        t,
        isFullscreen,
        selectedPart,
        partRenderUrl,
        zoom,
        isDragging,
        position,
        imageRef,
        fullscreenContainerRef,
        onExit,
        onZoomOut,
        onZoomIn,
        onReset,
        onMouseDown,
        onMouseMove,
        onMouseUp,
        onMouseLeave,
        onWheel,
    } = props;

    if (!isFullscreen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-black/50 gap-3">
                <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold text-white truncate">
                        {selectedPart?.display_name || selectedPart?.part_number || t("documents.detail.partRenderTitle")}
                    </h2>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={onExit}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        title={t("documents.detail.actions.exitFullscreen")}
                    >
                        <Minimize2 className="w-5 h-5" strokeWidth={1.5}/>
                    </button>

                    <div className="hidden sm:flex items-center gap-2">
                        <button
                            onClick={onZoomOut}
                            disabled={zoom <= 25}
                            className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded-lg transition-colors"
                            title={t("documents.detail.actions.zoomOut")}
                        >
                            <ZoomOut className="w-5 h-5" strokeWidth={1.5}/>
                        </button>

                        <span className="text-sm text-white min-w-[4rem] text-center">{zoom}%</span>

                        <button
                            onClick={onZoomIn}
                            disabled={zoom >= 500}
                            className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded-lg transition-colors"
                            title={t("documents.detail.actions.zoomIn")}
                        >
                            <ZoomIn className="w-5 h-5" strokeWidth={1.5}/>
                        </button>

                        <button
                            onClick={onReset}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                            title={t("documents.detail.actions.resetZoom")}
                        >
                            <RotateCw className="w-5 h-5" strokeWidth={1.5}/>
                        </button>
                    </div>
                </div>
            </div>

            <div
                ref={fullscreenContainerRef}
                className="flex-1 overflow-auto"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
                onWheel={onWheel}
                style={{cursor: zoom > 100 ? (isDragging ? "grabbing" : "grab") : "default"}}
            >
                {partRenderUrl ? (
                    <div className="w-full h-full flex items-center justify-center p-4 sm:p-8">
                        <img
                            ref={imageRef}
                            src={partRenderUrl}
                            alt={t("documents.detail.alts.partRender")}
                            style={{
                                maxWidth: "100%",
                                maxHeight: "100%",
                                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom / 100})`,
                                transformOrigin: "center center",
                                pointerEvents: "none",
                            }}
                            className="transition-transform duration-100"
                            draggable={false}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                        <p>{t("documents.detail.noRenderAvailable")}</p>
                    </div>
                )}
            </div>
        </div>
    );
});
