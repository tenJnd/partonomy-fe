// src/components/projects/ProjectsCards.tsx
import React from "react";
import {CalendarClock, Edit3, FolderKanban, MoreVertical, Trash2} from "lucide-react";
import {useTranslation} from "react-i18next";

import type {ProjectRow, ProjectsTableProps} from "./projectsTable.types";
import {
    getProjectPriorityClasses,
    getProjectStatusClasses,
    PROJECT_PRIORITY_LABELS,
    PROJECT_STATUS_LABELS,
} from "../../utils/tagsFormatting";

const ProjectsCards: React.FC<ProjectsTableProps> = ({
                                                         projects,
                                                         loading,
                                                         onRowClick,
                                                         onEdit,
                                                         onDelete,
                                                     }) => {
    const {t} = useTranslation();
    const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        }).format(date);
    };

    const renderStatusBadge = (status: ProjectRow["status"]) => (
        <span
            className={`inline-flex items-center px-2 py-1 rounded text-xs border ${getProjectStatusClasses(status)}`}
        >
      {PROJECT_STATUS_LABELS[status] ?? status}
    </span>
    );

    const renderPriorityBadge = (priority: ProjectRow["priority"]) => (
        <span
            className={`inline-flex items-center px-2 py-1 rounded text-xs border ${getProjectPriorityClasses(priority)}`}
        >
      {PROJECT_PRIORITY_LABELS[priority] ?? priority}
    </span>
    );

    if (loading && projects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"/>
                <p className="text-sm font-medium text-slate-600">{t("projects.loadingProjects")}</p>
            </div>
        );
    }

    if (!loading && projects.length === 0) {
        return (
            <div
                className="flex flex-col items-center justify-center py-16 bg-white rounded-lg border-2 border-dashed border-gray-300">
                <FolderKanban className="w-16 h-16 text-gray-300 mb-4" strokeWidth={1.5}/>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("projects.noProjectsYet")}</h3>
                <p className="text-sm text-gray-600">{t("projects.noProjectsYetDescription")}</p>
            </div>
        );
    }

    return (
        <div className="p-3 space-y-2">
            {projects.map((project) => (
                <div
                    key={project.id}
                    className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition active:scale-[0.99]"
                    onClick={() => onRowClick(project.id as string)}
                >
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <div className="flex items-start gap-2 min-w-0">
                                <FolderKanban className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5"/>
                                <div className="min-w-0 flex-1">
                                    <div className="text-sm font-semibold text-gray-900 truncate">{project.name}</div>
                                    {project.description && (
                                        <div
                                            className="mt-0.5 text-xs text-gray-500 truncate">{project.description}</div>
                                    )}
                                    <div className="mt-1 text-xs text-gray-500 truncate">
                                        {project.customer_name || "—"}
                                        {project.external_ref ? ` • ${project.external_ref}` : ""}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* actions */}
                        <div className="relative flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                                type="button"
                                onClick={() =>
                                    setOpenMenuId(openMenuId === (project.id as string) ? null : (project.id as string))
                                }
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <MoreVertical className="w-4 h-4 text-gray-500" strokeWidth={1.5}/>
                            </button>

                            {openMenuId === project.id && (
                                <div
                                    className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                    <button
                                        onClick={() => {
                                            onEdit(project);
                                            setOpenMenuId(null);
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left"
                                    >
                                        <Edit3 className="w-4 h-4" strokeWidth={1.5}/>
                                        {t("common.edit")}
                                    </button>

                                    <button
                                        onClick={() => {
                                            onDelete(project);
                                            setOpenMenuId(null);
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 w-full text-left"
                                    >
                                        <Trash2 className="w-4 h-4" strokeWidth={1.5}/>
                                        {t("common.delete")}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* badges + dates */}
                    <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                            {renderStatusBadge(project.status)}
                            {renderPriorityBadge(project.priority)}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1">
                <CalendarClock className="w-3.5 h-3.5" strokeWidth={1.5}/>
                  {formatDate(project.due_date)}
              </span>
                        </div>
                    </div>

                    <div className="mt-2 text-[10px] text-gray-400">
                        {t("projects.columns.created")}: {formatDate(project.created_at)}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ProjectsCards;
