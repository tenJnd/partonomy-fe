import React, {useEffect, useMemo, useState} from "react";
import {useTranslation} from "react-i18next";
import {useNavigate, useSearchParams} from "react-router-dom";
import {AlertCircle, RotateCcw, Star} from "lucide-react";
import {useLang} from "../../hooks/useLang";
import {useAuth} from "../../contexts/AuthContext";
import {supabase} from "../../lib/supabase";
import {PartWithDocument} from "../../hooks/useParts";
import {useDocumentActions} from "../../hooks/useDocumentActions";
import {SortField} from "./documentsTable.types";
import DocumentsTable from "./DocumentsTable";
import DeleteDocumentModal from "../DeleteDocumentModal";
import RemovePartFromProjectModal from "../RemovePartFromProjectModal";
import AddToProjectModal from "./AddToProjectModal";

interface PartsManagerProps {
    parts: PartWithDocument[];
    setParts: React.Dispatch<React.SetStateAction<PartWithDocument[]>>;
    loading: boolean;
    mode: "all-documents" | "project-detail";
    uploading?: boolean;
    uploadProgress?: number;
    canUseProjects?: boolean;
    canUseFavorite?: boolean;
    canSetStatus?: boolean;
    canSetPriority?: boolean;
    onRemoveFromProject?: (part: PartWithDocument) => Promise<void>;
    onUploadClick?: () => void;
}

const PartsManager: React.FC<PartsManagerProps> = (props) => {
    const {
        parts,
        setParts,
        mode,
        canUseFavorite,
        canSetStatus,
        canSetPriority,
        canUseProjects,
        onUploadClick,
        uploading = false,
        uploadProgress = 0,
        loading
    } = props;
    const {t} = useTranslation();
    const navigate = useNavigate();
    const lang = useLang();
    const {currentOrg, user} = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();

    const [favoritePartIds, setFavoritePartIds] = useState<Set<string>>(new Set());
    const actions = useDocumentActions(setParts, favoritePartIds, setFavoritePartIds);

    // --- URL FILTRY ---
    const getParam = (k: string, fb: string) => searchParams.get(k) ?? fb;
    const setParam = (patch: Record<string, string | null>) => {
        setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            Object.entries(patch).forEach(([k, v]) => {
                if (!v || v === "all" || v === "0") next.delete(k); else next.set(k, v);
            });
            return next;
        }, {replace: true});
    };

    const [timeFilter, setTimeFilter] = useState(() => getParam("time", "all"));
    const [complexityFilter, setComplexityFilter] = useState(() => getParam("cx", "all"));
    const [workflowFilter, setWorkflowFilter] = useState(() => getParam("wf", "all"));
    const [priorityFilter, setPriorityFilter] = useState(() => getParam("prio", "all"));
    const [companyFilter, setCompanyFilter] = useState(() => getParam("co", "all"));
    const [showOnlyFavorites, setShowOnlyFavorites] = useState(() => getParam("fav", "0") === "1");
    const [sortField, setSortField] = useState<SortField>(() => getParam("sort", "last_updated") as SortField);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">(() => getParam("dir", "desc") as "asc" | "desc");
    const [selectedPartIds, setSelectedPartIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!currentOrg || !user) return;
        supabase.from("part_favorites").select("part_id").eq("org_id", currentOrg.org_id).eq("user_id", user.id)
            .then(({data}) => setFavoritePartIds(new Set(data?.map(r => r.part_id) || [])));
    }, [currentOrg, user]);

    const filteredSortedParts = useMemo(() => {
        let result = parts.filter(p => {
            if (complexityFilter !== "all" && p.overall_complexity?.toUpperCase() !== complexityFilter.toUpperCase()) return false;
            if (workflowFilter !== "all" && p.workflow_status !== workflowFilter) return false;
            if (priorityFilter !== "all" && p.priority !== priorityFilter) return false;
            if (companyFilter !== "all" && p.company_name !== companyFilter) return false;
            if (showOnlyFavorites && !favoritePartIds.has(p.id)) return false;
            if (timeFilter !== "all") {
                const days = timeFilter === "7d" ? 7 : timeFilter === "30d" ? 30 : 90;
                const cutoff = new Date();
                cutoff.setDate(cutoff.getDate() - days);
                if (new Date(p.last_updated) < cutoff) return false;
            }
            return true;
        });

        return result.sort((a, b) => {
            const dir = sortDirection === "asc" ? 1 : -1;
            let vA: any, vB: any;
            if (sortField === "file_name") {
                vA = a.document?.file_name || "";
                vB = b.document?.file_name || "";
            } else if (sortField === "last_status") {
                vA = a.document?.last_status || "";
                vB = b.document?.last_status || "";
            } else if (sortField === "last_updated") {
                vA = new Date(a.last_updated).getTime();
                vB = new Date(b.last_updated).getTime();
            } else {
                vA = (a as any)[sortField] || "";
                vB = (b as any)[sortField] || "";
            }
            return (vA > vB ? 1 : -1) * dir;
        });
    }, [parts, complexityFilter, workflowFilter, priorityFilter, companyFilter, showOnlyFavorites, timeFilter, favoritePartIds, sortField, sortDirection]);

    const uniqueCompanies = useMemo(() => Array.from(new Set(parts.map(p => p.company_name).filter(Boolean))).sort(), [parts]);

    const resetFilters = () => {
        setTimeFilter("all");
        setComplexityFilter("all");
        setWorkflowFilter("all");
        setPriorityFilter("all");
        setCompanyFilter("all");
        setShowOnlyFavorites(false);
        setParam({time: null, cx: null, wf: null, prio: null, co: null, fav: null});
    };

    const handleRowClick = (documentId: string, partId: string) => {
        navigate(`/${lang}/app/documents/${documentId}?partId=${partId}`, {
            state: {from: location.pathname + location.search}
        });
    };

    return (
        <div className="space-y-4">
            {actions.error && (
                <div
                    className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-3 text-rose-700 text-sm">
                    <AlertCircle className="w-5 h-5"/> {actions.error}
                </div>
            )}

            {/* FILTER BAR */}
            <div className="flex items-center gap-3 flex-wrap">
                <select value={timeFilter} onChange={e => {
                    setTimeFilter(e.target.value);
                    setParam({time: e.target.value});
                }} className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-xs outline-none">
                    <option value="all">{t("documents.allTime")}</option>
                    <option value="7d">{t("documents.last7Days")}</option>
                    <option value="30d">{t("documents.last30Days")}</option>
                    <option value="90d">{t("documents.last90Days")}</option>
                </select>
                <select value={complexityFilter} onChange={e => {
                    setComplexityFilter(e.target.value);
                    setParam({cx: e.target.value});
                }} className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-xs outline-none">
                    <option value="all">{t("documents.allComplexity")}</option>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="EXTREME">Extreme</option>
                </select>
                <select value={workflowFilter} onChange={e => {
                    setWorkflowFilter(e.target.value);
                    setParam({wf: e.target.value});
                }} className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-xs outline-none">
                    <option value="all">{t("documents.allWorkflow")}</option>
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Done</option>
                    <option value="ignored">Ignored</option>
                </select>
                <select value={priorityFilter} onChange={e => {
                    setPriorityFilter(e.target.value);
                    setParam({prio: e.target.value});
                }} className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-xs outline-none">
                    <option value="all">{t("documents.allPriority")}</option>
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="hot">Hot</option>
                </select>
                <select value={companyFilter} onChange={e => {
                    setCompanyFilter(e.target.value);
                    setParam({co: e.target.value});
                }}
                        className="h-[38px] px-3 bg-white border border-gray-200 rounded-lg text-xs outline-none max-w-[150px]">
                    <option value="all">{t("documents.allCompanies")}</option>
                    {uniqueCompanies.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                </select>
                {canUseFavorite && (
                    <button onClick={() => {
                        setShowOnlyFavorites(!showOnlyFavorites);
                        setParam({fav: !showOnlyFavorites ? "1" : null});
                    }}
                            className={`h-[38px] px-3 flex items-center gap-1 rounded-lg border text-xs transition-colors ${showOnlyFavorites ? "bg-amber-50 border-amber-300 text-amber-800" : "bg-white border-gray-200 text-gray-700"}`}>
                        <Star
                            className={`w-3.5 h-3.5 ${showOnlyFavorites ? "fill-current" : ""}`}/> {t("documents.favouritesOnly")}
                    </button>
                )}
                <button onClick={resetFilters}
                        className="h-[38px] px-3 bg-gray-100 border border-gray-200 rounded-lg text-xs text-gray-700 flex items-center gap-1.5 transition-colors">
                    <RotateCcw className="w-3.5 h-3.5"/> {t("documents.resetFilters")}</button>
            </div>

            <DocumentsTable
                parts={filteredSortedParts}
                loading={loading}
                uploading={uploading}
                uploadProgress={uploadProgress}
                sortField={sortField}
                sortDirection={sortDirection}
                onSortChange={f => {
                    const nd = f === sortField ? (sortDirection === "asc" ? "desc" : "asc") : "asc";
                    setSortDirection(nd);
                    setSortField(f);
                    setParam({sort: f, dir: nd});
                }}
                onRowClick={handleRowClick}
                onUploadClick={onUploadClick || (() => {
                })}
                onRerun={async (id) => {
                    await supabase.from("documents").update({last_status: "queued"}).eq("id", id);
                }}
                onDownload={async (doc) => {
                    const {data} = await supabase.storage.from(doc.raw_bucket).createSignedUrl(doc.raw_storage_key, 60);
                    if (data?.signedUrl) window.open(data.signedUrl);
                }}
                selectedPartIds={selectedPartIds}
                onToggleSelect={id => {
                    const next = new Set(selectedPartIds);
                    if (next.has(id)) next.delete(id); else next.add(id);
                    setSelectedPartIds(next);
                }}
                onToggleSelectAll={ids => {
                    if (ids.every(id => selectedPartIds.has(id))) {
                        const next = new Set(selectedPartIds);
                        ids.forEach(id => next.delete(id));
                        setSelectedPartIds(next);
                    } else {
                        const next = new Set(selectedPartIds);
                        ids.forEach(id => next.add(id));
                        setSelectedPartIds(next);
                    }
                }}
                favoritePartIds={favoritePartIds}
                onToggleFavorite={actions.handleToggleFavorite}
                onChangeWorkflowStatus={actions.handleWorkflowStatusChange}
                onChangePriority={actions.handlePriorityChange}
                onBulkSetStatus={actions.handleBulkSetStatus}
                onBulkSetPriority={actions.handleBulkSetPriority}
                onBulkToggleFavorite={actions.handleBulkToggleFavorite}
                onAddToProject={actions.handleOpenAddToProject}
                onBulkAddToProject={actions.handleOpenBulkAddToProject}
                onDelete={part => {
                    if (mode === "all-documents") {
                        actions.setDocToDelete(part.document || null);
                        actions.setDeleteModalOpen(true);
                    } else {
                        actions.setPartToRemove(part);
                        actions.setRemoveModalOpen(true);
                    }
                }}
                deleteLabel={mode === "project-detail" ? t("projects.detail.removeFromProject") : t("common.delete")}
                canUseProjects={canUseProjects}
                canUseFavorite={canUseFavorite}
                canSetStatus={canSetStatus}
                canSetPriority={canSetPriority}
            />

            <DeleteDocumentModal open={actions.deleteModalOpen} onClose={() => actions.setDeleteModalOpen(false)}
                                 documentName={actions.docToDelete?.file_name || ""} onConfirm={async () => {
                await supabase.from("documents").delete().eq("id", actions.docToDelete!.id);
                setParts(prev => prev.filter(p => p.document?.id !== actions.docToDelete?.id));
                actions.setDeleteModalOpen(false);
            }}/>

            <RemovePartFromProjectModal open={actions.removeModalOpen} onClose={() => actions.setRemoveModalOpen(false)}
                                        partName={actions.partToRemove?.drawing_title || ""} onConfirm={async () => {
                if (actions.partToRemove) await props.onRemoveFromProject?.(actions.partToRemove);
                actions.setRemoveModalOpen(false);
            }}/>

            <AddToProjectModal
                open={actions.addToProjectOpen}
                onClose={() => actions.setAddToProjectOpen(false)}
                part={actions.partToAdd}
                bulkPartIds={actions.bulkProjectPartIds}
            />
        </div>
    );
};
export default PartsManager;