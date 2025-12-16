import React, {useEffect, useRef, useState} from 'react';
import {Link, useParams, useSearchParams} from 'react-router-dom';
import {
    AlertCircle,
    ArrowLeft,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    Download,
    Loader,
    Maximize2,
    Minimize2,
    RotateCw,
    Tag,
    X,
    ZoomIn,
    ZoomOut
} from 'lucide-react';
import {supabase} from '../lib/supabase';
import {useAuth} from '../contexts/AuthContext';
import type {Database, PriorityEnum, WorkflowStatusEnum} from '../lib/database.types';
import {exportJsonToExcel} from '../utils/exportJsonToExcel';
import {exportJsonToText} from '../utils/exportJsonToText';
import {exportJson} from '../utils/exportJson';
import {usePartComments} from '../hooks/usePartComments';
import {usePartTags} from "../hooks/usePartTags";
import {useOrgBilling} from "../hooks/useOrgBilling";
import {usePartFavorite} from "../hooks/usePartFavorite";
import {PartActionsBar} from "../components/PartActionsBar";


type Document = Database['public']['Tables']['documents']['Row'];
type Part = Database['public']['Tables']['parts']['Row'];

const DocumentDetail: React.FC = () => {
    const {documentId} = useParams<{ documentId: string }>();
    const [searchParams] = useSearchParams();
    const partIdFromUrl = searchParams.get('partId');
    const {user} = useAuth();
    const {currentOrg} = useAuth();
    const {billing} = useOrgBilling();

    const canComment = billing?.tier?.can_comment ?? false;
    const canUseTags = billing?.tier?.can_use_tags ?? false;
    const canSetFavourite = billing?.tier?.can_set_favourite ?? false;
    const canSetStatus = !!billing?.tier?.can_set_status;
    const canSetPriority = !!billing?.tier?.can_set_priority;

    const [document, setDocument] = useState<Document | null>(null);
    const [parts, setParts] = useState<Part[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
    const [partRenderUrl, setPartRenderUrl] = useState<string | null>(null);
    const [zoom, setZoom] = useState(100);
    const [imageLoading, setImageLoading] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({x: 0, y: 0});
    const [dragStart, setDragStart] = useState({x: 0, y: 0});
    const [imageAspectRatio, setImageAspectRatio] = useState<number | null>(null);
    const [containerWidth, setContainerWidth] = useState<number>(800);
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({}); // tdy doplnit jestli má být rozpadlé by default {cost: true, processing: true}
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const [newComment, setNewComment] = useState("");
    const [newTag, setNewTag] = useState("");
    const [workflowStatus, setWorkflowStatus] = useState<WorkflowStatusEnum | null>(null);
    const [priority, setPriority] = useState<PriorityEnum | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);
    const [updatingPriority, setUpdatingPriority] = useState(false);


    // Tabs v levém panelu
    const [activeReportTab, setActiveReportTab] = useState<'report' | 'bom' | 'revisions' | 'comments'>('report');

    const imageRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const toggleSection = (section: string) => {
        setExpandedSections(prev => ({...prev, [section]: !prev[section]}));
    };

    // Fetch document and its parts
    useEffect(() => {
        if (!documentId || !currentOrg) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch document
                const {data: docData, error: docError} = await supabase
                    .from('documents')
                    .select('*')
                    .eq('id', documentId)
                    .eq('org_id', currentOrg.org_id)
                    .single();

                if (docError) {
                    throw new Error(docError.message);
                }

                if (!docData) {
                    throw new Error('Document not found');
                }

                setDocument(docData);

                // Fetch parts connected to this document via document_parts table
                const {data: partsData, error: partsError} = await supabase
                    .from('document_parts')
                    .select(`
                            part_id,
                            parts (*)
                    `)
                    .eq('document_id', documentId);

                if (partsError) {
                    console.error('Error fetching parts:', partsError);
                } else if (partsData) {
                    const fetchedParts = partsData
                        .map(dp => dp.parts as unknown as Part | null)
                        .filter((p): p is Part => p !== null);
                    setParts(fetchedParts);

                    // Auto-select part from URL or first part
                    if (partIdFromUrl && fetchedParts.some(p => p.id === partIdFromUrl)) {
                        setSelectedPartId(partIdFromUrl);
                    } else if (fetchedParts.length > 0) {
                        setSelectedPartId(fetchedParts[0].id);
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load document');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [documentId, currentOrg, partIdFromUrl]);

    // Fetch part render URL when selected part changes
    useEffect(() => {
        if (!selectedPartId) return;

        const fetchPartRender = async () => {
            setImageLoading(true);
            setPartRenderUrl(null);
            setImageAspectRatio(null);

            const part = parts.find(p => p.id === selectedPartId);
            if (!part?.render_bucket || !part?.render_storage_key) {
                setImageLoading(false);
                return;
            }

            const {data, error} = await supabase.storage
                .from(part.render_bucket)
                .createSignedUrl(part.render_storage_key, 3600); // 1 hour expiry

            if (error) {
                console.error('Error fetching render:', error);
            } else if (data?.signedUrl) {
                setPartRenderUrl(data.signedUrl);

                // Load image to get dimensions
                const img = new Image();
                img.onload = () => {
                    setImageAspectRatio(img.width / img.height);
                    // Reset scroll position when image loads
                    if (containerRef.current) {
                        containerRef.current.scrollTop = 0;
                        containerRef.current.scrollLeft = 0;
                    }
                };
                img.src = data.signedUrl;
            }

            setImageLoading(false);
        };

        fetchPartRender();
    }, [selectedPartId, parts]);


    const handleZoomIn = () => {
        setZoom(prev => Math.min(prev + 25, 500));
    };

    const handleZoomOut = () => {
        setZoom(prev => Math.max(prev - 25, 25));
    };

    const handleResetZoom = () => {
        setZoom(100);
        setPosition({x: 0, y: 0});
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
        setZoom(100);
        setPosition({x: 0, y: 0});
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (zoom > 100) {
            e.preventDefault();
            setIsDragging(true);
            setDragStart({
                x: e.clientX - position.x,
                y: e.clientY - position.y
            });
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (!partRenderUrl) return;
        e.preventDefault();

        if (e.deltaY < 0) {
            setZoom(prev => Math.min(prev + 10, 400));
        } else {
            setZoom(prev => Math.max(prev - 10, 25));
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (isDragging && zoom > 100) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleMouseLeave = () => {
        setIsDragging(false);
    };

    // Reset position when zoom changes
    useEffect(() => {
        if (zoom <= 100) {
            setPosition({x: 0, y: 0});
        }
    }, [zoom]);

    // Track container width for aspect ratio calculations
    useEffect(() => {
        const updateWidth = () => {
            if (containerRef.current) {
                setContainerWidth(containerRef.current.offsetWidth);
            }
        };

        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    const selectedPart = parts.find(p => p.id === selectedPartId);
    const selectedPartReport = selectedPart?.report_json as any | undefined;
    const {
        comments,
        loading: commentsLoading,
        error: commentsError,
        addComment,
    } = usePartComments(selectedPartId, currentOrg?.org_id);
    const {
        tags,
        loading: tagsLoading,
        error: tagsError,
        addTag,
        removeTag,
    } = usePartTags(selectedPartId ?? null, currentOrg?.org_id);
    const {
        isFavorite,
        loading: favoriteLoading,
        // error: favoriteError,
        toggleFavorite,
    } = usePartFavorite(
        selectedPartId ?? null,
        currentOrg?.org_id ?? null,
        user?.id ?? null
    );

    useEffect(() => {
        if (selectedPart) {
            setWorkflowStatus(
                (selectedPart as any).workflow_status ?? null
            );
            setPriority(
                (selectedPart as any).priority ?? null
            );
        } else {
            setWorkflowStatus(null);
            setPriority(null);
        }
    }, [selectedPart?.id]);

    const handleWorkflowStatusChange = async (value: WorkflowStatusEnum) => {
        if (!selectedPart || !currentOrg) return;
        if (!canSetStatus) return;

        setUpdatingStatus(true);
        setWorkflowStatus(value);

        const {error} = await supabase
            .from("parts")
            .update({workflow_status: value})
            .eq("id", selectedPart.id)
            .eq("org_id", currentOrg.org_id);

        if (error) {
            console.error("[DocumentDetail] Error updating workflow_status:", error);
            // případně revert:
            // setWorkflowStatus(selectedPart.workflow_status ?? null);
        } else {
            setParts((prev) =>
                prev.map((p) =>
                    p.id === selectedPart.id ? {...p, workflow_status: value} : p
                )
            );
        }

        setUpdatingStatus(false);
    };

    const handlePriorityChange = async (value: PriorityEnum) => {
        if (!selectedPart || !currentOrg) return;
        if (!canSetPriority) return;

        setUpdatingPriority(true);
        setPriority(value);

        const {error} = await supabase
            .from("parts")
            .update({priority: value})
            .eq("id", selectedPart.id)
            .eq("org_id", currentOrg.org_id);

        if (error) {
            console.error("[DocumentDetail] Error updating priority:", error);
            // případně revert:
            // setPriority(selectedPart.priority ?? null);
        } else {
            setParts((prev) =>
                prev.map((p) =>
                    p.id === selectedPart.id ? {...p, priority: value} : p
                )
            );
        }

        setUpdatingPriority(false);
    };


    // Calculate container height based on aspect ratio
    const containerHeight = imageAspectRatio && containerWidth
        ? `${containerWidth / imageAspectRatio}px`
        : '600px';
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
                        <h2 className="text-xl font-semibold text-gray-900 mb-2">Document Not Found</h2>
                        <p className="text-sm text-gray-500 mb-4">
                            {error || "The document you're looking for doesn't exist."}
                        </p>
                        <Link
                            to="/app/Documents"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" strokeWidth={1.5}/>
                            Back to Documents
                        </Link>
                    </div>
                </div>
            </div>
        );

    }


    // Part navigation (šipky) – handlery
    const handlePrevPartClick = () => {
        if (!selectedPart) return;
        const idx = parts.findIndex(p => p.id === selectedPart.id);
        if (idx > 0) {
            setSelectedPartId(parts[idx - 1].id);
        }
    };

    const handleNextPartClick = () => {
        if (!selectedPart) return;
        const idx = parts.findIndex(p => p.id === selectedPart.id);
        if (idx >= 0 && idx < parts.length - 1) {
            setSelectedPartId(parts[idx + 1].id);
        }
    };

    const currentPartIndex = selectedPart ? parts.findIndex(p => p.id === selectedPart.id) : -1;
    const hasPrevPart = currentPartIndex > 0;
    const hasNextPart = currentPartIndex >= 0 && currentPartIndex < parts.length - 1;

    // Fullscreen modal
    const renderFullscreenModal = () => {
        if (!isFullscreen) return null;

        return (
            <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
                {/* Fullscreen Controls */}
                <div className="flex items-center justify-between p-4 bg-black/50">
                    <div className="flex items-center gap-4">
                        <h2 className="text-lg font-semibold text-white">
                            {selectedPart?.display_name || selectedPart?.part_number || 'Part Render'}
                        </h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleZoomOut}
                            disabled={zoom <= 25}
                            className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded-lg transition-colors"
                            title="Zoom out"
                        >
                            <ZoomOut className="w-5 h-5" strokeWidth={1.5}/>
                        </button>
                        <span className="text-sm text-white min-w-[4rem] text-center">
              {zoom}%
            </span>
                        <button
                            onClick={handleZoomIn}
                            disabled={zoom >= 500}
                            className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded-lg transition-colors"
                            title="Zoom in"
                        >
                            <ZoomIn className="w-5 h-5" strokeWidth={1.5}/>
                        </button>
                        <button
                            onClick={handleResetZoom}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                            title="Reset zoom"
                        >
                            <RotateCw className="w-5 h-5" strokeWidth={1.5}/>
                        </button>
                        <div className="w-px h-6 bg-white/20 mx-2"/>
                        <button
                            onClick={toggleFullscreen}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                            title="Exit fullscreen"
                        >
                            <Minimize2 className="w-5 h-5" strokeWidth={1.5}/>
                        </button>
                    </div>
                </div>

                {/* Fullscreen Image */}
                <div
                    ref={containerRef}
                    className="flex-1 overflow-auto"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    onWheel={handleWheel}
                    style={{cursor: zoom > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default'}}
                >
                    {partRenderUrl ? (
                        <div className="w-full h-full flex items-center justify-center p-8">
                            <img
                                ref={imageRef}
                                src={partRenderUrl}
                                alt="Part render"
                                style={{
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    transform: `translate(${position.x}px, ${position.y}px) scale(${zoom / 100})`,
                                    transformOrigin: 'center center',
                                    pointerEvents: 'none'
                                }}
                                className="transition-transform duration-100"
                                draggable={false}
                            />
                        </div>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-white">
                            <p>No render available</p>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 max-w-[1800px] mx-auto bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen">
            {renderFullscreenModal()}

            {/* Header */}
            <div className="flex items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-4">
                    <Link
                        to="/app/Documents"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                    >
                        <ArrowLeft
                            className="w-5 h-5 text-gray-600 group-hover:-translate-x-1 transition-transform"
                            strokeWidth={2}
                        />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{document.file_name}</h1>
                        <p className="text-sm text-gray-600">
                            {parts.length} {parts.length === 1 ? 'part' : 'parts'} detected
                        </p>
                    </div>
                </div>

                {/* Pravá část: favourite + status/priority + export */}
                <div className="flex items-end gap-4 pb-6">
                    {selectedPart && (
                        <PartActionsBar
                            partId={selectedPart.id}
                            canUseFavorite={canSetFavourite}
                            canSetStatus={canSetStatus}
                            canSetPriority={canSetPriority}
                            isFavorite={isFavorite}
                            onToggleFavorite={toggleFavorite}
                            favoriteLoading={favoriteLoading}
                            workflowStatus={workflowStatus}
                            onChangeWorkflowStatus={handleWorkflowStatusChange}
                            updatingStatus={updatingStatus}
                            priority={priority}
                            onChangePriority={handlePriorityChange}
                            updatingPriority={updatingPriority}
                        />
                    )}

                    {/* Export ve vlastním "sloupci" – stejné zarovnání jako Status / Priority */}
                    {selectedPartReport && (
                        <div className="flex flex-col items-start">
                            {/* buď prázdný label, nebo drobný text */}
                            <span className="text-[11px] font-medium text-gray-500 uppercase leading-none mb-1">
                                {/* nech klidně prázdné nebo třeba: */} &nbsp;
                            </span>

                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsExportMenuOpen(prev => !prev)}
                                    className="inline-flex items-center gap-2 px-4 h-9 text-sm font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm transition-colors"
                                >
                                    <Download className="w-4 h-4" strokeWidth={2}/>
                                    <span>Export</span>
                                    <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                                </button>

                                {isExportMenuOpen && (
                                    <div
                                        className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-20">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                exportJsonToExcel(
                                                    selectedPartReport,
                                                    selectedPart?.part_number ||
                                                    selectedPart?.display_name ||
                                                    "part_report"
                                                );
                                                setIsExportMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                        >
                                            Export to XLSX
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                exportJsonToText(
                                                    selectedPartReport,
                                                    selectedPart?.part_number ||
                                                    selectedPart?.display_name ||
                                                    "part_report"
                                                );
                                                setIsExportMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                        >
                                            Export to TXT
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                exportJson(
                                                    selectedPartReport,
                                                    selectedPart?.part_number ||
                                                    selectedPart?.part_number ||
                                                    "part_report"
                                                );
                                                setIsExportMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                        >
                                            Export to JSON
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Part navigation (šipky) pod headerem, společné pro levou i pravou část */}
            {parts.length > 0 && selectedPart && (
                <div className="mb-4 flex justify-center">
                    <div className="flex items-center gap-3 text-sm text-gray-700">

                        <button
                            type="button"
                            onClick={handlePrevPartClick}
                            disabled={!hasPrevPart}
                            className="p-1 disabled:opacity-30 hover:text-gray-800 transition"
                            title="Previous part"
                        >
                            <ChevronLeft className="w-4 h-4" strokeWidth={2}/>
                        </button>

                        <span className="font-medium text-gray-900">
                          {selectedPart.display_name || selectedPart.part_number || 'Part'}
                        </span>

                        <button
                            type="button"
                            onClick={handleNextPartClick}
                            disabled={!hasNextPart}
                            className="p-1 disabled:opacity-30 hover:text-gray-800 transition"
                            title="Next part"
                        >
                            <ChevronRight className="w-4 h-4" strokeWidth={2}/>
                        </button>

                        <span className="text-xs text-gray-500 ml-1">
                            {currentPartIndex + 1} / {parts.length}
                        </span>
                    </div>
                </div>
            )}


            {/* Main Content */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* Left: Part Data - 40% */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 xl:col-span-2">
                    {/* Tabs (bez nadpisu Report, jen karty) */}
                    <div className="border-b border-gray-200 mb-4">
                        <div className="flex items-center gap-6 -mb-px">
                            <button
                                onClick={() => setActiveReportTab('report')}
                                className={`px-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
                                    activeReportTab === 'report'
                                        ? 'border-blue-600 text-blue-700'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Report
                            </button>

                            <button
                                onClick={() => setActiveReportTab('bom')}
                                className={`px-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
                                    activeReportTab === 'bom'
                                        ? 'border-blue-600 text-blue-700'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Bill of Materials
                            </button>

                            <button
                                onClick={() => setActiveReportTab('revisions')}
                                className={`px-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
                                    activeReportTab === 'revisions'
                                        ? 'border-blue-600 text-blue-700'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Revision History
                            </button>
                            <button
                                onClick={() => setActiveReportTab("comments")}
                                className={`px-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
                                    activeReportTab === "comments"
                                        ? canComment
                                            ? "border-blue-600 text-blue-700"
                                            : "border-amber-500 text-amber-700"
                                        : canComment
                                            ? "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                                            : "border-transparent text-gray-400 hover:text-gray-500 hover:border-gray-200"
                                }`}
                            >
                                Comments
                            </button>

                        </div>
                    </div>


                    {/* Part Analysis Content / Tabs */}
                    {selectedPart && (selectedPart.report_json as any) ? (() => {
                        const reportJson = selectedPart.report_json as any;
                        const overview = reportJson.overview;
                        const assessment = reportJson.assessment;
                        const costDrivers = reportJson.cost_drivers;
                        const criticalPoints = reportJson.critical_points;
                        const processHints = reportJson.process_hints;
                        const internalNotes = reportJson.internal_notes;

                        const bom = reportJson.bill_of_materials as any[] | undefined;
                        const revisionHistory = reportJson.revision_history as any[] | undefined;

                        // TAB: BOM
                        if (activeReportTab === 'bom') {
                            return (
                                <div className="space-y-4">
                                    {/*<h3 className="text-sm font-semibold text-gray-900">Bill of Materials</h3>*/}
                                    {bom && bom.length > 0 ? (
                                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full text-xs">
                                                    <thead className="bg-slate-50">
                                                    <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500">
                                                        <th className="px-3 py-2 border-b border-gray-200">Part number
                                                        </th>
                                                        <th className="px-3 py-2 border-b border-gray-200">Qty</th>
                                                        <th className="px-3 py-2 border-b border-gray-200">Unit</th>
                                                        <th className="px-3 py-2 border-b border-gray-200">Material</th>
                                                        <th className="px-3 py-2 border-b border-gray-200">Weight</th>
                                                        <th className="px-3 py-2 border-b border-gray-200">Std</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                    {bom.map((row, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/60">
                                                            <td className="px-3 py-2 text-gray-900 whitespace-nowrap">
                                                                {row.part_number || '-'}
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-900">
                                                                {row.quantity ?? '-'}
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-700">
                                                                {row.unit || '-'}
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-700">
                                                                {row.material || '-'}
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                                                {row.weight != null ? row.weight : '-'}{' '}
                                                                {row.weight_unit || ''}
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-700">
                                                                {row.std || '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div
                                                className="px-3 py-2 text-[11px] text-gray-500 border-t border-gray-100">
                                                Parsed from drawing BOM
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className="text-center py-8 text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg">
                                            No BOM data found in this report.
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        // TAB: Revision history
                        if (activeReportTab === 'revisions') {
                            return (
                                <div className="space-y-4">
                                    {/*<h3 className="text-sm font-semibold text-gray-900">Revision history</h3>*/}
                                    {revisionHistory && revisionHistory.length > 0 ? (
                                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                            <div className="overflow-x-auto">
                                                <table className="min-w-full text-xs">
                                                    <thead className="bg-slate-50">
                                                    <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500">
                                                        <th className="px-3 py-2 border-b border-gray-200">Date</th>
                                                        <th className="px-3 py-2 border-b border-gray-200">Author</th>
                                                        <th className="px-3 py-2 border-b border-gray-200">Rev</th>
                                                        <th className="px-3 py-2 border-b border-gray-200">Description</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                    {revisionHistory.map((row, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/60 align-top">
                                                            <td className="px-3 py-2 text-gray-900 whitespace-nowrap">
                                                                {row.date || '-'}
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                                                {row.author || '-'}
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                                                {row.rev_number ?? '-'}
                                                            </td>
                                                            <td className="px-3 py-2 text-gray-900">
                                                                {row.description || '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            <div
                                                className="px-3 py-2 text-[11px] text-gray-500 border-t border-gray-100">
                                                Parsed from drawing revision block
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className="text-center py-8 text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg">
                                            No revision history found in this report.
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        // TAB: Comments
                        // TAB: Comments
                        if (activeReportTab === "comments") {
                            // 🔒 plán nemá komentáře – ukážeme jen upgrade flag
                            if (!canComment) {
                                return (
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-sm font-semibold text-gray-900">Comments</h3>
                                            <span
                                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-50 text-amber-700 border border-amber-200">
            Upgrade
          </span>
                                        </div>

                                        <div
                                            className="text-xs text-gray-600 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-3">
                                            Team comments are available on paid collaboration plans.
                                            Go to{" "}
                                            <Link
                                                to="/Settings/Billing"
                                                className="text-blue-600 hover:underline font-medium"
                                            >
                                                Billing
                                            </Link>{" "}
                                            to upgrade and unlock comments for your team.
                                        </div>
                                    </div>
                                );
                            }

                            // ✅ plán komentáře má – původní UI
                            return (
                                <div className="flex flex-col h-full gap-4">
                                    {/* Info / errors */}
                                    {commentsError && (
                                        <div
                                            className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                                            {commentsError}
                                        </div>
                                    )}

                                    {/* Seznam komentářů */}
                                    <div
                                        className="flex-1 border border-gray-200 rounded-lg bg-white overflow-auto max-h-[320px]">
                                        {commentsLoading ? (
                                            <div
                                                className="flex items-center justify-center py-8 text-gray-500 text-sm">
                                                <Loader className="w-4 h-4 mr-2 animate-spin" strokeWidth={1.5}/>
                                                Loading comments…
                                            </div>
                                        ) : comments.length === 0 ? (
                                            <div
                                                className="flex items-center justify-center py-8 text-gray-400 text-sm">
                                                No comments for this part yet.
                                            </div>
                                        ) : (
                                            <ul className="divide-y divide-gray-100">
                                                {comments.map((c) => (
                                                    <li key={c.id} className="px-4 py-3 text-sm hover:bg-slate-50/70">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-1">
                                                                      <span className="font-medium text-gray-900">
                                                                        {c.author_name || "User"}
                                                                      </span>
                                                                    {c.created_at && (
                                                                        <span className="text-[11px] text-gray-500">
                                                                          {new Date(c.created_at).toLocaleString()}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-gray-800 whitespace-pre-line">{c.body}</p>
                                                            </div>
                                                        </div>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {/* Formulář pro nový komentář */}
                                    <form
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            if (!newComment.trim()) return;
                                            await addComment(newComment);
                                            setNewComment("");
                                        }}
                                        className="space-y-2"
                                    >
                                        <label className="text-xs font-medium text-gray-700">
                                            Add comment
                                        </label>
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            rows={3}
                                            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                            placeholder="Write a note for your team…"
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={!newComment.trim()}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-500 transition-colors"
                                            >
                                                Add comment
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            );
                        }


                        // TAB: Report (default) – původní obsah
                        return (
                            <div className="space-y-4">
                                {/* Quick Summary */}
                                {overview?.quick_summary && (
                                    <div
                                        className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4">
                                        <h3 className="text-sm font-semibold text-blue-900 mb-2">Summary</h3>
                                        <p className="text-sm text-blue-800 leading-relaxed">{overview.quick_summary}</p>
                                    </div>
                                )}

                                {/* Key Metrics Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    {assessment?.overall_complexity && (
                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Complexity</dt>
                                            <dd
                                                className={`inline-flex px-2.5 py-1 rounded-md border text-xs font-semibold ${
                                                    assessment.overall_complexity === 'EXTREME' || assessment.overall_complexity === 'HIGH'
                                                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                                                        : assessment.overall_complexity === 'MEDIUM'
                                                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                                                            : assessment.overall_complexity === 'LOW'
                                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                                : 'bg-gray-50 text-gray-700 border-gray-300'
                                                }`}
                                            >
                                                {assessment.overall_complexity}
                                            </dd>
                                        </div>
                                    )}
                                    {assessment?.manufacturing_risk_level && (
                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                Risk Level
                                            </dt>
                                            <dd
                                                className={`inline-flex px-2.5 py-1 rounded-md border text-xs font-semibold ${
                                                    assessment.manufacturing_risk_level === 'EXTREME' || assessment.manufacturing_risk_level === 'HIGH'
                                                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                                                        : assessment.manufacturing_risk_level === 'MEDIUM'
                                                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                                                            : assessment.manufacturing_risk_level === 'LOW'
                                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                                : 'bg-gray-50 text-gray-700 border-gray-300'
                                                }`}
                                            >
                                                {assessment.manufacturing_risk_level}
                                            </dd>
                                        </div>
                                    )}
                                    {overview?.highlight_summary && Array.isArray(overview.highlight_summary) && (
                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 col-span-2">
                                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Highlights</dt>
                                            <dd className="text-xs text-gray-900">
                                                <ul className="list-disc list-inside space-y-1">
                                                    {overview.highlight_summary.map((item: string, idx: number) => (
                                                        <li key={idx}>{item}</li>
                                                    ))}
                                                </ul>
                                            </dd>
                                        </div>
                                    )}
                                    {assessment?.shop_alignment && (
                                        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 col-span-2">
                                            <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                Shop Alignment
                                            </dt>
                                            <dd className="text-sm">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-gray-700">Fit:</span>
                                                    <span
                                                        className={`inline-flex px-2.5 py-1 rounded-md border text-xs font-medium ${
                                                            assessment.shop_alignment.fit_level === 'GOOD'
                                                                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                                                : assessment.shop_alignment.fit_level === 'PARTIAL'
                                                                    ? 'bg-blue-50 text-blue-800 border-blue-300'
                                                                    : assessment.shop_alignment.fit_level === 'COOPERATION'
                                                                        ? 'bg-purple-50 text-purple-800 border-purple-300'
                                                                        : assessment.shop_alignment.fit_level === 'LOW'
                                                                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                                                                            : 'bg-gray-50 text-gray-600 border-gray-300'
                                                        }`}
                                                    >
                            {assessment.shop_alignment.fit_level}
                          </span>
                                                </div>
                                                <div className="text-xs text-gray-900">
                                                    {assessment.shop_alignment.fit_summary}
                                                </div>
                                                {assessment?.shop_alignment?.fit_level === 'UNKNOWN' && (
                                                    <div
                                                        className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                                                        Note: Fill your organization profile in Settings to get a
                                                        personalized
                                                        fit recommendation for your shop.
                                                    </div>
                                                )}
                                            </dd>
                                        </div>
                                    )}
                                </div>

                                {/* Collapsible Sections */}
                                <div className="space-y-2">


                                    {/* Cost Drivers */}
                                    {costDrivers && Array.isArray(costDrivers) && (
                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => toggleSection('cost')}
                                                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                                            >
                        <span className="text-sm font-semibold text-gray-900">
                          Cost Drivers
                          <span className="ml-1 italic text-[11px] text-gray-500">
                            (Quote Centric)
                          </span>
                        </span>
                                                {expandedSections['cost'] ? (
                                                    <ChevronUp className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                                                )}
                                            </button>
                                            {expandedSections['cost'] && (
                                                <div className="p-4 bg-white space-y-3">
                                                    {costDrivers.map((driver: any, idx: number) => (
                                                        <div
                                                            key={idx}
                                                            className={`border-l-2 pl-3 ${
                                                                driver.impact === 'EXTREME'
                                                                    ? 'border-red-400'
                                                                    : driver.impact === 'HIGH'
                                                                        ? 'border-orange-400'
                                                                        : driver.impact === 'MEDIUM'
                                                                            ? 'border-yellow-400'
                                                                            : 'border-green-400'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-gray-900">
                                  {driver.factor}
                                </span>
                                                                <span
                                                                    className={`text-xs px-2 py-0.5 rounded ${
                                                                        driver.impact === 'EXTREME'
                                                                            ? 'bg-red-100 text-red-800'
                                                                            : driver.impact === 'HIGH'
                                                                                ? 'bg-orange-100 text-yellow-800'
                                                                                : driver.impact === 'MEDIUM'
                                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                                    : 'bg-green-100 text-green-800'
                                                                    }`}
                                                                >
                                  {driver.impact}
                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-600">{driver.details}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Processing Hints */}
                                    {processHints && (
                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => toggleSection('processing')}
                                                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                                            >
                        <span className="text-sm font-semibold text-gray-900">
                          Processing Hints
                        </span>
                                                {expandedSections['processing'] ? (
                                                    <ChevronUp className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                                                )}
                                            </button>
                                            {expandedSections['processing'] && (
                                                <div className="p-4 bg-white space-y-3">
                                                    {processHints.likely_routing_steps && (
                                                        <div>
                                                            <dt className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                                                Routing Steps
                                                            </dt>
                                                            <div className="flex flex-wrap gap-2">
                                                                {processHints.likely_routing_steps.map((step: string, idx: number) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="text-xs bg-gray-100 px-2 py-1 rounded"
                                                                    >
                                    {step}
                                  </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                    {processHints.machine_capability_hint && (
                                                        <div>
                                                            <dt className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                                                Machine Capability
                                                            </dt>
                                                            <ul className="space-y-1">
                                                                {processHints.machine_capability_hint.map((item: string, idx: number) => (
                                                                    <li key={idx} className="text-xs text-gray-900">
                                                                        • {item}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {processHints.inspection_focus && (
                                                        <div>
                                                            <dt className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                                                Inspection Focus
                                                            </dt>
                                                            <ul className="space-y-1">
                                                                {processHints.inspection_focus.map((item: string, idx: number) => (
                                                                    <li key={idx} className="text-xs text-gray-900">
                                                                        • {item}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Critical Points */}
                                    {criticalPoints && Array.isArray(criticalPoints) && (
                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => toggleSection('critical')}
                                                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                                            >
                        <span className="text-sm font-semibold text-gray-900">
                          Critical Points
                          <span className="ml-1 italic text-[11px] text-gray-500">
                            (Production Centric)
                          </span>
                        </span>
                                                {expandedSections['critical'] ? (
                                                    <ChevronUp className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                                                )}
                                            </button>
                                            {expandedSections['critical'] && (
                                                <div className="p-4 bg-white space-y-3">
                                                    {criticalPoints.map((point: any, idx: number) => (
                                                        <div
                                                            key={idx}
                                                            className={`border-l-2 pl-3 ${
                                                                point.importance === 'EXTREME'
                                                                    ? 'border-red-400'
                                                                    : point.importance === 'HIGH'
                                                                        ? 'border-orange-400'
                                                                        : point.importance === 'MEDIUM'
                                                                            ? 'border-yellow-400'
                                                                            : 'border-green-400'
                                                            }`}
                                                        >
                                                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-gray-900 capitalize">
                                  {point.type.replace(/_/g, ' ')}
                                </span>
                                                                <span
                                                                    className={`text-xs px-2 py-0.5 rounded ${
                                                                        point.importance === 'EXTREME'
                                                                            ? 'bg-red-100 text-red-800'
                                                                            : point.importance === 'HIGH'
                                                                                ? 'bg-orange-100 text-yellow-800'
                                                                                : point.importance === 'MEDIUM'
                                                                                    ? 'bg-yellow-100 text-yellow-800'
                                                                                    : 'bg-green-100 text-green-800'
                                                                    }`}
                                                                >
                                  {point.importance}
                                </span>
                                                            </div>
                                                            <p className="text-xs text-gray-600">{point.description}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Key Risks & Opportunities */}
                                    {(assessment?.key_risks || assessment?.key_opportunities) && (
                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => toggleSection('risks')}
                                                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                                            >
                        <span className="text-sm font-semibold text-gray-900">
                          Key Risks & Opportunities
                        </span>
                                                {expandedSections['risks'] ? (
                                                    <ChevronUp className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                                                )}
                                            </button>
                                            {expandedSections['risks'] && (
                                                <div className="p-4 bg-white space-y-4">
                                                    {assessment.key_risks && Array.isArray(assessment.key_risks) && (
                                                        <div>
                                                            <dt className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">
                                                                Risks
                                                            </dt>
                                                            <ul className="space-y-2">
                                                                {assessment.key_risks.map((risk: string, idx: number) => (
                                                                    <li
                                                                        key={idx}
                                                                        className="text-sm text-gray-900 pl-4 border-l-2 border-red-300"
                                                                    >
                                                                        {risk}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    {assessment.key_opportunities && Array.isArray(assessment.key_opportunities) && (
                                                        <div>
                                                            <dt className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">
                                                                Opportunities
                                                            </dt>
                                                            <ul className="space-y-2">
                                                                {assessment.key_opportunities.map((opp: string, idx: number) => (
                                                                    <li
                                                                        key={idx}
                                                                        className="text-sm text-gray-900 pl-4 border-l-2 border-green-300"
                                                                    >
                                                                        {opp}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Internal Notes */}
                                    {internalNotes && Array.isArray(internalNotes) && (
                                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                                            <button
                                                onClick={() => toggleSection('notes')}
                                                className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                                            >
                        <span className="text-sm font-semibold text-gray-900">
                          Internal Notes
                        </span>
                                                {expandedSections['notes'] ? (
                                                    <ChevronUp className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                                                ) : (
                                                    <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                                                )}
                                            </button>
                                            {expandedSections['notes'] && (
                                                <div className="p-4 bg-white">
                                                    <ul className="space-y-2">
                                                        {internalNotes.map((note: string, idx: number) => (
                                                            <li
                                                                key={idx}
                                                                className="text-sm text-gray-700 pl-4 border-l-2 border-gray-300"
                                                            >
                                                                {note}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })() : (
                        <div className="text-center py-12 text-gray-500">
                            <p>No analysis data available</p>
                        </div>
                    )}
                </div>


                {/* Right: Part Render with Zoom - 60% */}
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 xl:col-span-3">
                    {/* Header nad obrázkem: description (vlevo) + zoom (vpravo) */}
                    {selectedPart?.report_json && (() => {
                        const reportJson = selectedPart.report_json as any;
                        const overview = reportJson.overview;
                        const drawingInfo = reportJson.drawing_info;

                        if (!overview && !partRenderUrl) return null;

                        return (
                            <div className="mb-4 flex items-start justify-between gap-4">
                                {/* Vlevo: mini description */}
                                <div className="flex flex-col text-sm max-w-[65%]">
                                    {(overview?.part_type || drawingInfo?.part_type_desc) && (
                                        <div className="text-gray-900 font-semibold leading-snug">
                                            {overview?.part_type || drawingInfo?.part_type_desc}
                                        </div>
                                    )}

                                    {overview?.taxonomy?.application_hint && (
                                        <div className="text-gray-500 text-xs mt-0.5">
                                            {overview.taxonomy.application_hint}
                                        </div>
                                    )}
                                </div>

                                {/* Vpravo: zoom controls */}
                                {partRenderUrl && (
                                    <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1.5">
                                        <button
                                            onClick={handleZoomOut}
                                            disabled={zoom <= 25}
                                            className="p-2 bg-white hover:bg-gray-100 disabled:bg-slate-50 disabled:text-gray-300 rounded-md transition-colors shadow-sm"
                                            title="Zoom out"
                                        >
                                            <ZoomOut className="w-4 h-4" strokeWidth={2}/>
                                        </button>
                                        <span className="text-sm font-medium text-gray-700 min-w-[4rem] text-center">
            {zoom}%
          </span>
                                        <button
                                            onClick={handleZoomIn}
                                            disabled={zoom >= 300}
                                            className="p-2 bg-white hover:bg-gray-100 disabled:bg-slate-50 disabled:text-gray-300 rounded-md transition-colors shadow-sm"
                                            title="Zoom in"
                                        >
                                            <ZoomIn className="w-4 h-4" strokeWidth={2}/>
                                        </button>
                                        <button
                                            onClick={handleResetZoom}
                                            className="p-2 bg-white hover:bg-gray-100 rounded-md transition-colors shadow-sm"
                                            title="Reset zoom"
                                        >
                                            <RotateCw className="w-4 h-4" strokeWidth={2}/>
                                        </button>
                                        <div className="w-px h-6 bg-gray-300 mx-1"/>
                                        <button
                                            onClick={toggleFullscreen}
                                            className="p-2 bg-white hover:bg-gray-100 rounded-md transition-colors shadow-sm"
                                            title="Fullscreen"
                                        >
                                            <Maximize2 className="w-4 h-4" strokeWidth={2}/>
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })()}


                    {/* Image Container */}
                    <div
                        ref={containerRef}
                        className="border border-gray-200 rounded-lg overflow-auto bg-gray-50 relative select-none"
                        style={{
                            width: '100%',
                            height: containerHeight,
                            maxHeight: '80vh',
                            cursor: zoom > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                        }}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                        onWheel={handleWheel}
                    >
                        {imageLoading ? (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader className="w-8 h-8 text-gray-400 animate-spin" strokeWidth={1.5}/>
                            </div>
                        ) : partRenderUrl ? (
                            <div className="w-full h-full flex items-center justify-center p-4">
                                <img
                                    ref={imageRef}
                                    src={partRenderUrl}
                                    alt="Part render"
                                    style={{
                                        maxWidth: '100%',
                                        maxHeight: '100%',
                                        transform: `translate(${position.x}px, ${position.y}px) scale(${zoom / 100})`,
                                        transformOrigin: 'center center',
                                        pointerEvents: 'none'
                                    }}
                                    className="transition-transform duration-100"
                                    draggable={false}
                                />
                            </div>
                        ) : selectedPartId ? (
                            <div
                                className="absolute inset-0 flex items-center justify-center text-center text-gray-500">
                                <div>
                                    <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" strokeWidth={1.5}/>
                                    <p className="text-sm">No render available for this part</p>
                                </div>
                            </div>
                        ) : (
                            <div
                                className="absolute inset-0 flex items-center justify-center text-center text-gray-500">
                                <p className="text-sm">Select a part to view its render</p>
                            </div>
                        )}
                    </div>

                    {selectedPart?.report_json && (() => {
                        const reportJson = selectedPart.report_json as any;
                        const drawingInfo = reportJson.drawing_info;
                        const overview = reportJson.overview;

                        // když není ani drawingInfo ani overview, nic nezobrazíme
                        if (!drawingInfo && !overview) return null;

                        return (
                            <div className="mt-6 bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                                {/* === Drawing Information === */}
                                {drawingInfo && (
                                    <div className="p-6">
                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Drawing
                                            Information</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {drawingInfo.drawing_number && (
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                        Drawing Number
                                                    </dt>
                                                    <dd className="text-sm text-gray-900">{drawingInfo.drawing_number}</dd>
                                                </div>
                                            )}
                                            {drawingInfo.drawing_title && (
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                        Title
                                                    </dt>
                                                    <dd className="text-sm text-gray-900">{drawingInfo.drawing_title}</dd>
                                                </div>
                                            )}
                                            {drawingInfo.part_number && (
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                        Part Number
                                                    </dt>
                                                    <dd className="text-sm text-gray-900">{drawingInfo.part_number}</dd>
                                                </div>
                                            )}
                                            {drawingInfo.revision && (
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                        Revision
                                                    </dt>
                                                    <dd className="text-sm text-gray-900">{drawingInfo.revision}</dd>
                                                </div>
                                            )}
                                            {drawingInfo.date && (
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                        Date
                                                    </dt>
                                                    <dd className="text-sm text-gray-900">{drawingInfo.date}</dd>
                                                </div>
                                            )}
                                            {drawingInfo.revision_date && (
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                        Revision Date
                                                    </dt>
                                                    <dd className="text-sm text-gray-900">{drawingInfo.revision_date}</dd>
                                                </div>
                                            )}
                                            {drawingInfo.scale && (
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                        Scale
                                                    </dt>
                                                    <dd className="text-sm text-gray-900">{drawingInfo.scale}</dd>
                                                </div>
                                            )}
                                            {drawingInfo.base_unit && (
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                        Units
                                                    </dt>
                                                    <dd className="text-sm text-gray-900">{drawingInfo.base_unit}</dd>
                                                </div>
                                            )}
                                            {drawingInfo.author && (
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                        Author
                                                    </dt>
                                                    <dd className="text-sm text-gray-900">{drawingInfo.author}</dd>
                                                </div>
                                            )}
                                            {drawingInfo.checker && (
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                        Checker
                                                    </dt>
                                                    <dd className="text-sm text-gray-900">{drawingInfo.checker}</dd>
                                                </div>
                                            )}
                                            {drawingInfo.approver && (
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                        Approver
                                                    </dt>
                                                    <dd className="text-sm text-gray-900">{drawingInfo.approver}</dd>
                                                </div>
                                            )}
                                            {drawingInfo.sheet_info && (
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                        Sheet
                                                    </dt>
                                                    <dd className="text-sm text-gray-900">
                                                        {drawingInfo.sheet_info.sheet} of {drawingInfo.sheet_info.total_sheets}
                                                    </dd>
                                                </div>
                                            )}
                                            {drawingInfo.projection_type && (
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                        Projection Type
                                                    </dt>
                                                    <dd className="text-sm text-gray-900 capitalize">
                                                        {drawingInfo.projection_type}
                                                    </dd>
                                                </div>
                                            )}
                                            {drawingInfo.company_name && (
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                        Company
                                                    </dt>
                                                    <dd className="text-sm text-gray-900">{drawingInfo.company_name}</dd>
                                                </div>
                                            )}
                                            {drawingInfo.project_name && (
                                                <div>
                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                        Project
                                                    </dt>
                                                    <dd className="text-sm text-gray-900">{drawingInfo.project_name}</dd>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}


                                {/* === Material & Blank dimensions (vč. Weight) === */}
                                {overview && (overview.material || overview.blank_dimensions) && (
                                    <div className="p-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Material */}
                                            {overview.material && (
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Material</h3>
                                                    <div className="space-y-3">
                                                        {overview.material.value && (
                                                            <div>
                                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                                    Material
                                                                </dt>
                                                                <dd className="text-sm text-gray-900">
                                                                    {overview.material.value}
                                                                </dd>
                                                            </div>
                                                        )}
                                                        {overview.material.text && (
                                                            <div>
                                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                                    Note
                                                                </dt>
                                                                <dd className="text-sm text-gray-900">{overview.material.text}</dd>
                                                            </div>
                                                        )}

                                                        {/* Weight: value + unit */}
                                                        {overview.weight && overview.weight.value != null && (
                                                            <div>
                                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                                    Weight
                                                                </dt>
                                                                <dd className="text-sm text-gray-900">
                                                                    {overview.weight.value} {overview.weight.unit}
                                                                </dd>
                                                            </div>
                                                        )}

                                                        {overview.material.confidence !== undefined &&
                                                            overview.material.confidence !== null && (
                                                                <div>
                                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                                        Confidence
                                                                    </dt>
                                                                    <dd className="text-sm text-gray-900">
                                                                        {(overview.material.confidence * 100).toFixed(0)}%
                                                                    </dd>
                                                                </div>
                                                            )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Blank Dimensions */}
                                            {overview.blank_dimensions && (
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Blank
                                                        Dimensions</h3>
                                                    <div className="space-y-3">
                                                        {overview.blank_dimensions.text_norm && (
                                                            <div>
                                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                                    Dimensions
                                                                </dt>
                                                                <dd className="text-sm text-gray-900">
                                                                    {overview.blank_dimensions.text_norm}
                                                                </dd>
                                                            </div>
                                                        )}
                                                        {overview.blank_dimensions.text && (
                                                            <div>
                                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                                    Note
                                                                </dt>
                                                                <dd className="text-sm text-gray-900">
                                                                    {overview.blank_dimensions.text}
                                                                </dd>
                                                            </div>
                                                        )}
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {overview.blank_dimensions.unit && (
                                                                <div>
                                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                                        Unit
                                                                    </dt>
                                                                    <dd className="text-sm text-gray-900">
                                                                        {overview.blank_dimensions.unit}
                                                                    </dd>
                                                                </div>
                                                            )}
                                                            {overview.blank_dimensions.source && (
                                                                <div>
                                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                                        Source
                                                                    </dt>
                                                                    <dd className="text-sm text-gray-900">
                                                                        {overview.blank_dimensions.source}
                                                                    </dd>
                                                                </div>
                                                            )}
                                                            {overview.blank_dimensions.confidence !== undefined &&
                                                                overview.blank_dimensions.confidence !== null && (
                                                                    <div>
                                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                                            Confidence
                                                                        </dt>
                                                                        <dd className="text-sm text-gray-900">
                                                                            {(overview.blank_dimensions.confidence * 100).toFixed(0)}%
                                                                        </dd>
                                                                    </div>
                                                                )}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}


                            </div>
                        );
                    })()}

                    {/* Tags section */}
                    {selectedPart && (
                        <div className="pt-4 mb-4">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-gray-500" strokeWidth={1.5}/>
                                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                                      Tags
                                    </span>
                                </div>

                                {!canUseTags && (
                                    <span
                                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                                      Upgrade
                                    </span>
                                )}
                            </div>

                            {/* Locked state – jen info + šedý box */}
                            {!canUseTags ? (
                                <div
                                    className="text-xs text-gray-600 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2">
                                    Tags are available on collaboration plans. Go to{" "}
                                    <Link
                                        to="/Settings/Billing"
                                        className="text-blue-600 hover:underline font-medium"
                                    >
                                        Billing
                                    </Link>{" "}
                                    to upgrade and organize parts with tags.
                                </div>
                            ) : (
                                // Aktivní stav – chips + input
                                <div className="border border-gray-200 rounded-lg px-3 py-2 bg-slate-50">
                                    {tagsError && (
                                        <div className="mb-2 text-[11px] text-red-600">
                                            {tagsError}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-1 mb-2 min-h-[1.5rem]">
                                        {tagsLoading ? (
                                            <span className="text-xs text-gray-500">Loading tags…</span>
                                        ) : tags.length === 0 ? (
                                            <span className="text-xs text-gray-400">
              No tags yet. Add your first one below.
            </span>
                                        ) : (
                                            tags.map((t) => (
                                                <span
                                                    key={t.id}
                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-gray-200 text-xs text-gray-800"
                                                >
                {t.label}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeTag(t.id)}
                                                        className="ml-0.5 p-0.5 hover:bg-gray-100 rounded-full"
                                                    >
                  <X className="w-3 h-3 text-gray-500" strokeWidth={1.5}/>
                </button>
              </span>
                                            ))
                                        )}
                                    </div>

                                    <form
                                        onSubmit={async (e) => {
                                            e.preventDefault();
                                            const trimmed = newTag.trim();
                                            if (!trimmed) return;
                                            await addTag(trimmed);
                                            setNewTag("");
                                        }}
                                        className="flex items-center gap-2"
                                    >
                                        <input
                                            type="text"
                                            value={newTag}
                                            onChange={(e) => setNewTag(e.target.value)}
                                            placeholder="Add tag (e.g. RFQ, Priority A)"
                                            className="flex-1 text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                        />
                                        <button
                                            type="submit"
                                            disabled={!newTag.trim()}
                                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-500 transition-colors"
                                        >
                                            Add
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default DocumentDetail;
