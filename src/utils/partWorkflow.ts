// src/utils/partWorkflow.ts
import type {PriorityEnum, WorkflowStatusEnum,} from "../lib/database.types";

export type WorkflowStatusNullable = WorkflowStatusEnum | null;
export type PriorityNullable = PriorityEnum | null;

export const STATUS_LABELS: Record<WorkflowStatusEnum, string> = {
    new: "New",
    in_progress: "In progress",
    done: "Done",
    ignored: "Ignored",
};

export const PRIORITY_LABELS: Record<PriorityEnum, string> = {
    low: "Low",
    normal: "Normal",
    high: "High",
    hot: "Hot",
};

export const getStatusClasses = (status: WorkflowStatusNullable): string => {
    switch (status) {
        case "new":
            return "bg-sky-50 border-sky-200 text-sky-800";
        case "in_progress":
            return "bg-amber-50 border-amber-200 text-amber-800";
        case "done":
            return "bg-emerald-50 border-emerald-200 text-emerald-800";
        case "ignored":
            return "bg-slate-50 border-slate-200 text-slate-600";
        default:
            return "bg-white border-gray-200 text-gray-800";
    }
};

export const getPriorityClasses = (priority: PriorityNullable): string => {
    switch (priority) {
        case "low":
            return "bg-slate-50 border-slate-200 text-slate-700";
        case "normal":
            return "bg-white border-gray-200 text-gray-800";
        case "high":
            return "bg-orange-50 border-orange-200 text-orange-800";
        case "hot":
            return "bg-rose-50 border-rose-200 text-rose-800";
        default:
            return "bg-white border-gray-200 text-gray-800";
    }
};
