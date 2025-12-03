// src/components/PartActionsBar.tsx
import React from "react";
import {ChevronDown, Lock, Star, StarOff} from "lucide-react";
import type {PriorityEnum, WorkflowStatusEnum} from "../lib/database.types";
import {getPriorityClasses, getStatusClasses, PRIORITY_LABELS, STATUS_LABELS,} from "../utils/partWorkflow";

type WorkflowStatus = WorkflowStatusEnum | null;
type Priority = PriorityEnum | null;

interface PartActionsBarProps {
    partId: string | null;
    canUseFavorite: boolean;
    canSetStatus: boolean;
    canSetPriority: boolean;
    isFavorite: boolean;
    onToggleFavorite: () => void | Promise<void>;
    favoriteLoading?: boolean;
    workflowStatus: WorkflowStatus;
    onChangeWorkflowStatus: (value: WorkflowStatusEnum) => void | Promise<void>;
    updatingStatus?: boolean;
    priority: Priority;
    onChangePriority: (value: PriorityEnum) => void | Promise<void>;
    updatingPriority?: boolean;
}

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

    const statusColorClasses = getStatusClasses(workflowStatus);
    const priorityColorClasses = getPriorityClasses(priority);

    return (
        <div className="flex items-end gap-4">
            {/* Favourite */}
            <button
                type="button"
                onClick={() => {
                    if (favoriteDisabled) return;
                    onToggleFavorite();
                }}
                disabled={favoriteDisabled}
                className={`inline-flex items-center gap-1.5 px-3 h-9 text-xs rounded-lg border transition
          ${
                    isFavorite
                        ? "bg-amber-50 border-amber-300 text-amber-800"
                        : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }
          ${!canUseFavorite ? "opacity-60 cursor-not-allowed" : ""}
        `}
            >
                {isFavorite ? (
                    <Star className="w-3.5 h-3.5 fill-current" strokeWidth={1.5}/>
                ) : (
                    <StarOff className="w-3.5 h-3.5" strokeWidth={1.5}/>
                )}
                <span>Favourite</span>
                {!canUseFavorite && (
                    <Lock className="w-3 h-3 ml-0.5 text-gray-400" strokeWidth={1.5}/>
                )}
            </button>

            {/* Status */}
            <div className="flex flex-col gap-1 text-xs items-center">
  <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
          Status
        </span>

                <div className="relative">
                    <select
                        value={workflowStatus ?? ""}
                        onChange={(e) =>
                            onChangeWorkflowStatus(e.target.value as WorkflowStatusEnum)
                        }
                        disabled={statusDisabled}
                        className={`pl-2 pr-7 h-9 rounded-lg text-xs appearance-none bg-clip-padding border
              ${
                            statusDisabled
                                ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                                : `${statusColorClasses} cursor-pointer`
                        }
            `}
                    >
                        {!workflowStatus && <option value="">—</option>}
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

                    {!canSetStatus && (
                        <Lock
                            className="w-3 h-3 text-gray-400 absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none"
                            strokeWidth={1.5}
                        />
                    )}
                </div>
            </div>

            {/* Priority */}
            <div className="flex flex-col gap-1 text-xs items-center">
                  <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
                          Priority
                  </span>

                <div className="relative">
                    <select
                        value={priority ?? ""}
                        onChange={(e) => onChangePriority(e.target.value as PriorityEnum)}
                        disabled={priorityDisabled}
                        className={`pl-2 pr-7 h-9 rounded-lg text-xs appearance-none bg-clip-padding border
                        ${
                            priorityDisabled
                                ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
                                : `${priorityColorClasses} cursor-pointer`
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

                    <ChevronDown
                        className="w-3.5 h-3.5 text-gray-400 absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none"
                        strokeWidth={1.5}
                    />

                    {!canSetPriority && (
                        <Lock
                            className="w-3 h-3 text-gray-400 absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none"
                            strokeWidth={1.5}
                        />
                    )}
                </div>
            </div>
        </div>
    );
};
