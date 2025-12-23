import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Link, useLocation, useParams, useSearchParams} from 'react-router-dom';
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
    ZoomOut,
} from 'lucide-react';
import {supabase} from '../lib/supabase';
import {useAuth} from '../contexts/AuthContext';
import type {Database, PriorityEnum, WorkflowStatusEnum} from '../lib/database.types';
import {exportJsonToExcel} from '../utils/exportJsonToExcel';
import {exportJsonToText} from '../utils/exportJsonToText';
import {exportJson} from '../utils/exportJson';
import {usePartComments} from '../hooks/actions/usePartComments';
import {usePartTags} from '../hooks/actions/usePartTags';
import {useOrgBilling} from '../hooks/useOrgBilling';
import {PartActionsBar} from '../components/PartActionsBar';
import {useTranslation} from 'react-i18next';
import {useLang} from '../hooks/useLang.ts';
import {usePartDetailActions} from '../hooks/actions/usePartDetailActions';

type Document = Database['public']['Tables']['documents']['Row'];
type Part = Database['public']['Tables']['parts']['Row'];

type TagsPanelProps = {
    t: any;
    lang: string;
    canUseTags: boolean;
    selectedPart: Part | undefined;
    tags: { id: string; label: string }[];
    tagsLoading: boolean;
    tagsError: string | null;
    newTag: string;
    setNewTag: React.Dispatch<React.SetStateAction<string>>;
    addTag: (label: string) => Promise<void>;
    removeTag: (tagId: string) => Promise<void>;
};

const TagsPanel = React.memo(function TagsPanel(props: TagsPanelProps) {
    const {
        t,
        lang,
        canUseTags,
        selectedPart,
        tags,
        tagsLoading,
        tagsError,
        newTag,
        setNewTag,
        addTag,
        removeTag,
    } = props;

    if (!selectedPart) return null;

    return (
        <div className="pt-4">
            <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-gray-500" strokeWidth={1.5}/>
                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            {t('documents.detail.tags.title')}
          </span>
                </div>

                {!canUseTags && (
                    <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-50 text-amber-700 border border-amber-200">
            {t('documents.detail.upgrade')}
          </span>
                )}
            </div>

            {!canUseTags ? (
                <div
                    className="text-xs text-gray-600 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-2">
                    {t('documents.detail.tags.lockedPrefix')}{' '}
                    <Link to={`/${lang}/app/settings/billing`} className="text-blue-600 hover:underline font-medium">
                        {t('documents.detail.billing')}
                    </Link>{' '}
                    {t('documents.detail.tags.lockedSuffix')}
                </div>
            ) : (
                <div className="border border-gray-200 rounded-lg px-3 py-2 bg-slate-50">
                    {tagsError && <div className="mb-2 text-[11px] text-red-600">{tagsError}</div>}

                    <div className="flex flex-wrap gap-1 mb-2 min-h-[1.5rem]">
                        {tagsLoading ? (
                            <span className="text-xs text-gray-500">{t('documents.detail.tags.loading')}</span>
                        ) : tags.length === 0 ? (
                            <span className="text-xs text-gray-400">{t('documents.detail.tags.empty')}</span>
                        ) : (
                            tags.map(tItem => (
                                <span
                                    key={tItem.id}
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-gray-200 text-xs text-gray-800"
                                >
                  {tItem.label}
                                    <button
                                        type="button"
                                        onClick={() => removeTag(tItem.id)}
                                        className="ml-0.5 p-0.5 hover:bg-gray-100 rounded-full"
                                    >
                    <X className="w-3 h-3 text-gray-500" strokeWidth={1.5}/>
                  </button>
                </span>
                            ))
                        )}
                    </div>

                    <form
                        onSubmit={async e => {
                            e.preventDefault();
                            const trimmed = newTag.trim();
                            if (!trimmed) return;
                            await addTag(trimmed);
                            setNewTag('');
                        }}
                        className="flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={newTag}
                            onChange={e => setNewTag(e.target.value)}
                            placeholder={t('documents.detail.tags.placeholder')}
                            className="flex-1 text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        />
                        <button
                            type="submit"
                            disabled={!newTag.trim()}
                            className="px-2.5 py-1 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-500 transition-colors"
                        >
                            {t('documents.detail.tags.add')}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
});

type FullscreenModalProps = {
    t: any;
    isFullscreen: boolean;
    selectedPart: Part | undefined;
    partRenderUrl: string | null;
    zoom: number;
    isDragging: boolean;
    position: { x: number; y: number };
    imageRef: React.RefObject<HTMLImageElement>;
    fullscreenContainerRef: React.RefObject<HTMLDivElement>;
    onExit: () => void;
    onZoomOut: () => void;
    onZoomIn: () => void;
    onReset: () => void;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
    onWheel: (e: React.WheelEvent) => void;
};

const FullscreenModal = React.memo(function FullscreenModal(props: FullscreenModalProps) {
    const {
        t,
        isFullscreen,
        selectedPart,
        partRenderUrl,
        zoom,
        isDragging,
        position,
        imageRef,
        fullscreenContainerRef,
        onExit,
        onZoomOut,
        onZoomIn,
        onReset,
        onMouseDown,
        onMouseMove,
        onMouseUp,
        onMouseLeave,
        onWheel,
    } = props;

    if (!isFullscreen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
            <div className="flex items-center justify-between p-3 sm:p-4 bg-black/50 gap-3">
                <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold text-white truncate">
                        {selectedPart?.display_name || selectedPart?.part_number || t('documents.detail.partRenderTitle')}
                    </h2>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                        onClick={onExit}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                        title={t('documents.detail.actions.exitFullscreen')}
                    >
                        <Minimize2 className="w-5 h-5" strokeWidth={1.5}/>
                    </button>

                    <div className="hidden sm:flex items-center gap-2">
                        <button
                            onClick={onZoomOut}
                            disabled={zoom <= 25}
                            className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded-lg transition-colors"
                            title={t('documents.detail.actions.zoomOut')}
                        >
                            <ZoomOut className="w-5 h-5" strokeWidth={1.5}/>
                        </button>

                        <span className="text-sm text-white min-w-[4rem] text-center">{zoom}%</span>

                        <button
                            onClick={onZoomIn}
                            disabled={zoom >= 500}
                            className="p-2 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:text-white/30 text-white rounded-lg transition-colors"
                            title={t('documents.detail.actions.zoomIn')}
                        >
                            <ZoomIn className="w-5 h-5" strokeWidth={1.5}/>
                        </button>

                        <button
                            onClick={onReset}
                            className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
                            title={t('documents.detail.actions.resetZoom')}
                        >
                            <RotateCw className="w-5 h-5" strokeWidth={1.5}/>
                        </button>
                    </div>
                </div>
            </div>

            <div
                ref={fullscreenContainerRef}
                className="flex-1 overflow-auto"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseLeave}
                onWheel={onWheel}
                style={{cursor: zoom > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default'}}
            >
                {partRenderUrl ? (
                    <div className="w-full h-full flex items-center justify-center p-4 sm:p-8">
                        <img
                            ref={imageRef}
                            src={partRenderUrl}
                            alt={t('documents.detail.alts.partRender')}
                            style={{
                                maxWidth: '100%',
                                maxHeight: '100%',
                                transform: `translate(${position.x}px, ${position.y}px) scale(${zoom / 100})`,
                                transformOrigin: 'center center',
                                pointerEvents: 'none',
                            }}
                            className="transition-transform duration-100"
                            draggable={false}
                        />
                    </div>
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                        <p>{t('documents.detail.noRenderAvailable')}</p>
                    </div>
                )}
            </div>
        </div>
    );
});

type RenderHeaderProps = {
    t: any;
    selectedPart: Part | undefined;
    partRenderUrl: string | null;
    zoom: number;
    onZoomOut: () => void;
    onZoomIn: () => void;
    onReset: () => void;
    onFullscreen: () => void;
};

const RenderHeader = React.memo(function RenderHeader(props: RenderHeaderProps) {
    const {t, selectedPart, partRenderUrl, zoom, onZoomOut, onZoomIn, onReset, onFullscreen} = props;

    if (!selectedPart?.report_json && !partRenderUrl) return null;

    const reportJson = (selectedPart?.report_json as any) || {};
    const overview = reportJson.overview;
    const drawingInfo = reportJson.drawing_info;

    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
                {(overview?.part_type || drawingInfo?.part_type_desc) && (
                    <div className="text-gray-900 font-semibold leading-snug truncate">
                        {overview?.part_type || drawingInfo?.part_type_desc}
                    </div>
                )}
                {overview?.taxonomy?.application_hint && (
                    <div className="text-gray-500 text-xs mt-0.5">{overview.taxonomy.application_hint}</div>
                )}
            </div>

            {partRenderUrl && (
                <div
                    className="flex items-center justify-between sm:justify-end gap-2 bg-slate-50 rounded-lg p-1.5 w-full sm:w-auto">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onZoomOut}
                            disabled={zoom <= 25}
                            className="p-2 bg-white hover:bg-gray-100 disabled:bg-slate-50 disabled:text-gray-300 rounded-md transition-colors shadow-sm"
                            title={t('documents.detail.actions.zoomOut')}
                        >
                            <ZoomOut className="w-4 h-4" strokeWidth={2}/>
                        </button>

                        <span className="text-sm font-medium text-gray-700 min-w-[4rem] text-center">{zoom}%</span>

                        <button
                            onClick={onZoomIn}
                            disabled={zoom >= 300}
                            className="p-2 bg-white hover:bg-gray-100 disabled:bg-slate-50 disabled:text-gray-300 rounded-md transition-colors shadow-sm"
                            title={t('documents.detail.actions.zoomIn')}
                        >
                            <ZoomIn className="w-4 h-4" strokeWidth={2}/>
                        </button>

                        <button
                            onClick={onReset}
                            className="p-2 bg-white hover:bg-gray-100 rounded-md transition-colors shadow-sm"
                            title={t('documents.detail.actions.resetZoom')}
                        >
                            <RotateCw className="w-4 h-4" strokeWidth={2}/>
                        </button>
                    </div>

                    <div className="w-px h-6 bg-gray-300 mx-1 hidden sm:block"/>

                    <button
                        onClick={onFullscreen}
                        className="p-2 bg-white hover:bg-gray-100 rounded-md transition-colors shadow-sm flex-shrink-0"
                        title={t('documents.detail.actions.fullscreen')}
                    >
                        <Maximize2 className="w-4 h-4" strokeWidth={2}/>
                    </button>
                </div>
            )}
        </div>
    );
});

type RenderCanvasProps = {
    t: any;
    normalContainerRef: React.RefObject<HTMLDivElement>;
    imageRef: React.RefObject<HTMLImageElement>;
    imageLoading: boolean;
    partRenderUrl: string | null;
    selectedPartId: string | null;
    imageAspectRatio: number | null;
    zoom: number;
    isDragging: boolean;
    position: { x: number; y: number };
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseMove: (e: React.MouseEvent) => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
    onWheel: (e: React.WheelEvent) => void;
};

const RenderCanvas = React.memo(function RenderCanvas(props: RenderCanvasProps) {
    const {
        t,
        normalContainerRef,
        imageRef,
        imageLoading,
        partRenderUrl,
        selectedPartId,
        imageAspectRatio,
        zoom,
        isDragging,
        position,
        onMouseDown,
        onMouseMove,
        onMouseUp,
        onMouseLeave,
        onWheel,
    } = props;

    const fallbackAR = 4 / 3;
    const ar = imageAspectRatio && imageAspectRatio > 0 ? imageAspectRatio : fallbackAR;

    return (
        <div
            ref={normalContainerRef}
            className="border border-gray-200 rounded-lg overflow-auto bg-gray-50 relative select-none w-full"
            style={{
                aspectRatio: String(ar),
                maxHeight: '75vh',
                cursor: zoom > 100 ? (isDragging ? 'grabbing' : 'grab') : 'default',
            }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onWheel={onWheel}
        >
            {imageLoading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Loader className="w-8 h-8 text-gray-400 animate-spin" strokeWidth={1.5}/>
                </div>
            ) : partRenderUrl ? (
                <div className="w-full h-full flex items-center justify-center p-3 sm:p-4">
                    <img
                        ref={imageRef}
                        src={partRenderUrl}
                        alt={t('documents.detail.alts.partRender')}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom / 100})`,
                            transformOrigin: 'center center',
                            pointerEvents: 'none',
                        }}
                        className="transition-transform duration-100"
                        draggable={false}
                    />
                </div>
            ) : selectedPartId ? (
                <div className="absolute inset-0 flex items-center justify-center text-center text-gray-500">
                    <div className="px-6">
                        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" strokeWidth={1.5}/>
                        <p className="text-sm">{t('documents.detail.noRenderForPart')}</p>
                    </div>
                </div>
            ) : (
                <div className="absolute inset-0 flex items-center justify-center text-center text-gray-500">
                    <p className="text-sm">{t('documents.detail.selectPartToView')}</p>
                </div>
            )}
        </div>
    );
});

const DocumentDetail: React.FC = () => {
    const {t} = useTranslation();
    const lang = useLang();
    const {documentId} = useParams<{ documentId: string }>();
    const [searchParams] = useSearchParams();
    const partIdFromUrl = searchParams.get('partId');

    const {user, currentOrg} = useAuth();
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

    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

    const [newComment, setNewComment] = useState('');
    const [newTag, setNewTag] = useState('');

    const [activeReportTab, setActiveReportTab] = useState<'report' | 'bom' | 'revisions' | 'comments'>('report');
    const [mobileMainTab, setMobileMainTab] = useState<'preview' | 'details'>('preview');

    const imageRef = useRef<HTMLImageElement>(null);
    const normalContainerRef = useRef<HTMLDivElement>(null);
    const fullscreenContainerRef = useRef<HTMLDivElement>(null);

    const location = useLocation();
    const backTo = (location.state as any)?.from ?? `/${lang}/app/documents`;

    const toggleSection = useCallback((section: string) => {
        setExpandedSections(prev => ({...prev, [section]: !prev[section]}));
    }, []);

    useEffect(() => {
        if (!documentId || !currentOrg) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const {data: docData, error: docError} = await supabase
                    .from('documents')
                    .select('*')
                    .eq('id', documentId)
                    .eq('org_id', currentOrg.org_id)
                    .single();

                if (docError) throw new Error(docError.message);
                if (!docData) throw new Error('Document not found');

                setDocument(docData);

                const {data: partsData, error: partsError} = await supabase
                    .from('document_parts')
                    .select(
                        `
              part_id,
              parts (*)
            `,
                    )
                    .eq('document_id', documentId);

                if (partsError) {
                    console.error('Error fetching parts:', partsError);
                } else if (partsData) {
                    const fetchedParts = partsData
                        .map(dp => dp.parts as unknown as Part | null)
                        .filter((p): p is Part => p !== null);

                    setParts(fetchedParts);

                    if (partIdFromUrl && fetchedParts.some(p => p.id === partIdFromUrl)) {
                        setSelectedPartId(partIdFromUrl);
                    } else if (fetchedParts.length > 0) {
                        setSelectedPartId(fetchedParts[0].id);
                    }
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : t('documents.detail.errors.failedToLoad'));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [documentId, currentOrg, partIdFromUrl, t]);

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
                .createSignedUrl(part.render_storage_key, 3600);

            if (error) {
                console.error('Error fetching render:', error);
            } else if (data?.signedUrl) {
                setPartRenderUrl(data.signedUrl);

                const img = new Image();
                img.onload = () => {
                    setImageAspectRatio(img.width / img.height);
                    setPosition({x: 0, y: 0});
                    if (normalContainerRef.current) {
                        normalContainerRef.current.scrollTop = 0;
                        normalContainerRef.current.scrollLeft = 0;
                    }
                    if (fullscreenContainerRef.current) {
                        fullscreenContainerRef.current.scrollTop = 0;
                        fullscreenContainerRef.current.scrollLeft = 0;
                    }
                };
                img.src = data.signedUrl;
            }

            setImageLoading(false);
        };

        fetchPartRender();
    }, [selectedPartId, parts]);

    const selectedPart = useMemo(() => parts.find(p => p.id === selectedPartId), [parts, selectedPartId]);
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
        currentOrg?.org_id,
    );

    const {tags, loading: tagsLoading, error: tagsError, addTag, removeTag} = usePartTags(
        selectedPartId ?? null,
        currentOrg?.org_id,
    );

    const handleZoomIn = useCallback(() => setZoom(prev => Math.min(prev + 25, 500)), []);
    const handleZoomOut = useCallback(() => setZoom(prev => Math.max(prev - 25, 25)), []);
    const handleResetZoom = useCallback(() => {
        setZoom(100);
        setPosition({x: 0, y: 0});
    }, []);

    const toggleFullscreen = useCallback(() => {
        setIsFullscreen(prev => !prev);
        setZoom(100);
        setPosition({x: 0, y: 0});
    }, []);

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (zoom > 100) {
            e.preventDefault();
            setIsDragging(true);
            setDragStart({x: e.clientX - position.x, y: e.clientY - position.y});
        }
    }, [zoom, position.x, position.y]);

    const handleMouseMove = useCallback((e: React.MouseEvent) => {
        if (isDragging && zoom > 100) {
            setPosition({x: e.clientX - dragStart.x, y: e.clientY - dragStart.y});
        }
    }, [isDragging, zoom, dragStart.x, dragStart.y]);

    const handleMouseUp = useCallback(() => setIsDragging(false), []);
    const handleMouseLeave = useCallback(() => setIsDragging(false), []);

    const handleWheel = useCallback((e: React.WheelEvent) => {
        if (!partRenderUrl) return;
        e.preventDefault();
        if (e.deltaY < 0) setZoom(prev => Math.min(prev + 10, 400));
        else setZoom(prev => Math.max(prev - 10, 25));
    }, [partRenderUrl]);

    useEffect(() => {
        if (zoom <= 100) setPosition({x: 0, y: 0});
    }, [zoom]);

    const currentPartIndex = useMemo(() => (selectedPart ? parts.findIndex(p => p.id === selectedPart.id) : -1), [parts, selectedPart]);
    const hasPrevPart = currentPartIndex > 0;
    const hasNextPart = currentPartIndex >= 0 && currentPartIndex < parts.length - 1;

    const handlePrevPartClick = useCallback(() => {
        if (!selectedPart) return;
        const idx = parts.findIndex(p => p.id === selectedPart.id);
        if (idx > 0) setSelectedPartId(parts[idx - 1].id);
    }, [parts, selectedPart]);

    const handleNextPartClick = useCallback(() => {
        if (!selectedPart) return;
        const idx = parts.findIndex(p => p.id === selectedPart.id);
        if (idx >= 0 && idx < parts.length - 1) setSelectedPartId(parts[idx + 1].id);
    }, [parts, selectedPart]);

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
                            {t('documents.detail.documentNotFound.title')}
                        </h2>
                        <p className="text-sm text-gray-500 mb-4">
                            {error || t('documents.detail.documentNotFound.description')}
                        </p>
                        <Link
                            to={backTo}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" strokeWidth={1.5}/>
                            {t('documents.detail.backToDocuments')}
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
                isFullscreen={isFullscreen}
                selectedPart={selectedPart}
                partRenderUrl={partRenderUrl}
                zoom={zoom}
                isDragging={isDragging}
                position={position}
                imageRef={imageRef}
                fullscreenContainerRef={fullscreenContainerRef}
                onExit={toggleFullscreen}
                onZoomOut={handleZoomOut}
                onZoomIn={handleZoomIn}
                onReset={handleResetZoom}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseLeave}
                onWheel={handleWheel}
            />

            {/* Header */}
            <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="flex items-start gap-3 min-w-0">
                    <Link to={backTo}
                          className="p-2 hover:bg-gray-100 rounded-lg transition-colors group flex-shrink-0">
                        <ArrowLeft className="w-5 h-5 text-gray-600 group-hover:-translate-x-1 transition-transform"
                                   strokeWidth={2}/>
                    </Link>

                    <div className="min-w-0">
                        <h1 className="text-lg sm:text-2xl font-bold text-gray-900 truncate">{document.file_name}</h1>
                        <p className="text-sm text-gray-600">{t('documents.detail.partsDetected', {count: parts.length})}</p>
                    </div>
                </div>

                <div className="w-full sm:w-auto">
                    <div className="flex flex-wrap items-end gap-2 sm:gap-4 justify-start sm:justify-end">
                        {selectedPart && (
                            <PartActionsBar
                                partId={selectedPart.id}
                                canUseFavorite={canSetFavourite}
                                canSetStatus={canSetStatus}
                                canSetPriority={canSetPriority}
                                isFavorite={detailActions.isFavorite}
                                onToggleFavorite={detailActions.toggleFavorite}
                                favoriteLoading={detailActions.favoriteLoading}
                                workflowStatus={workflowStatus}
                                onChangeWorkflowStatus={detailActions.onChangeWorkflowStatus}
                                updatingStatus={detailActions.updatingStatus}
                                priority={priority}
                                onChangePriority={detailActions.onChangePriority}
                                updatingPriority={detailActions.updatingPriority}
                            />
                        )}

                        {selectedPartReport && (
                            <div className="relative flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => setIsExportMenuOpen(prev => !prev)}
                                    className="inline-flex items-center gap-2 px-3 sm:px-4 h-9 text-sm font-medium rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-sm transition-colors"
                                >
                                    <Download className="w-4 h-4" strokeWidth={2}/>
                                    <span className="hidden sm:inline">{t('documents.detail.export')}</span>
                                    <ChevronDown className="w-4 h-4 text-gray-500" strokeWidth={2}/>
                                </button>

                                {isExportMenuOpen && (
                                    <div
                                        className="absolute right-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-50">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                exportJsonToExcel(
                                                    selectedPartReport,
                                                    selectedPart?.part_number || selectedPart?.display_name || 'part_report',
                                                );
                                                setIsExportMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                        >
                                            {t('documents.detail.exportToXlsx')}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                exportJsonToText(
                                                    selectedPartReport,
                                                    selectedPart?.part_number || selectedPart?.display_name || 'part_report',
                                                );
                                                setIsExportMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                        >
                                            {t('documents.detail.exportToTxt')}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                exportJson(
                                                    selectedPartReport,
                                                    selectedPart?.part_number || selectedPart?.display_name || 'part_report',
                                                );
                                                setIsExportMenuOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                        >
                                            {t('documents.detail.exportToJson')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Part navigation */}
            {parts.length > 0 && selectedPart && (
                <div className="mb-4 flex justify-center">
                    <div className="flex items-center gap-3 text-sm text-gray-700">
                        <button
                            type="button"
                            onClick={handlePrevPartClick}
                            disabled={!hasPrevPart}
                            className="p-1 disabled:opacity-30 hover:text-gray-800 transition"
                            title={t('documents.detail.actions.previousPart')}
                        >
                            <ChevronLeft className="w-4 h-4" strokeWidth={2}/>
                        </button>

                        <span className="font-medium text-gray-900 truncate max-w-[16rem] sm:max-w-none">
              {selectedPart.display_name || selectedPart.part_number || t('documents.detail.part')}
            </span>

                        <button
                            type="button"
                            onClick={handleNextPartClick}
                            disabled={!hasNextPart}
                            className="p-1 disabled:opacity-30 hover:text-gray-800 transition"
                            title={t('documents.detail.actions.nextPart')}
                        >
                            <ChevronRight className="w-4 h-4" strokeWidth={2}/>
                        </button>

                        <span className="text-xs text-gray-500 ml-1">
              {currentPartIndex + 1} / {parts.length}
            </span>
                    </div>
                </div>
            )}

            {/* Mobile: main tabs */}
            <div className="xl:hidden mb-4">
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-2">
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setMobileMainTab('preview')}
                            className={`h-10 rounded-lg text-sm font-medium transition-colors ${
                                mobileMainTab === 'preview'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                            }`}
                        >
                            {t('documents.detail.tabs.preview') ?? 'Preview'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setMobileMainTab('details')}
                            className={`h-10 rounded-lg text-sm font-medium transition-colors ${
                                mobileMainTab === 'details'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                            }`}
                        >
                            {t('documents.detail.tabs.details') ?? 'Details'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-4 sm:gap-6">
                {/* Left / Details */}
                <div
                    className={`bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6 xl:col-span-2 min-h-0 ${mobileMainTab === 'preview' ? 'hidden xl:block' : ''}`}>
                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-4">
                        <div className="flex items-center gap-6 -mb-px overflow-x-auto">
                            <button
                                onClick={() => setActiveReportTab('report')}
                                className={`px-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
                                    activeReportTab === 'report'
                                        ? 'border-blue-600 text-blue-700'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {t('documents.detail.tabs.report')}
                            </button>

                            <button
                                onClick={() => setActiveReportTab('bom')}
                                className={`px-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
                                    activeReportTab === 'bom'
                                        ? 'border-blue-600 text-blue-700'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {t('documents.detail.tabs.bom')}
                            </button>

                            <button
                                onClick={() => setActiveReportTab('revisions')}
                                className={`px-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
                                    activeReportTab === 'revisions'
                                        ? 'border-blue-600 text-blue-700'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {t('documents.detail.tabs.revisions')}
                            </button>

                            <button
                                onClick={() => setActiveReportTab('comments')}
                                className={`px-1 pb-2 text-sm font-medium border-b-2 transition-colors ${
                                    activeReportTab === 'comments'
                                        ? canComment
                                            ? 'border-blue-600 text-blue-700'
                                            : 'border-amber-500 text-amber-700'
                                        : canComment
                                            ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                            : 'border-transparent text-gray-400 hover:text-gray-500 hover:border-gray-200'
                                }`}
                            >
                                {t('documents.detail.tabs.comments')}
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    {selectedPart && (selectedPart.report_json as any) ? (
                        (() => {
                            const reportJson = selectedPart.report_json as any;
                            const overview = reportJson.overview;
                            const assessment = reportJson.assessment;
                            const costDrivers = reportJson.cost_drivers;
                            const criticalPoints = reportJson.critical_points;
                            const processHints = reportJson.process_hints;
                            const internalNotes = reportJson.internal_notes;

                            const bom = reportJson.bill_of_materials as any[] | undefined;
                            const revisionHistory = reportJson.revision_history as any[] | undefined;

                            if (activeReportTab === 'bom') {
                                return (
                                    <div className="space-y-4">
                                        {bom && bom.length > 0 ? (
                                            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full text-xs">
                                                        <thead className="bg-slate-50">
                                                        <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500">
                                                            <th className="px-3 py-2 border-b border-gray-200">{t('documents.detail.bom.headers.partNumber')}</th>
                                                            <th className="px-3 py-2 border-b border-gray-200">{t('documents.detail.bom.headers.qty')}</th>
                                                            <th className="px-3 py-2 border-b border-gray-200">{t('documents.detail.bom.headers.unit')}</th>
                                                            <th className="px-3 py-2 border-b border-gray-200">{t('documents.detail.bom.headers.material')}</th>
                                                            <th className="px-3 py-2 border-b border-gray-200">{t('documents.detail.bom.headers.weight')}</th>
                                                            <th className="px-3 py-2 border-b border-gray-200">{t('documents.detail.bom.headers.std')}</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                        {bom.map((row, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-50/60">
                                                                <td className="px-3 py-2 text-gray-900 whitespace-nowrap">{row.part_number || '-'}</td>
                                                                <td className="px-3 py-2 text-gray-900">{row.quantity ?? '-'}</td>
                                                                <td className="px-3 py-2 text-gray-700">{row.unit || '-'}</td>
                                                                <td className="px-3 py-2 text-gray-700">{row.material || '-'}</td>
                                                                <td className="px-3 py-2 text-gray-700 whitespace-nowrap">
                                                                    {row.weight != null ? row.weight : '-'} {row.weight_unit || ''}
                                                                </td>
                                                                <td className="px-3 py-2 text-gray-700">{row.std || '-'}</td>
                                                            </tr>
                                                        ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div
                                                    className="px-3 py-2 text-[11px] text-gray-500 border-t border-gray-100">
                                                    {t('documents.detail.bom.parsedFromDrawing')}
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className="text-center py-8 text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg">
                                                {t('documents.detail.bom.noData')}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            if (activeReportTab === 'revisions') {
                                return (
                                    <div className="space-y-4">
                                        {revisionHistory && revisionHistory.length > 0 ? (
                                            <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
                                                <div className="overflow-x-auto">
                                                    <table className="min-w-full text-xs">
                                                        <thead className="bg-slate-50">
                                                        <tr className="text-left text-[11px] uppercase tracking-wider text-gray-500">
                                                            <th className="px-3 py-2 border-b border-gray-200">{t('documents.detail.revisions.headers.date')}</th>
                                                            <th className="px-3 py-2 border-b border-gray-200">{t('documents.detail.revisions.headers.author')}</th>
                                                            <th className="px-3 py-2 border-b border-gray-200">{t('documents.detail.revisions.headers.rev')}</th>
                                                            <th className="px-3 py-2 border-b border-gray-200">{t('documents.detail.revisions.headers.description')}</th>
                                                        </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-100">
                                                        {revisionHistory.map((row, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-50/60 align-top">
                                                                <td className="px-3 py-2 text-gray-900 whitespace-nowrap">{row.date || '-'}</td>
                                                                <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{row.author || '-'}</td>
                                                                <td className="px-3 py-2 text-gray-700 whitespace-nowrap">{row.rev_number ?? '-'}</td>
                                                                <td className="px-3 py-2 text-gray-900">{row.description || '-'}</td>
                                                            </tr>
                                                        ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <div
                                                    className="px-3 py-2 text-[11px] text-gray-500 border-t border-gray-100">
                                                    {t('documents.detail.revisions.parsedFromDrawing')}
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                className="text-center py-8 text-sm text-gray-500 border border-dashed border-gray-200 rounded-lg">
                                                {t('documents.detail.revisions.noData')}
                                            </div>
                                        )}
                                    </div>
                                );
                            }

                            if (activeReportTab === 'comments') {
                                if (!canComment) {
                                    return (
                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-semibold text-gray-900">{t('documents.detail.comments.title')}</h3>
                                                <span
                                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                          {t('documents.detail.upgrade')}
                        </span>
                                            </div>

                                            <div
                                                className="text-xs text-gray-600 bg-gray-50 border border-dashed border-gray-200 rounded-lg px-3 py-3">
                                                {t('documents.detail.comments.lockedPrefix')}{' '}
                                                <Link to={`/${lang}/app/settings/billing`}
                                                      className="text-blue-600 hover:underline font-medium">
                                                    {t('documents.detail.billing')}
                                                </Link>{' '}
                                                {t('documents.detail.comments.lockedSuffix')}
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div className="flex flex-col gap-4 min-h-0">
                                        {commentsError && (
                                            <div
                                                className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
                                                {commentsError}
                                            </div>
                                        )}

                                        <div
                                            className="border border-gray-200 rounded-lg bg-white overflow-auto min-h-0 max-h-[40vh] sm:max-h-[320px]">
                                            {commentsLoading ? (
                                                <div
                                                    className="flex items-center justify-center py-8 text-gray-500 text-sm">
                                                    <Loader className="w-4 h-4 mr-2 animate-spin" strokeWidth={1.5}/>
                                                    {t('documents.detail.comments.loading')}
                                                </div>
                                            ) : comments.length === 0 ? (
                                                <div
                                                    className="flex items-center justify-center py-8 text-gray-400 text-sm">
                                                    {t('documents.detail.comments.empty')}
                                                </div>
                                            ) : (
                                                <ul className="divide-y divide-gray-100">
                                                    {comments.map(c => (
                                                        <li key={c.id}
                                                            className="px-4 py-3 text-sm hover:bg-slate-50/70">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div className="min-w-0">
                                                                    <div
                                                                        className="flex items-center gap-2 mb-1 flex-wrap">
                                    <span className="font-medium text-gray-900">
                                      {c.author_name || t('documents.detail.comments.userFallback')}
                                    </span>
                                                                        {c.created_at && (
                                                                            <span className="text-[11px] text-gray-500">
                                        {new Date(c.created_at).toLocaleString()}
                                      </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-gray-800 whitespace-pre-line break-words">{c.body}</p>
                                                                </div>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>

                                        <form
                                            onSubmit={async e => {
                                                e.preventDefault();
                                                if (!newComment.trim()) return;
                                                await addComment(newComment);
                                                setNewComment('');
                                            }}
                                            className="space-y-2"
                                        >
                                            <label className="text-xs font-medium text-gray-700">
                                                {t('documents.detail.comments.addLabel')}
                                            </label>
                                            <textarea
                                                value={newComment}
                                                onChange={e => setNewComment(e.target.value)}
                                                rows={3}
                                                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                                placeholder={t('documents.detail.comments.placeholder')}
                                            />
                                            <div className="flex justify-end">
                                                <button
                                                    type="submit"
                                                    disabled={!newComment.trim()}
                                                    className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-500 transition-colors"
                                                >
                                                    {t('documents.detail.comments.addButton')}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                );
                            }

                            // Report default
                            return (
                                <div className="space-y-4">
                                    {overview?.quick_summary && (
                                        <div
                                            className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4">
                                            <h3 className="text-sm font-semibold text-blue-900 mb-2">{t('documents.detail.report.summary')}</h3>
                                            <p className="text-sm text-blue-800 leading-relaxed">{overview.quick_summary}</p>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        {assessment?.overall_complexity && (
                                            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{t('documents.detail.report.complexity')}</dt>
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
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{t('documents.detail.report.riskLevel')}</dt>
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
                                            <div
                                                className="bg-slate-50 border border-slate-200 rounded-lg p-3 col-span-2">
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{t('documents.detail.report.highlights')}</dt>
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
                                            <div
                                                className="bg-slate-50 border border-slate-200 rounded-lg p-3 col-span-2">
                                                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{t('documents.detail.report.shopAlignment')}</dt>
                                                <dd className="text-sm">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span
                                                            className="text-gray-700">{t('documents.detail.report.fit')}:</span>
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
                                                    <div
                                                        className="text-xs text-gray-900">{assessment.shop_alignment.fit_summary}</div>
                                                    {assessment?.shop_alignment?.fit_level === 'UNKNOWN' && (
                                                        <div
                                                            className="mt-3 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                                                            {t('documents.detail.report.fillOrgProfileNote')}
                                                        </div>
                                                    )}
                                                </dd>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        {costDrivers && Array.isArray(costDrivers) && (
                                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => toggleSection('cost')}
                                                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                                                >
                          <span className="text-sm font-semibold text-gray-900">
                            {t('documents.detail.sections.costDrivers')}
                              <span
                                  className="ml-1 italic text-[11px] text-gray-500">{t('documents.detail.sections.quoteCentric')}</span>
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
                                                                    <span
                                                                        className="text-sm font-semibold text-gray-900">{driver.factor}</span>
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

                                        {processHints && (
                                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => toggleSection('processing')}
                                                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                                                >
                                                    <span
                                                        className="text-sm font-semibold text-gray-900">{t('documents.detail.sections.processingHints')}</span>
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
                                                                    {t('documents.detail.processing.routingSteps')}
                                                                </dt>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {processHints.likely_routing_steps.map((step: string, idx: number) => (
                                                                        <span key={idx}
                                                                              className="text-xs bg-gray-100 px-2 py-1 rounded">
                                      {step}
                                    </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}

                                                        {processHints.machine_capability_hint && (
                                                            <div>
                                                                <dt className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                                                                    {t('documents.detail.processing.machineCapability')}
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
                                                                    {t('documents.detail.processing.inspectionFocus')}
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

                                        {criticalPoints && Array.isArray(criticalPoints) && (
                                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => toggleSection('critical')}
                                                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                                                >
                          <span className="text-sm font-semibold text-gray-900">
                            {t('documents.detail.sections.criticalPoints')}
                              <span
                                  className="ml-1 italic text-[11px] text-gray-500">{t('documents.detail.sections.productionCentric')}</span>
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
                                                                    <span
                                                                        className="text-sm font-semibold text-gray-900 capitalize">{String(point.type || '').replace(/_/g, ' ')}</span>
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

                                        {(assessment?.key_risks || assessment?.key_opportunities) && (
                                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => toggleSection('risks')}
                                                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                                                >
                                                    <span
                                                        className="text-sm font-semibold text-gray-900">{t('documents.detail.sections.keyRisksOpportunities')}</span>
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
                                                                <dt className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-2">{t('documents.detail.sections.risks')}</dt>
                                                                <ul className="space-y-2">
                                                                    {assessment.key_risks.map((risk: string, idx: number) => (
                                                                        <li key={idx}
                                                                            className="text-sm text-gray-900 pl-4 border-l-2 border-red-300">
                                                                            {risk}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        )}

                                                        {assessment.key_opportunities && Array.isArray(assessment.key_opportunities) && (
                                                            <div>
                                                                <dt className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-2">
                                                                    {t('documents.detail.sections.opportunities')}
                                                                </dt>
                                                                <ul className="space-y-2">
                                                                    {assessment.key_opportunities.map((opp: string, idx: number) => (
                                                                        <li key={idx}
                                                                            className="text-sm text-gray-900 pl-4 border-l-2 border-green-300">
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

                                        {internalNotes && Array.isArray(internalNotes) && (
                                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                                <button
                                                    onClick={() => toggleSection('notes')}
                                                    className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between transition-colors"
                                                >
                                                    <span
                                                        className="text-sm font-semibold text-gray-900">{t('documents.detail.sections.internalNotes')}</span>
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
                                                                <li key={idx}
                                                                    className="text-sm text-gray-700 pl-4 border-l-2 border-gray-300">
                                                                    {note}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Tags */}
                                    <TagsPanel
                                        t={t}
                                        lang={lang}
                                        canUseTags={canUseTags}
                                        selectedPart={selectedPart}
                                        tags={tags as any}
                                        tagsLoading={tagsLoading}
                                        tagsError={tagsError}
                                        newTag={newTag}
                                        setNewTag={setNewTag}
                                        addTag={addTag}
                                        removeTag={removeTag}
                                    />
                                </div>
                            );
                        })()
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            <p>{t('documents.detail.noAnalysisData')}</p>
                            <TagsPanel
                                t={t}
                                lang={lang}
                                canUseTags={canUseTags}
                                selectedPart={selectedPart}
                                tags={tags as any}
                                tagsLoading={tagsLoading}
                                tagsError={tagsError}
                                newTag={newTag}
                                setNewTag={setNewTag}
                                addTag={addTag}
                                removeTag={removeTag}
                            />
                        </div>
                    )}
                </div>

                {/* Right / Preview */}
                <div
                    className={`bg-white border border-gray-200 rounded-xl shadow-sm p-4 sm:p-6 xl:col-span-3 min-h-0 ${mobileMainTab === 'details' ? 'hidden xl:block' : ''}`}>
                    <div className="mb-4">
                        <RenderHeader
                            t={t}
                            selectedPart={selectedPart}
                            partRenderUrl={partRenderUrl}
                            zoom={zoom}
                            onZoomOut={handleZoomOut}
                            onZoomIn={handleZoomIn}
                            onReset={handleResetZoom}
                            onFullscreen={toggleFullscreen}
                        />
                    </div>

                    <RenderCanvas
                        t={t}
                        normalContainerRef={normalContainerRef}
                        imageRef={imageRef}
                        imageLoading={imageLoading}
                        partRenderUrl={partRenderUrl}
                        selectedPartId={selectedPartId}
                        imageAspectRatio={imageAspectRatio}
                        zoom={zoom}
                        isDragging={isDragging}
                        position={position}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseLeave}
                        onWheel={handleWheel}
                    />

                    {/* Keep the “extra info blocks” under the render (unchanged logic, only minor responsive tweaks) */}
                    {selectedPart?.report_json &&
                        (() => {
                            const reportJson = selectedPart.report_json as any;
                            const drawingInfo = reportJson.drawing_info;
                            const overview = reportJson.overview;

                            if (!drawingInfo && !overview) return null;

                            return (
                                <div
                                    className="mt-6 bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
                                    {drawingInfo && (
                                        <div className="p-4 sm:p-6">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('documents.detail.drawingInfo.title')}</h3>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {drawingInfo.drawing_number && (
                                                    <div>
                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                            {t('documents.detail.drawingInfo.drawingNumber')}
                                                        </dt>
                                                        <dd className="text-sm text-gray-900 break-words">{drawingInfo.drawing_number}</dd>
                                                    </div>
                                                )}
                                                {drawingInfo.drawing_title && (
                                                    <div>
                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                            {t('documents.detail.drawingInfo.titleLabel')}
                                                        </dt>
                                                        <dd className="text-sm text-gray-900 break-words">{drawingInfo.drawing_title}</dd>
                                                    </div>
                                                )}
                                                {drawingInfo.part_number && (
                                                    <div>
                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                            {t('documents.detail.drawingInfo.partNumber')}
                                                        </dt>
                                                        <dd className="text-sm text-gray-900 break-words">{drawingInfo.part_number}</dd>
                                                    </div>
                                                )}
                                                {drawingInfo.revision && (
                                                    <div>
                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                            {t('documents.detail.drawingInfo.revision')}
                                                        </dt>
                                                        <dd className="text-sm text-gray-900 flex items-center gap-2 flex-wrap">
                                                            <span>{drawingInfo.revision}</span>
                                                            {drawingInfo.revision_change_text && (
                                                                <span
                                                                    className="text-xs text-amber-700 font-medium">({drawingInfo.revision_change_text})</span>
                                                            )}
                                                        </dd>
                                                    </div>
                                                )}
                                                {drawingInfo.date && (
                                                    <div>
                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{t('documents.detail.drawingInfo.date')}</dt>
                                                        <dd className="text-sm text-gray-900">{drawingInfo.date}</dd>
                                                    </div>
                                                )}
                                                {drawingInfo.revision_date && (
                                                    <div>
                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                            {t('documents.detail.drawingInfo.revisionDate')}
                                                        </dt>
                                                        <dd className="text-sm text-gray-900">{drawingInfo.revision_date}</dd>
                                                    </div>
                                                )}
                                                {drawingInfo.scale && (
                                                    <div>
                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{t('documents.detail.drawingInfo.scale')}</dt>
                                                        <dd className="text-sm text-gray-900">{drawingInfo.scale}</dd>
                                                    </div>
                                                )}
                                                {drawingInfo.base_unit && (
                                                    <div>
                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{t('documents.detail.drawingInfo.units')}</dt>
                                                        <dd className="text-sm text-gray-900">{drawingInfo.base_unit}</dd>
                                                    </div>
                                                )}
                                                {drawingInfo.author && (
                                                    <div>
                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{t('documents.detail.drawingInfo.author')}</dt>
                                                        <dd className="text-sm text-gray-900 break-words">{drawingInfo.author}</dd>
                                                    </div>
                                                )}
                                                {drawingInfo.checker && (
                                                    <div>
                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{t('documents.detail.drawingInfo.checker')}</dt>
                                                        <dd className="text-sm text-gray-900 break-words">{drawingInfo.checker}</dd>
                                                    </div>
                                                )}
                                                {drawingInfo.approver && (
                                                    <div>
                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{t('documents.detail.drawingInfo.approver')}</dt>
                                                        <dd className="text-sm text-gray-900 break-words">{drawingInfo.approver}</dd>
                                                    </div>
                                                )}
                                                {drawingInfo.sheet_info && (
                                                    <div>
                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{t('documents.detail.drawingInfo.sheet')}</dt>
                                                        <dd className="text-sm text-gray-900">
                                                            {drawingInfo.sheet_info.sheet} {t('documents.detail.drawingInfo.of')} {drawingInfo.sheet_info.total_sheets}
                                                        </dd>
                                                    </div>
                                                )}
                                                {drawingInfo.projection_type && (
                                                    <div>
                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                            {t('documents.detail.drawingInfo.projectionType')}
                                                        </dt>
                                                        <dd className="text-sm text-gray-900 capitalize">{drawingInfo.projection_type}</dd>
                                                    </div>
                                                )}
                                                {drawingInfo.company_name && (
                                                    <div>
                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{t('documents.detail.drawingInfo.company')}</dt>
                                                        <dd className="text-sm text-gray-900 break-words">{drawingInfo.company_name}</dd>
                                                    </div>
                                                )}
                                                {drawingInfo.project_name && (
                                                    <div>
                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{t('documents.detail.drawingInfo.project')}</dt>
                                                        <dd className="text-sm text-gray-900 break-words">{drawingInfo.project_name}</dd>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {overview && (overview.material || overview.blank_dimensions) && (
                                        <div className="p-4 sm:p-6">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                                {overview.material && (
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('documents.detail.material.title')}</h3>
                                                        <div className="space-y-3">
                                                            {overview.material.value && (
                                                                <div>
                                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                                        {t('documents.detail.material.labels.material')}
                                                                    </dt>
                                                                    <dd className="text-sm text-gray-900 break-words">{overview.material.value}</dd>
                                                                </div>
                                                            )}
                                                            {overview.material.text && (
                                                                <div>
                                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{t('documents.detail.material.labels.note')}</dt>
                                                                    <dd className="text-sm text-gray-900 break-words">{overview.material.text}</dd>
                                                                </div>
                                                            )}
                                                            {overview.weight && overview.weight.value != null && (
                                                                <div>
                                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{t('documents.detail.material.labels.weight')}</dt>
                                                                    <dd className="text-sm text-gray-900">
                                                                        {overview.weight.value} {overview.weight.unit}
                                                                    </dd>
                                                                </div>
                                                            )}
                                                            {overview.material.confidence !== undefined && overview.material.confidence !== null && (
                                                                <div>
                                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                                        {t('documents.detail.material.labels.confidence')}
                                                                    </dt>
                                                                    <dd className="text-sm text-gray-900">{(overview.material.confidence * 100).toFixed(0)}%</dd>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {overview.blank_dimensions && (
                                                    <div>
                                                        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('documents.detail.blankDimensions.title')}</h3>
                                                        <div className="space-y-3">
                                                            {overview.blank_dimensions.text_norm && (
                                                                <div>
                                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                                        {t('documents.detail.blankDimensions.labels.dimensions')}
                                                                    </dt>
                                                                    <dd className="text-sm text-gray-900 break-words">{overview.blank_dimensions.text_norm}</dd>
                                                                </div>
                                                            )}
                                                            {overview.blank_dimensions.text && (
                                                                <div>
                                                                    <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{t('documents.detail.blankDimensions.labels.note')}</dt>
                                                                    <dd className="text-sm text-gray-900 break-words">{overview.blank_dimensions.text}</dd>
                                                                </div>
                                                            )}
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {overview.blank_dimensions.unit && (
                                                                    <div>
                                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{t('documents.detail.blankDimensions.labels.unit')}</dt>
                                                                        <dd className="text-sm text-gray-900">{overview.blank_dimensions.unit}</dd>
                                                                    </div>
                                                                )}
                                                                {overview.blank_dimensions.source && (
                                                                    <div>
                                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                                            {t('documents.detail.blankDimensions.labels.source')}
                                                                        </dt>
                                                                        <dd className="text-sm text-gray-900 break-words">{overview.blank_dimensions.source}</dd>
                                                                    </div>
                                                                )}
                                                                {overview.blank_dimensions.confidence !== undefined && overview.blank_dimensions.confidence !== null && (
                                                                    <div>
                                                                        <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                                                                            {t('documents.detail.blankDimensions.labels.confidence')}
                                                                        </dt>
                                                                        <dd className="text-sm text-gray-900">{(overview.blank_dimensions.confidence * 100).toFixed(0)}%</dd>
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
                </div>
            </div>
        </div>
    );
};

export default DocumentDetail;
