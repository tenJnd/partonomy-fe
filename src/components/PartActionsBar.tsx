// src/components/PartActionsBar.tsx
import React from "react";
import {Lock, Star, StarOff} from "lucide-react";
import type {PriorityEnum, WorkflowStatusEnum} from "../lib/database.types";

type WorkflowStatus = WorkflowStatusEnum | null;
type Priority = PriorityEnum | null;

interface PartActionsBarProps {
    partId: string | null;
    // feature flags z billing
    canUseFavorite: boolean;
    canSetStatus: boolean;
    canSetPriority: boolean;

    // favourite
    isFavorite: boolean;
    onToggleFavorite: () => void | Promise<void>;
    favoriteLoading?: boolean;

    // status
    workflowStatus: WorkflowStatus;
    onChangeWorkflowStatus: (value: WorkflowStatusEnum) => void;
    updatingStatus?: boolean;

    // priority
    priority: Priority;
    onChangePriority: (value: PriorityEnum) => void;
    updatingPriority?: boolean;
}

const STATUS_LABELS: Record<WorkflowStatusEnum, string> = {
    new: "New",
    in_progress: "In progress",
    done: "Done",
    ignored: "Ignored",
};

const PRIORITY_LABELS: Record<PriorityEnum, string> = {
    low: "Low",
    normal: "Normal",
    high: "High",
    hot: "Hot",
};

export const PartActionsBar: React.FC<PartActionsBarProps> = ({
                                                                  partId,
                                                                  canUseFavorite,
                                                                  canSetStatus,
                                                                  canSetPriority,
                                                                  isFavorite,
                                                                  onToggleFavorite,
                                                                  favoriteLoading,
                                                                  workflowStatus,
                                                                  onChangeWorkflowStatus,
                                                                  updatingStatus,
                                                                  priority,
                                                                  onChangePriority,
                                                                  updatingPriority,
                                                              }) => {
    const statusDisabled = !partId || !canSetStatus || updatingStatus;
    const priorityDisabled = !partId || !canSetPriority || updatingPriority;
    const favoriteDisabled = !partId || !canUseFavorite || favoriteLoading;

    return (
        <div className="flex items-center gap-3">
            {/* Favourite */}
            <button
                type="button"
                onClick={() => {
                    if (favoriteDisabled) return;
                    onToggleFavorite();
                }}
                disabled={favoriteDisabled}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border transition
          ${
                    isFavorite
                        ? "bg-amber-50 border-amber-300 text-amber-800"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }
          ${!canUseFavorite ? "opacity-60 cursor-not-allowed" : ""}
        `}
                title={
                    canUseFavorite
                        ? isFavorite
                            ? "Remove from favourites"
                            : "Add to favourites"
                        : "Available on higher plans"
                }
            >
                {isFavorite ? (
                    <Star className="w-3.5 h-3.5 fill-current" strokeWidth={1.5}/>
                ) : (
                    <StarOff className="w-3.5 h-3.5" strokeWidth={1.5}/>
                )}
                <span>{isFavorite ? "Favourite" : "Favourite"}</span>
                {!canUseFavorite && (
                    <Lock className="w-3 h-3 ml-0.5 text-gray-400" strokeWidth={1.5}/>
                )}
            </button>

            {/* Status */}
            <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-500">Status</span>
                <div className="relative">
                    <select
                        value={workflowStatus ?? ""}
                        onChange={(e) =>
                            onChangeWorkflowStatus(e.target.value as WorkflowStatusEnum)
                        }
                        disabled={statusDisabled}
                        className={`pl-2 pr-6 py-1 rounded-lg border text-xs bg-white appearance-none
              ${
                            statusDisabled
                                ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                                : "text-gray-800 border-gray-200 hover:border-gray-300"
                        }
            `}
                    >
                        {/* fallback když je null */}
                        {!workflowStatus && <option value="">—</option>}
                        {Object.entries(STATUS_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                    {!canSetStatus && (
                        <Lock
                            className="w-3 h-3 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
                            strokeWidth={1.5}
                        />
                    )}
                </div>
            </div>

            {/* Priority */}
            <div className="flex items-center gap-1 text-xs">
                <span className="text-gray-500">Priority</span>
                <div className="relative">
                    <select
                        value={priority ?? ""}
                        onChange={(e) =>
                            onChangePriority(e.target.value as PriorityEnum)
                        }
                        disabled={priorityDisabled}
                        className={`pl-2 pr-6 py-1 rounded-lg border text-xs bg-white appearance-none
              ${
                            priorityDisabled
                                ? "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                                : "text-gray-800 border-gray-200 hover:border-gray-300"
                        }
            `}
                    >
                        {!priority && <option value="">—</option>}
                        {Object.entries(PRIORITY_LABELS).map(([value, label]) => (
                            <option key={value} value={value}>
                                {label}
                            </option>
                        ))}
                    </select>
                    {!canSetPriority && (
                        <Lock
                            className="w-3 h-3 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
                            strokeWidth={1.5}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
