// src/pages/ProjectDetail.tsx
import React, {useEffect, useMemo, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import {AlertCircle, ArrowLeft} from "lucide-react";
import {useAuth} from "../contexts/AuthContext";
import {supabase} from "../lib/supabase";
import type {PartWithDocument} from "../hooks/useParts";
import {useParts} from "../hooks/useParts";
import DocumentsTable, {SortField,} from "../components/documents/DocumentsTable";
import type {Database} from "../lib/database.types";
import RemovePartFromProjectModal from "../components/RemovePartFromProjectModal";

type ProjectRow = Database["public"]["Tables"]["projects"]["Row"];

const ProjectDetail: React.FC = () => {
    const {projectId} = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const {currentOrg} = useAuth();

    const {parts, loading, loadingMore, hasMore, loadMore} = useParts(
        currentOrg,
        200
    );

    const [sortField, setSortField] = useState<SortField>("last_updated");
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

    const [project, setProject] = useState<ProjectRow | null>(null);
    const [projectLoading, setProjectLoading] = useState(true);
    const [projectError, setProjectError] = useState<string | null>(null);

    const [projectPartIds, setProjectPartIds] = useState<string[]>([]);
    const [projectPartsLoading, setProjectPartsLoading] = useState(true);
    const [projectPartsError, setProjectPartsError] = useState<string | null>(
        null
    );

    // modal state pro "Remove from project"
    const [removeModalOpen, setRemoveModalOpen] = useState(false);
    const [partToRemove, setPartToRemove] =
        useState<PartWithDocument | null>(null);

    // načti samotný projekt (kvůli názvu, zákazníkovi atd.)
    useEffect(() => {
        if (!currentOrg || !projectId) return;

        const loadProject = async () => {
            try {
                setProjectLoading(true);
                setProjectError(null);

                const {data, error} = await supabase
                    .from("projects")
                    .select("*")
                    .eq("org_id", currentOrg.org_id)
                    .eq("id", projectId)
                    .single();

                if (error) {
                    console.error("[ProjectDetail] loadProject error:", error);
                    setProjectError(error.message || "Failed to load project.");
                    return;
                }

                setProject(data);
            } catch (err: any) {
                console.error("[ProjectDetail] unexpected project error:", err);
                setProjectError(err.message || "Failed to load project.");
            } finally {
                setProjectLoading(false);
            }
        };

        loadProject();
    }, [currentOrg, projectId]);

    // načti seznam part_id pro daný projekt
    useEffect(() => {
        if (!currentOrg || !projectId) return;

        const loadProjectParts = async () => {
            try {
                setProjectPartsLoading(true);
                setProjectPartsError(null);

                const {data, error} = await supabase
                    .from("project_parts")
                    .select("part_id")
                    .eq("org_id", currentOrg.org_id)
                    .eq("project_id", projectId);

                if (error) {
                    console.error("[ProjectDetail] loadProjectParts error:", error);
                    setProjectPartsError(error.message || "Failed to load project parts.");
                    return;
                }

                setProjectPartIds(data?.map((row) => row.part_id) ?? []);
            } catch (err: any) {
                console.error("[ProjectDetail] unexpected projectParts error:", err);
                setProjectPartsError(err.message || "Failed to load project parts.");
            } finally {
                setProjectPartsLoading(false);
            }
        };

        loadProjectParts();
    }, [currentOrg, projectId]);

    const handleSortChange = (field: SortField) => {
        setSortDirection((prevDir) =>
            field === sortField ? (prevDir === "asc" ? "desc" : "asc") : "asc"
        );
        setSortField(field);
    };

    // jen parts, které patří do tohoto projektu
    const filteredParts: PartWithDocument[] = useMemo(() => {
        if (!projectPartIds.length) return [];
        return parts.filter((p) => projectPartIds.includes(p.id));
    }, [parts, projectPartIds]);

    const handleRowClick = (documentId: string, partId: string) => {
        navigate(`/documents/${documentId}?partId=${partId}`);
    };

    const handleRerunDocument = async (docId: string) => {
        try {
            const {error} = await supabase
                .from("documents")
                .update({
                    last_status: "queued",
                    last_error: null,
                })
                .eq("id", docId);

            if (error) {
                console.error("[ProjectDetail] Error rerunning document:", error);
            }
        } catch (err) {
            console.error("[ProjectDetail] Error rerunning document:", err);
        }
    };

    const handleDownloadDocument = async (doc: any) => {
        try {
            if (!doc.raw_bucket || !doc.raw_storage_key) {
                return;
            }

            const {data, error} = await supabase.storage
                .from(doc.raw_bucket)
                .createSignedUrl(doc.raw_storage_key, 60);

            if (error || !data?.signedUrl) {
                console.error("[ProjectDetail] Error generating download URL:", error);
                return;
            }

            const link = document.createElement("a");
            link.href = data.signedUrl;
            link.download = doc.file_name || "document";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error("[ProjectDetail] Error downloading document:", err);
        }
    };

    // otevření modalu – jen nastavení stavu
    const handleRemovePartFromProject = (part: PartWithDocument) => {
        setPartToRemove(part);
        setProjectPartsError(null);
        setRemoveModalOpen(true);
    };

    // potvrzení v modalu – reálné smazání linku v project_parts
    const handleConfirmRemove = async () => {
        if (!currentOrg || !projectId || !partToRemove) return;

        try {
            const {error} = await supabase
                .from("project_parts")
                .delete()
                .eq("org_id", currentOrg.org_id)
                .eq("project_id", projectId)
                .eq("part_id", partToRemove.id);

            if (error) {
                console.error("[ProjectDetail] remove part from project error:", error);
                setProjectPartsError(
                    error.message || "Failed to remove part from project."
                );
                return;
            }

            // Lokálně odfiltrujeme part z projektu
            setProjectPartIds((prev) => prev.filter((id) => id !== partToRemove.id));
        } catch (err: any) {
            console.error("[ProjectDetail] unexpected remove part error:", err);
            setProjectPartsError(
                err.message || "Failed to remove part from project."
            );
        } finally {
            setRemoveModalOpen(false);
            setPartToRemove(null);
        }
    };

    const isLoadingAny = loading || projectLoading || projectPartsLoading;

    return (
        <div className="min-h-screen relative bg-gradient-to-br from-slate-50 via-white to-slate-50">
            <div className="p-6 mx-auto" style={{maxWidth: "1800px"}}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6 gap-3">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate("/projects")}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5}/>
                            Back to projects
                        </button>

                        <div className="flex flex-col">
              <span className="text-lg font-semibold text-gray-900">
                {project?.name || "Project"}
              </span>
                            {project?.customer_name && (
                                <span className="text-xs text-gray-500">
                  {project.customer_name}
                                    {project.external_ref ? ` • ${project.external_ref}` : ""}
                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Errors */}
                {(projectError || projectPartsError) && (
                    <div className="mb-4 p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3">
                        <AlertCircle
                            className="w-5 h-5 text-rose-600 flex-shrink-0"
                            strokeWidth={1.5}
                        />
                        <div className="text-sm text-rose-700 space-y-1">
                            {projectError && <p>{projectError}</p>}
                            {projectPartsError && <p>{projectPartsError}</p>}
                        </div>
                    </div>
                )}

                {/* Table – recyklujeme DocumentsTable, ale jen s parts pro projekt */}
                <DocumentsTable
                    parts={filteredParts}
                    loading={isLoadingAny && parts.length === 0}
                    uploading={false}
                    uploadProgress={0}
                    sortField={sortField}
                    sortDirection={sortDirection}
                    onSortChange={handleSortChange}
                    onUploadClick={() => {
                        /* v detailu projektu neuploadujeme */
                    }}
                    onRerun={handleRerunDocument}
                    onDownload={handleDownloadDocument}
                    onDelete={handleRemovePartFromProject} // maže link
                    onRowClick={handleRowClick}
                    canUseProjects={false} // schová "Add to project" v menu
                    onAddToProject={() => {
                    }}
                    deleteLabel="Remove from project" // text v menu místo "Delete"
                />

                {/* Load more – volitelné, ale dává smysl, protože useParts má stránkování */}
                {hasMore && !loading && (
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={loadMore}
                            disabled={loadingMore}
                            className="px-4 py-2 text-sm rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50"
                        >
                            {loadingMore ? "Loading..." : "Load more"}
                        </button>
                    </div>
                )}
            </div>

            {/* Modal pro odstranění partu z projektu */}
            <RemovePartFromProjectModal
                open={removeModalOpen}
                onClose={() => {
                    setRemoveModalOpen(false);
                    setPartToRemove(null);
                }}
                onConfirm={handleConfirmRemove}
                partName={
                    partToRemove?.drawing_title ||
                    partToRemove?.document?.file_name ||
                    "this part"
                }
            />
        </div>
    );
};

export default ProjectDetail;
