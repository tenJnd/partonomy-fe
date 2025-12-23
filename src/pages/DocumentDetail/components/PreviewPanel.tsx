import React from "react";
import type {Database} from "../../../lib/database.types";
import {RenderHeader} from "./RenderHeader";
import {RenderCanvas} from "./RenderCanvas";
import {ExtraInfoBlocks} from "./ExtraInfoBlocks";

type Part = Database["public"]["Tables"]["parts"]["Row"];

export const PreviewPanel: React.FC<{
    t: any;

    mobileMainTab: "preview" | "details";

    selectedPart: Part | undefined;
    selectedPartReport: any | undefined;

    // render
    partRenderUrl: string | null;
    imageLoading: boolean;
    imageAspectRatio: number | null;
    selectedPartId: string | null;

    // zoom/pan
    zoom: number;
    isDragging: boolean;
    position: { x: number; y: number };
    onZoomOut: () => void;
    onZoomIn: () => void;
    onReset: () => void;
    onFullscreen: () => void;

    // refs
    normalContainerRef: React.RefObject<HTMLDivElement>;
    imageRef: React.RefObject<HTMLImageElement>;

    // handlers
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
    onWheel: (e: React.WheelEvent) => void;
}> = ({
          t,
          mobileMainTab,
          selectedPart,
          selectedPartReport,
          partRenderUrl,
          imageLoading,
          imageAspectRatio,
          selectedPartId,
          zoom,
          isDragging,
          position,
          onZoomOut,
          onZoomIn,
          onReset,
          onFullscreen,
          normalContainerRef,
          imageRef,
          onMouseDown,
          onMouseMove,
          onMouseUp,
          onMouseLeave,
          onWheel,
      }) => {
    return (
        <div
            className={`bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6 xl:col-span-3 min-h-0 ${
                mobileMainTab === "details" ? "hidden xl:block" : ""
            }`}
        >
            <div className="mb-4">
                <RenderHeader
                    t={t}
                    selectedPart={selectedPart}
                    partRenderUrl={partRenderUrl}
                    zoom={zoom}
                    onZoomOut={onZoomOut}
                    onZoomIn={onZoomIn}
                    onReset={onReset}
                    onFullscreen={onFullscreen}
                />
            </div>

            <RenderCanvas
                t={t}
                normalContainerRef={normalContainerRef}
                imageRef={imageRef}
                imageLoading={imageLoading}
                partRenderUrl={partRenderUrl}
                selectedPartId={selectedPartId}
                imageAspectRatio={imageAspectRatio}
                zoom={zoom}
                isDragging={isDragging}
                position={position}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
                onWheel={onWheel}
            />

            <ExtraInfoBlocks t={t} selectedPartReport={selectedPartReport}/>
        </div>
    );
};
