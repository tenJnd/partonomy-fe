import React, {useCallback, useMemo, useRef, useState} from "react";
import {Link, useLocation, useParams, useSearchParams} from "react-router-dom";
import {AlertCircle, ArrowLeft, Loader} from "lucide-react";
import {useTranslation} from "react-i18next";

import {useLang} from "../hooks/useLang";
import {useAuth} from "../contexts/AuthContext";
import {useOrgBilling} from "../hooks/useOrgBilling";
import {usePartComments} from "../hooks/actions/usePartComments";
import {usePartTags} from "../hooks/actions/usePartTags";
import {usePartDetailActions} from "../hooks/actions/usePartDetailActions";

import type {Database, PriorityEnum, WorkflowStatusEnum} from "../lib/database.types";

import {useDocumentParts} from "./DocumentDetail/hooks/useDocumentParts";
import {usePartRender} from "./DocumentDetail/hooks/usePartRender";
import {useZoomPan} from "./DocumentDetail/hooks/useZoomPan";

import {DocumentHeader} from "./DocumentDetail/components/DocumentHeader";
import {PartNavigation} from "./DocumentDetail/components/PartNavigation";
import {MobileMainTabs} from "./DocumentDetail/components/MobileMainTabs";
import {FullscreenModal} from "./DocumentDetail/components/FullscreenModal";
import {DetailsPanel} from "./DocumentDetail/components/DetailsPanel";
import {PreviewPanel} from "./DocumentDetail/components/PreviewPanel";

type Document = Database["public"]["Tables"]["documents"]["Row"];
// type Part = Database["public"]["Tables"]["parts"]["Row"];

const DocumentDetail: React.FC = () => {
    const {t} = useTranslation();
    const lang = useLang();

    const {documentId} = useParams<{ documentId: string }>();
    const [searchParams] = useSearchParams();
    const partIdFromUrl = searchParams.get("partId");

    const {user, currentOrg} = useAuth();
    const {billing} = useOrgBilling();

    const canComment = billing?.tier?.can_comment ?? false;
    const canUseTags = billing?.tier?.can_use_tags ?? false;
    const canSetFavourite = billing?.tier?.can_set_favourite ?? false;
    const canSetStatus = !!billing?.tier?.can_set_status;
    const canSetPriority = !!billing?.tier?.can_set_priority;

    const imageRef = useRef<HTMLImageElement>(null);
    const normalContainerRef = useRef<HTMLDivElement>(null);
    const fullscreenContainerRef = useRef<HTMLDivElement>(null);

    const location = useLocation();
    const backTo = (location.state as any)?.from ?? `/${lang}/app/documents`;

    const {
        document,
        parts,
        setParts,
        selectedPartId,
        setSelectedPartId,
        loading,
        error,
    } = useDocumentParts({
        documentId,
        orgId: currentOrg?.org_id ?? null,
        partIdFromUrl,
        t,
    });

    const {partRenderUrl, imageLoading, imageAspectRatio} = usePartRender({
        selectedPartId,
        parts,
        normalContainerRef,
        fullscreenContainerRef,
    });

    const zoomPan = useZoomPan({hasImage: !!partRenderUrl});

    const selectedPart = useMemo(
        () => parts.find((p) => p.id === selectedPartId),
        [parts, selectedPartId]
    );

    const selectedPartReport = selectedPart?.report_json as any | undefined;

    const workflowStatus = ((selectedPart?.workflow_status as WorkflowStatusEnum | null) ?? null);
    const priority = ((selectedPart?.priority as PriorityEnum | null) ?? null);

    const detailActions = usePartDetailActions({
        selectedPartId: selectedPartId ?? null,
        setParts,
        orgId: currentOrg?.org_id ?? null,
        userId: user?.id ?? null,
        canSetStatus,
        canSetPriority,
    });

    const {comments, loading: commentsLoading, error: commentsError, addComment} = usePartComments(
        selectedPartId,
        currentOrg?.org_id
    );

    const {tags, loading: tagsLoading, error: tagsError, addTag, removeTag} = usePartTags(
        selectedPartId ?? null,
        currentOrg?.org_id
    );

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const toggleSection = useCallback((section: string) => {
        setExpandedSections((prev) => ({...prev, [section]: !prev[section]}));
    }, []);

    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    const [newComment, setNewComment] = useState("");
    const [newTag, setNewTag] = useState("");

    const [activeReportTab, setActiveReportTab] = useState<"report" | "bom" | "revisions" | "comments">("report");
    const [mobileMainTab, setMobileMainTab] = useState<"preview" | "details">("preview");

    const currentPartIndex = useMemo(
        () => (selectedPart ? parts.findIndex((p) => p.id === selectedPart.id) : -1),
        [parts, selectedPart]
    );
    const hasPrevPart = currentPartIndex > 0;
    const hasNextPart = currentPartIndex >= 0 && currentPartIndex < parts.length - 1;

    const handlePrevPartClick = useCallback(() => {
        if (!selectedPart) return;
        const idx = parts.findIndex((p) => p.id === selectedPart.id);
        if (idx > 0) setSelectedPartId(parts[idx - 1].id);
    }, [parts, selectedPart, setSelectedPartId]);

    const handleNextPartClick = useCallback(() => {
        if (!selectedPart) return;
        const idx = parts.findIndex((p) => p.id === selectedPart.id);
        if (idx >= 0 && idx < parts.length - 1) setSelectedPartId(parts[idx + 1].id);
    }, [parts, selectedPart, setSelectedPartId]);

    if (loading) {
        return (
            <div className="p-6 max-w-[1800px] mx-auto">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <Loader className="w-8 h-8 text-gray-400 animate-spin" strokeWidth={1.5}/>
                </div>
            </div>
        );
    }

    if (error || !document) {
        return (
            <div className="p-6 max-w-[1800px] mx-auto">
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" strokeWidth={1.5}/>
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">
                            {t("documents.detail.documentNotFound.title")}
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            {error || t("documents.detail.documentNotFound.description")}
                        </p>
                        <Link
                            to={backTo}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" strokeWidth={1.5}/>
                            {t("documents.detail.backToDocuments")}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className="p-4 sm:p-6 max-w-[1800px] mx-auto bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen">
            <FullscreenModal
                t={t}
                isFullscreen={zoomPan.isFullscreen}
                selectedPart={selectedPart}
                partRenderUrl={partRenderUrl}
                zoom={zoomPan.zoom}
                isDragging={zoomPan.isDragging}
                position={zoomPan.position}
                imageRef={imageRef}
                fullscreenContainerRef={fullscreenContainerRef}
                onExit={zoomPan.toggleFullscreen}
                onZoomOut={zoomPan.handleZoomOut}
                onZoomIn={zoomPan.handleZoomIn}
                onReset={zoomPan.handleResetZoom}
                onMouseDown={zoomPan.handleMouseDown}
                onMouseMove={zoomPan.handleMouseMove}
                onMouseUp={zoomPan.handleMouseUp}
                onMouseLeave={zoomPan.handleMouseLeave}
                onWheel={zoomPan.handleWheel}
            />

            <DocumentHeader
                t={t}
                lang={lang}
                document={document as Document}
                partsCount={parts.length}
                backTo={backTo}
                selectedPart={selectedPart}
                selectedPartReport={selectedPartReport}
                canSetFavourite={canSetFavourite}
                canSetStatus={canSetStatus}
                canSetPriority={canSetPriority}
                workflowStatus={workflowStatus}
                priority={priority}
                detailActions={detailActions as any}
                isExportMenuOpen={isExportMenuOpen}
                setIsExportMenuOpen={setIsExportMenuOpen}
            />

            <PartNavigation
                t={t}
                parts={parts}
                selectedPart={selectedPart}
                currentPartIndex={currentPartIndex}
                hasPrevPart={hasPrevPart}
                hasNextPart={hasNextPart}
                onPrev={handlePrevPartClick}
                onNext={handleNextPartClick}
            />

            <MobileMainTabs t={t} mobileMainTab={mobileMainTab} setMobileMainTab={setMobileMainTab}/>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6">
                <DetailsPanel
                    t={t}
                    lang={lang}
                    mobileMainTab={mobileMainTab}
                    activeReportTab={activeReportTab}
                    setActiveReportTab={setActiveReportTab}
                    canComment={canComment}
                    canUseTags={canUseTags}
                    selectedPart={selectedPart}
                    selectedPartReport={selectedPartReport}
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                    comments={comments as any[]}
                    commentsLoading={commentsLoading}
                    commentsError={commentsError}
                    newComment={newComment}
                    setNewComment={setNewComment}
                    addComment={addComment}
                    tags={tags as any}
                    tagsLoading={tagsLoading}
                    tagsError={tagsError}
                    newTag={newTag}
                    setNewTag={setNewTag}
                    addTag={addTag}
                    removeTag={removeTag}
                />

                <PreviewPanel
                    t={t}
                    mobileMainTab={mobileMainTab}
                    selectedPart={selectedPart}
                    selectedPartReport={selectedPartReport}
                    partRenderUrl={partRenderUrl}
                    imageLoading={imageLoading}
                    imageAspectRatio={imageAspectRatio}
                    selectedPartId={selectedPartId}
                    zoom={zoomPan.zoom}
                    isDragging={zoomPan.isDragging}
                    position={zoomPan.position}
                    onZoomOut={zoomPan.handleZoomOut}
                    onZoomIn={zoomPan.handleZoomIn}
                    onReset={zoomPan.handleResetZoom}
                    onFullscreen={zoomPan.toggleFullscreen}
                    normalContainerRef={normalContainerRef}
                    imageRef={imageRef}
                    onMouseDown={zoomPan.handleMouseDown}
                    onMouseMove={zoomPan.handleMouseMove}
                    onMouseUp={zoomPan.handleMouseUp}
                    onMouseLeave={zoomPan.handleMouseLeave}
                    onWheel={zoomPan.handleWheel}
                />
            </div>
        </div>
    );
};

export default DocumentDetail;
