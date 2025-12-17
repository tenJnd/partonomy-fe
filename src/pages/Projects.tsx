// src/pages/Projects.tsx
import React, { useMemo, useState } from "react";
import { AlertCircle, Plus } from "lucide-react";
import ProjectsTable, { ProjectSortField } from "../components/ProjectsTable";
import { useProjects } from "../hooks/useProjects";
import type { Database } from "../lib/database.types";
import { Link, useNavigate } from "react-router-dom";
import { useOrgBilling } from "../hooks/useOrgBilling";
import { useTranslation } from "react-i18next";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

type StatusFilter = "all" | ProjectRow["status"];
type PriorityFilter = "all" | ProjectRow["priority"];

const Projects: React.FC = () => {
  const { projects, loading, error, createProject, updateProject, deleteProject } =
    useProjects();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { billing } = useOrgBilling();

  const canUseProjects = !!billing?.tier?.can_use_projects; // uprav podle tvého billing shape

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>("all");

  const [sortField, setSortField] = useState<ProjectSortField>("created_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectRow | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const handleSortChange = (field: ProjectSortField) => {
    setSortDirection((prevDir) =>
      field === sortField ? (prevDir === "asc" ? "desc" : "asc") : "asc"
    );
    setSortField(field);
  };

  const filteredSortedProjects = useMemo(() => {
    let result = [...projects];

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    if (priorityFilter !== "all") {
      result = result.filter((p) => p.priority === priorityFilter);
    }

    const direction = sortDirection === "asc" ? 1 : -1;

    result.sort((a, b) => {
      let aVal: any;
      let bVal: any;

      switch (sortField) {
        case "name":
          aVal = (a.name || "").toLowerCase();
          bVal = (b.name || "").toLowerCase();
          break;
        case "customer_name":
          aVal = (a.customer_name || "").toLowerCase();
          bVal = (b.customer_name || "").toLowerCase();
          break;
        case "external_ref":
          aVal = (a.external_ref || "").toLowerCase();
          bVal = (b.external_ref || "").toLowerCase();
          break;
        case "status":
          aVal = a.status || "";
          bVal = b.status || "";
          break;
        case "priority":
          aVal = a.priority || "";
          bVal = b.priority || "";
          break;
        case "due_date":
          aVal = a.due_date ? new Date(a.due_date).getTime() : 0;
          bVal = b.due_date ? new Date(b.due_date).getTime() : 0;
          break;
        case "created_at":
        default:
          aVal = a.created_at ? new Date(a.created_at).getTime() : 0;
          bVal = b.created_at ? new Date(b.created_at).getTime() : 0;
      }

      if (aVal < bVal) return -1 * direction;
      if (aVal > bVal) return 1 * direction;
      return 0;
    });

    return result;
  }, [projects, statusFilter, priorityFilter, sortField, sortDirection]);

  const openCreateModal = () => {
    setEditingProject(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openEditModal = (project: ProjectRow) => {
    setEditingProject(project);
    setFormError(null);
    setFormOpen(true);
  };

  const handleDeleteProject = async (project: ProjectRow) => {
    if (!window.confirm(t("projects.confirmDelete", { name: project.name }))) return;
    try {
      await deleteProject(project.id as string);
    } catch (err: any) {
      setFormError(err.message ?? t("projects.failedToDelete"));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string)?.trim();
    const description = (formData.get("description") as string)?.trim() || null;
    const customer_name =
      ((formData.get("customer_name") as string) || "").trim() || null;
    const external_ref =
      ((formData.get("external_ref") as string) || "").trim() || null;
    const status = (formData.get("status") as string) as ProjectRow["status"];
    const priority = (formData.get("priority") as string) as ProjectRow["priority"];
    const due_date_raw = (formData.get("due_date") as string) || "";

    if (!name) {
      setFormError(t("projects.form.nameRequired"));
      return;
    }

    const due_date = due_date_raw ? new Date(due_date_raw).toISOString() : null;

    try {
      setFormSubmitting(true);
      setFormError(null);

      if (editingProject) {
        await updateProject(editingProject.id as string, {
          name,
          description,
          customer_name,
          external_ref,
          status,
          priority,
          due_date,
        });
      } else {
        await createProject({
          name,
          description,
          customer_name,
          external_ref,
          status,
          priority,
          due_date,
        });
      }

      setFormOpen(false);
      setEditingProject(null);
    } catch (err: any) {
      setFormError(err.message ?? t("projects.failedToSave"));
    } finally {
      setFormSubmitting(false);
    }
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  const handleRowClick = (projectId: string) => {
    navigate(`/app/projects/${projectId}`);
  };

  // 🔒 Tady jen rozhodneme, CO vrátit – ale všechny hooky výše už běží vždy
  if (!canUseProjects) {
    return (
      <div className="min-h-screen relative bg-gradient-to-br from-slate-50 via-white to-slate-50">
        <div className="p-6 mx-auto" style={{ maxWidth: "1600px" }}>
          <div className="flex items-center justify-between mb-6 gap-3">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold text-gray-900">
                {t("projects.title")}
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                {t("projects.upgrade")}
              </span>
            </div>
          </div>

          <div className="max-w-xl bg-white border border-dashed border-gray-200 rounded-lg px-4 py-4 flex gap-3 items-start">
            <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5" strokeWidth={1.5} />
            <div className="text-sm text-gray-700 space-y-1">
              <p className="font-medium text-gray-900">
                {t("projects.projectsAvailableOnHigherTiers")}
              </p>
              <p className="text-xs text-gray-600">
                {t("projects.projectsDescription")}{" "}
                Go to{" "}
                <Link
                  to="/app/settings/billing"
                  className="text-blue-600 hover:underline font-medium"
                >
                  {t("billingSettings.title")}
                </Link>{" "}
                {t("projects.goToBillingToUpgrade")}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Full verze stránky – stejná jako předtím
  return (
    <div className="min-h-screen relative bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="p-6 mx-auto" style={{ maxWidth: "1600px" }}>
        <div className="flex items-center justify-between mb-6 gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">
            {t("projects.title")}
          </h1>
          <button
            onClick={openCreateModal}
            className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            {t("projects.newProject")}
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
            <AlertCircle
              className="w-5 h-5 text-rose-600 flex-shrink-0"
              strokeWidth={1.5}
            />
            <p className="text-sm text-rose-700">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-xs"
          >
            <option value="all">{t("projects.allStatus")}</option>
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as PriorityFilter)}
            className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:border-gray-300 focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all outline-none text-xs"
          >
            <option value="all">{t("documents.allPriority")}</option>
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="hot">Hot</option>
          </select>

          <button
            onClick={resetFilters}
            className="h-[38px] px-3 bg-gray-100 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-200 text-xs text-gray-700"
          >
            {t("documents.resetFilters")}
          </button>
        </div>

        <ProjectsTable
          projects={filteredSortedProjects}
          loading={loading}
          sortField={sortField}
          sortDirection={sortDirection}
          onSortChange={handleSortChange}
          onRowClick={handleRowClick}
          onEdit={openEditModal}
          onDelete={handleDeleteProject}
        />
      </div>

      {/* Modal pro create/edit */}
      {formOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 relative">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editingProject ? t("projects.form.titleEdit") : t("projects.form.titleCreate")}
            </h2>

            {formError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2">
                <AlertCircle
                  className="w-4 h-4 text-rose-600 flex-shrink-0"
                  strokeWidth={1.5}
                />
                <p className="text-xs text-rose-700">{formError}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t("projects.form.nameLabel")}
                </label>
                <input
                  name="name"
                  defaultValue={editingProject?.name ?? ""}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  {t("projects.form.descriptionLabel")}
                </label>
                <textarea
                  name="description"
                  defaultValue={editingProject?.description ?? ""}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t("projects.form.customerLabel")}
                  </label>
                  <input
                    name="customer_name"
                    defaultValue={editingProject?.customer_name ?? ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t("projects.form.externalRefLabel")}
                  </label>
                  <input
                    name="external_ref"
                    defaultValue={editingProject?.external_ref ?? ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t("projects.form.statusLabel")}
                  </label>
                  <select
                    name="status"
                    defaultValue={editingProject?.status ?? "open"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="closed">Closed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t("projects.form.priorityLabel")}
                  </label>
                  <select
                    name="priority"
                    defaultValue={editingProject?.priority ?? "normal"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="hot">Hot</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t("projects.form.dueDateLabel")}
                  </label>
                  <input
                    type="date"
                    name="due_date"
                    defaultValue={
                      editingProject?.due_date
                        ? new Date(editingProject.due_date)
                            .toISOString()
                            .slice(0, 10)
                        : ""
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormOpen(false);
                    setEditingProject(null);
                  }}
                  className="px-4 py-2 text-xs rounded-lg border border-gray-300 bg-white hover:bg-gray-50"
                  disabled={formSubmitting}
                >
                  {t("projects.form.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-xs rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-60"
                >
                  {formSubmitting
                    ? t("projects.form.saving")
                    : editingProject
                    ? t("projects.form.saveChanges")
                    : t("projects.form.create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
