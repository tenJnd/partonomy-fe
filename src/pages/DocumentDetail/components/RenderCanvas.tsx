import React from "react";
import {AlertCircle, Loader} from "lucide-react";

export const RenderCanvas = React.memo(function RenderCanvas(props: {
    t: any;
    normalContainerRef: React.RefObject<HTMLDivElement>;
    imageRef: React.RefObject<HTMLImageElement>;
    imageLoading: boolean;
    partRenderUrl: string | null;
    selectedPartId: string | null;
    imageAspectRatio: number | null;
    zoom: number;
    isDragging: boolean;
    position: { x: number; y: number };
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
    onWheel: (e: React.WheelEvent) => void;
}) {
    const {
        t,
        normalContainerRef,
        imageRef,
        imageLoading,
        partRenderUrl,
        selectedPartId,
        imageAspectRatio,
        zoom,
        isDragging,
        position,
        onMouseDown,
        onMouseMove,
        onMouseUp,
        onMouseLeave,
        onWheel,
    } = props;

    const fallbackAR = 4 / 3;
    const ar = imageAspectRatio && imageAspectRatio > 0 ? imageAspectRatio : fallbackAR;

    return (
        <div
            ref={normalContainerRef}
            className="border border-gray-200 rounded-lg overflow-auto bg-gray-50 relative select-none w-full"
            style={{
                aspectRatio: String(ar),
                maxHeight: "75vh",
                cursor: zoom > 100 ? (isDragging ? "grabbing" : "grab") : "default",
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onWheel={onWheel}
        >
            {imageLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader className="w-8 h-8 text-gray-400 animate-spin" strokeWidth={1.5}/>
                </div>
            ) : partRenderUrl ? (
                <div className="w-full h-full flex items-center justify-center p-3 sm:p-4">
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
            ) : selectedPartId ? (
                <div className="absolute inset-0 flex items-center justify-center text-center text-gray-500">
                    <div className="px-6">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" strokeWidth={1.5}/>
                        <p className="text-sm">{t("documents.detail.noRenderForPart")}</p>
                    </div>
                </div>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-center text-gray-500">
                    <p className="text-sm">{t("documents.detail.selectPartToView")}</p>
                </div>
            )}
        </div>
    );
});
