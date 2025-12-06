// src/utils/tagsFormatting.ts
import type {PriorityEnum, ProjectPriorityEnum, ProjectStatusEnum, WorkflowStatusEnum} from "../lib/database.types";
import {AlertCircle, CheckCircle2, FileText, Loader2} from "lucide-react";

export type WorkflowStatusNullable = WorkflowStatusEnum | null;
export type PriorityNullable = PriorityEnum | null;
export type ProjectStatusNullable = ProjectStatusEnum | null;
export type ProjectPriorityNullable = ProjectPriorityEnum | null

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

export const PROJECT_STATUS_LABELS: Record<ProjectStatusEnum, string> = {
    open: "Open",
    in_progress: "In progress",
    archived: "Archived",
    closed: "Closed"
};

export const PROJECT_PRIORITY_LABELS: Record<ProjectPriorityEnum, string> = {
    high: "High",
    normal: "Normal",
    low: "Low",
    hot: "Hot"
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

export const getStatusConfig = (status: string | null) => {
    switch (status) {
        case "success":
            return {
                icon: CheckCircle2,
                label: "Processed",
                className:
                    "bg-emerald-50 text-emerald-700 border-emerald-200",
                iconColor: "text-emerald-600",
            };
        case "processing":
        case "queued":
            return {
                icon: Loader2,
                label: "Processing",
                className: "bg-blue-50 text-blue-700 border-blue-200",
                iconColor: "text-blue-600",
                animate: true,
            };
        case "failed":
        case "error":
            return {
                icon: AlertCircle,
                label: "Error",
                className: "bg-rose-50 text-rose-700 border-rose-200",
                iconColor: "text-rose-600",
            };
        default:
            return {
                icon: FileText,
                label: "Unknown",
                className: "bg-gray-50 text-gray-600 border-gray-200",
                iconColor: "text-gray-500",
            };
    }
};

export const getComplexityConfig = (complexity: string | null) => {
    const val = complexity?.toUpperCase();
    switch (val) {
        case "HIGH":
        case "EXTREME":
            return {
                label: val,
                className:
                    "bg-rose-50 text-rose-800 border-rose-300 font-semibold",
            };
        case "MEDIUM":
            return {
                label: "MEDIUM",
                className:
                    "bg-amber-50 text-amber-800 border-amber-300 font-medium",
            };
        case "LOW":
            return {
                label: "LOW",
                className:
                    "bg-emerald-50 text-emerald-800 border-emerald-300 font-medium",
            };
        default:
            return null;
    }
};

export const getFitConfig = (fit: string | null) => {
    const val = fit?.toUpperCase();
    switch (val) {
        case "GOOD":
            return {
                label: "GOOD",
                className:
                    "bg-emerald-50 text-emerald-800 border-emerald-300 font-medium",
            };
        case "PARTIAL":
            return {
                label: "PARTIAL",
                className:
                    "bg-blue-50 text-blue-800 border-blue-300 font-medium",
            };
        case "COOPERATION":
            return {
                label: "COOP",
                className:
                    "bg-purple-50 text-purple-800 border-purple-300 font-medium",
            };
        case "LOW":
            return {
                label: "LOW",
                className:
                    "bg-amber-50 text-amber-800 border-amber-300 font-medium",
            };
        case "UNKNOWN":
            return {
                label: "UNKNOWN",
                className: "bg-gray-50 text-gray-600 border-gray-300",
            };
        default:
            return null;
    }
};


export const getProjectStatusClasses = (status: ProjectStatusNullable): string | null => {
    switch (status) {
        case "open":
            return "bg-emerald-50 text-emerald-800 border-emerald-200";
        case "in_progress":
            return "bg-blue-50 text-blue-800 border-blue-200";
        case "archived":
            return "bg-gray-50 text-gray-600 border-gray-200";
        case "closed":
            return "bg-slate-50 text-slate-700 border-slate-200";
        default:
            return "bg-gray-50 text-gray-500 border-gray-200";
    }
};


export const getProjectPriorityClasses = (priority: ProjectPriorityNullable): string | null => {
    switch (priority) {
        case "high":
            return "bg-amber-50 text-amber-800 border-amber-200";
        case "normal":
            return "bg-slate-50 text-slate-800 border-slate-200";
        case "low":
            return "bg-gray-50 text-gray-600 border-gray-200";
        case "hot":
            return "bg-rose-50 text-rose-800 border-rose-200";
        default:
            return "bg-gray-50 text-gray-500 border-gray-200";
    }
};


