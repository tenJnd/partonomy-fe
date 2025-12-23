import React from "react";
import {ChevronLeft, ChevronRight} from "lucide-react";
import type {Database} from "../../../lib/database.types";

type Part = Database["public"]["Tables"]["parts"]["Row"];

export const PartNavigation: React.FC<{
    t: any;
    parts: Part[];
    selectedPart: Part | undefined;
    currentPartIndex: number;
    hasPrevPart: boolean;
    hasNextPart: boolean;
    onPrev: () => void;
    onNext: () => void;
}> = ({t, parts, selectedPart, currentPartIndex, hasPrevPart, hasNextPart, onPrev, onNext}) => {
    if (parts.length === 0 || !selectedPart) return null;

    return (
        <div className="mb-4 flex justify-center">
            <div className="flex items-center gap-3 text-sm text-gray-700">
                <button
                    type="button"
                    onClick={onPrev}
                    disabled={!hasPrevPart}
                    className="p-1 disabled:opacity-30 hover:text-gray-800 transition"
                    title={t("documents.detail.actions.previousPart")}
                >
                    <ChevronLeft className="w-4 h-4" strokeWidth={2}/>
                </button>

                <span className="font-medium text-gray-900 truncate max-w-[16rem] sm:max-w-none">
          {selectedPart.display_name || selectedPart.part_number || t("documents.detail.part")}
        </span>

                <button
                    type="button"
                    onClick={onNext}
                    disabled={!hasNextPart}
                    className="p-1 disabled:opacity-30 hover:text-gray-800 transition"
                    title={t("documents.detail.actions.nextPart")}
                >
                    <ChevronRight className="w-4 h-4" strokeWidth={2}/>
                </button>

                <span className="text-xs text-gray-500 ml-1">
          {currentPartIndex + 1} / {parts.length}
        </span>
            </div>
        </div>
    );
};
