// src/components/projects/ProjectsDesktopTable.tsx
import React from "react";
import {CalendarClock, ChevronDown, ChevronUp, Edit3, FolderKanban, MoreVertical, Trash2,} from "lucide-react";
import {useTranslation} from "react-i18next";

import type {ProjectRow, ProjectSortField, ProjectsTableProps} from "./projectsTable.types";
import {
    getProjectPriorityClasses,
    getProjectStatusClasses,
    PROJECT_PRIORITY_LABELS,
    PROJECT_STATUS_LABELS,
} from "../../utils/tagsFormatting";

const ProjectsDesktopTable: React.FC<ProjectsTableProps> = ({
                                                                projects,
                                                                loading,
                                                                sortField,
                                                                sortDirection,
                                                                onSortChange,
                                                                onRowClick,
                                                                onEdit,
                                                                onDelete,
                                                            }) => {
    const {t} = useTranslation();
    const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);

    const SortableHeader: React.FC<{
        field: ProjectSortField;
        children: React.ReactNode;
        className?: string;
    }> = ({field, children, className = ""}) => {
        const isActive = sortField === field;

        return (
            <th
                onClick={() => onSortChange(field)}
                className={`px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider cursor-pointer hover:bg-slate-50 transition-colors select-none ${className}`}
            >
                <div className="flex items-center gap-1.5">
                    {children}
                    {isActive ? (
                        sortDirection === "asc" ? (
                            <ChevronUp className="w-4 h-4 text-blue-600" strokeWidth={2}/>
                        ) : (
                            <ChevronDown className="w-4 h-4 text-blue-600" strokeWidth={2}/>
                        )
                    ) : (
                        <div className="w-4 h-4 opacity-0 group-hover:opacity-30">
                            <ChevronDown className="w-4 h-4" strokeWidth={2}/>
                        </div>
                    )}
                </div>
            </th>
        );
    };

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
            className={`inline-flex items-center px-2 py-1 rounded text-xs border ${getProjectStatusClasses(
                status
            )}`}
        >
      {PROJECT_STATUS_LABELS[status] ?? status}
    </span>
    );

    const renderPriorityBadge = (priority: ProjectRow["priority"]) => (
        <span
            className={`inline-flex items-center px-2 py-1 rounded text-xs border ${getProjectPriorityClasses(
                priority
            )}`}
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
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full table-fixed">
                    <colgroup>
                        <col style={{width: "22%"}}/>
                        <col style={{width: "18%"}}/>
                        <col style={{width: "16%"}}/>
                        <col style={{width: "12%"}}/>
                        <col style={{width: "12%"}}/>
                        <col style={{width: "12%"}}/>
                        <col style={{width: "12%"}}/>
                        <col style={{width: "48px"}}/>
                    </colgroup>

                    <thead className="bg-slate-50 border-b border-gray-200">
                    <tr>
                        <SortableHeader field="name">{t("projects.columns.project")}</SortableHeader>
                        <SortableHeader field="customer_name">{t("projects.columns.customer")}</SortableHeader>
                        <SortableHeader field="external_ref">{t("projects.columns.reference")}</SortableHeader>
                        <SortableHeader field="status">{t("projects.columns.status")}</SortableHeader>
                        <SortableHeader field="priority">{t("projects.columns.priority")}</SortableHeader>
                        <SortableHeader field="due_date">
                <span className="inline-flex items-center gap-1">
                  <CalendarClock className="w-3 h-3"/>
                    {t("projects.columns.due")}
                </span>
                        </SortableHeader>
                        <SortableHeader field="created_at">{t("projects.columns.created")}</SortableHeader>
                        <th className="px-3 py-3"/>
                    </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                    {projects.map((project) => (
                        <tr
                            key={project.id}
                            onClick={() => onRowClick(project.id as string)}
                            className="cursor-pointer hover:bg-blue-50/50 transition-colors"
                        >
                            <td className="px-3 py-3">
                                <div className="flex items-center gap-2">
                                    <FolderKanban className="w-4 h-4 text-blue-500 flex-shrink-0"/>
                                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {project.name}
                      </span>
                                        {project.description && (
                                            <span
                                                className="text-xs text-gray-500 truncate">{project.description}</span>
                                        )}
                                    </div>
                                </div>
                            </td>

                            <td className="px-3 py-3">
                                <span
                                    className="text-sm text-gray-700 truncate block">{project.customer_name || "-"}</span>
                            </td>

                            <td className="px-3 py-3">
                                <span
                                    className="text-xs text-gray-500 truncate block">{project.external_ref || "-"}</span>
                            </td>

                            <td className="px-3 py-3">{renderStatusBadge(project.status)}</td>
                            <td className="px-3 py-3">{renderPriorityBadge(project.priority)}</td>

                            <td className="px-3 py-3">
                                <span className="text-xs text-gray-500">{formatDate(project.due_date)}</span>
                            </td>

                            <td className="px-3 py-3">
                                <span className="text-xs text-gray-500">{formatDate(project.created_at)}</span>
                            </td>

                            <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                                <div className="relative">
                                    <button
                                        onClick={() =>
                                            setOpenMenuId(openMenuId === (project.id as string) ? null : (project.id as string))
                                        }
                                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <MoreVertical className="w-4 h-4 text-gray-500" strokeWidth={1.5}/>
                                    </button>

                                    {openMenuId === project.id && (
                                        <div
                                            className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                                            <button
                                                onClick={() => {
                                                    onEdit(project);
                                                    setOpenMenuId(null);
                                                }}
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full text-left transition-colors"
                                            >
                                                <Edit3 className="w-4 h-4" strokeWidth={1.5}/>
                                                {t("common.edit")}
                                            </button>

                                            <button
                                                onClick={() => {
                                                    onDelete(project);
                                                    setOpenMenuId(null);
                                                }}
                                                className="flex items-center gap-2 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 w-full text-left transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" strokeWidth={1.5}/>
                                                {t("common.delete")}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ProjectsDesktopTable;
